;;; ============================================================================
;;;  KOTLA.lsp  -  Polyline uzerinde otomatik KOT (yukseklik) etiketleme
;;; ----------------------------------------------------------------------------
;;;  AMAC:
;;;    Donusler ve YAY (arc) parcalari iceren uzun bir polyline uzerinde,
;;;    belli bir baslangic kotundan belli bir egimle ilerleyen guzergah icin;
;;;    her VERTEX, her segmentin ORTA NOKTASI ve UC NOKTALAR icin olmasi
;;;    gereken kotu hesaplar. Her noktadan ilk secilen "eksen / referans"
;;;    cizgiye DIK bir cizgi indirir ve ucuna hesaplanan kot degerini yazar.
;;;
;;;  KOT HESABI:
;;;    mesafe = polyline basindan o noktaya kadarki yol uzunlugu
;;;             (yaylar gercek yay boyu ile - vlax-curve fonksiyonlari).
;;;    kot    = baslangic_kotu + egim * mesafe
;;;
;;;    Egim, % olarak girilir (orn: 2.5 -> %2.5 -> 0.025 birim/birim).
;;;    Egim bos birakilirsa, bitis kotu sorulur ve egim,
;;;    (bitis_kotu - baslangic_kotu) / toplam_uzunluk olarak hesaplanir.
;;;
;;;  KULLANIM:
;;;    1) Komut satirina  KOTLA  yazin.
;;;    2) Eksen / referans cizgiyi secin (dik cizgiler bu hatta inecek).
;;;    3) Kotlanacak polyline'i secin.
;;;    4) Baslangic kotunu girin.
;;;    5) Egimi (%) girin  -veya-  ENTER ile gecip bitis kotunu girin.
;;;    6) Yon, ondalik ve yazi yuksekligi sorularini yanitlayin.
;;;
;;;  OLUSTURULAN KATMANLAR (yoksa otomatik acilir):
;;;    KOT_DIK   -> dik (ordinat) cizgileri
;;;    KOT_YAZI  -> kot yazilari (TEXT)
;;; ============================================================================

(vl-load-com)

;;; --- Yardimci: katman yoksa olustur --------------------------------------
(defun kotla:ensure-layer (name col / )
  (if (not (tblsearch "LAYER" name))
    (entmake
      (list '(0 . "LAYER")
            '(100 . "AcDbSymbolTableRecord")
            '(100 . "AcDbLayerTableRecord")
            (cons 2 name)
            (cons 70 0)
            (cons 62 col)
            '(6 . "Continuous"))))
  name)

;;; --- Yardimci: 3B nokta cikti (z yoksa 0) --------------------------------
(defun kotla:3p (p)
  (list (car p) (cadr p) (if (caddr p) (caddr p) 0.0)))

;;; --- Yardimci: vektor nokta carpimi (dot) --------------------------------
(defun kotla:dot (a b)
  (+ (* (car a) (car b)) (* (cadr a) (cadr b)) (* (caddr a) (caddr b))))

;;; --- Yardimci: bir noktanin sonsuz dogruya (p1 + t*dirv) dik izdusumu -----
(defun kotla:foot (pt p1 dirv / v tparam)
  (setq v      (mapcar '- pt p1)
        tparam (kotla:dot v dirv))                ; dirv birim vektor olmali
  (mapcar '+ p1 (mapcar '(lambda (x) (* x tparam)) dirv)))

;;; ===========================================================================
;;;  ANA KOMUT
;;; ===========================================================================
(defun c:KOTLA ( / *error* refEnt refTyp plEnt plTyp
                   p1 p2 dirv dlen ang
                   plLen ep i vdists prev dists d pt sta kot
                   startKot egimPct slope endKot revFlag
                   decim txtH gap dirPF dd textPos n)

  (defun *error* (msg)
    (if (and msg
             (/= msg "Function cancelled")
             (/= msg "quit / exit abort"))
      (princ (strcat "\n** Hata: " msg)))
    (princ))

  (princ "\n=== POLYLINE KOT ETIKETLEME (KOTLA) ===")

  ;; --- 1) Eksen / referans cizgi secimi -----------------------------------
  (setq refEnt (car (entsel "\nEksen / referans cizgiyi secin: ")))
  (while (or (null refEnt)
             (not (member (setq refTyp (cdr (assoc 0 (entget refEnt))))
                          '("LINE" "LWPOLYLINE" "POLYLINE"))))
    (princ "\n  >> Lutfen bir LINE veya POLYLINE secin.")
    (setq refEnt (car (entsel "\nEksen / referans cizgiyi secin: "))))

  ;; Eksen yon vektoru: baslangic-bitis noktalarindan birim vektor.
  (setq p1   (kotla:3p (vlax-curve-getStartPoint refEnt))
        p2   (kotla:3p (vlax-curve-getEndPoint   refEnt))
        dirv (mapcar '- p2 p1)
        dlen (distance p1 p2))
  (if (< dlen 1e-9)
    (progn (princ "\n** Gecersiz (sifir boylu) eksen cizgisi.") (exit)))
  (setq dirv (mapcar '(lambda (x) (/ x dlen)) dirv))   ; birim vektor

  ;; Yazi acisi: eksene paralel, okunabilir olmasi icin yukari cevrilir.
  (setq ang (angle p1 p2))
  (if (and (> ang (* 0.5 pi)) (<= ang (* 1.5 pi)))
    (setq ang (- ang pi)))

  ;; --- 2) Kotlanacak polyline secimi --------------------------------------
  (setq plEnt (car (entsel "\nKotlanacak polyline'i secin: ")))
  (while (or (null plEnt)
             (not (member (setq plTyp (cdr (assoc 0 (entget plEnt))))
                          '("LWPOLYLINE" "POLYLINE" "LINE"))))
    (princ "\n  >> Lutfen bir polyline (veya LINE) secin.")
    (setq plEnt (car (entsel "\nKotlanacak polyline'i secin: "))))

  (setq ep    (vlax-curve-getEndParam plEnt)
        plLen (vlax-curve-getDistAtParam plEnt ep))
  (if (< plLen 1e-9)
    (progn (princ "\n** Gecersiz (sifir boylu) polyline.") (exit)))

  ;; --- 3) Baslangic kotu ---------------------------------------------------
  (setq startKot (getreal "\nBaslangic kotu: "))
  (while (null startKot)
    (princ "\n  >> Bir sayi girin.")
    (setq startKot (getreal "\nBaslangic kotu: ")))

  ;; --- 4) Egim (%) veya bitis kotu ----------------------------------------
  (initget 0)
  (setq egimPct (getreal "\nEgim [%] (ENTER = bitis kotundan hesapla): "))
  (if egimPct
    (setq slope (/ egimPct 100.0))                 ; birim/birim
    (progn
      (setq endKot (getreal "\nBitis kotu: "))
      (while (null endKot)
        (princ "\n  >> Bir sayi girin.")
        (setq endKot (getreal "\nBitis kotu: ")))
      (setq slope (/ (- endKot startKot) plLen))))

  ;; --- 5) Yon (polyline baslangici ters cevrilsin mi?) --------------------
  (initget "Evet Hayir E H")
  (setq revFlag (getkword "\nYon ters cevrilsin mi? [Evet/Hayir] <Hayir>: "))
  (setq revFlag (member revFlag '("Evet" "E")))

  ;; --- 6) Ondalik basamak ve yazi yuksekligi ------------------------------
  (initget 4)                                       ; negatif olamaz
  (setq decim (getint "\nKot ondalik basamak sayisi <2>: "))
  (if (null decim) (setq decim 2))

  (initget 6)                                       ; sifir/negatif olamaz
  (setq txtH (getreal "\nYazi yuksekligi <2.5>: "))
  (if (null txtH) (setq txtH 2.5))
  (setq gap (* txtH 0.8))

  ;; --- Katmanlar -----------------------------------------------------------
  (kotla:ensure-layer "KOT_DIK"  3)                 ; yesil
  (kotla:ensure-layer "KOT_YAZI" 2)                 ; sari

  ;; --- Ornek noktalarin mesafelerini topla --------------------------------
  ;; vertex mesafeleri (tam sayi parametreler = polyline koseleri)
  (setq i 0 vdists '())
  (while (<= i ep)
    (setq vdists (cons (vlax-curve-getDistAtParam plEnt i) vdists)
          i      (1+ i)))
  (setq vdists (reverse vdists))
  ;; Bitis tam sayi parametreye denk gelmiyorsa son noktayi da ekle
  (if (> (- plLen (car (reverse vdists))) 1e-6)
    (setq vdists (append vdists (list plLen))))

  ;; vertexler + her segmentin orta noktasi (mesafe ortasi -> yayda yay ortasi)
  (setq dists '() prev nil)
  (foreach d vdists
    (if prev (setq dists (cons (/ (+ prev d) 2.0) dists)))
    (setq dists (cons d dists)
          prev  d))
  (setq dists (reverse dists))

  ;; --- Her ornek nokta icin dik cizgi + kot yazisi ------------------------
  (setq n 0)
  (foreach d dists
    (setq pt  (kotla:3p (vlax-curve-getPointAtDist plEnt d))
          sta (if revFlag (- plLen d) d)            ; secilen yone gore mesafe
          kot (+ startKot (* slope sta)))

    ;; Eksen uzerindeki dik ayagi (foot)
    (setq foot (kotla:foot pt p1 dirv))

    ;; Dik (ordinat) cizgisi: noktadan eksene
    (entmake (list '(0 . "LINE")
                   (cons 8 "KOT_DIK")
                   (cons 10 pt)
                   (cons 11 foot)))

    ;; Yazi konumu: eksenin pt'nin karsi tarafinda, kucuk bir bosluk ile
    (setq dd (distance pt foot))
    (if (> dd 1e-9)
      (setq dirPF (mapcar '(lambda (x) (/ x dd)) (mapcar '- foot pt)))
      (setq dirPF (list (- (cadr dirv)) (car dirv) 0.0)))   ; eksene dik normal
    (setq textPos (mapcar '+ foot (mapcar '(lambda (x) (* x gap)) dirPF)))

    ;; Kot yazisi (orta-orta hizali)
    (entmake (list '(0 . "TEXT")
                   (cons 8 "KOT_YAZI")
                   (cons 10 textPos)
                   (cons 11 textPos)
                   (cons 40 txtH)
                   (cons 50 ang)
                   (cons 1 (rtos kot 2 decim))
                   (cons 72 1)                       ; yatay: orta
                   (cons 73 2)))                      ; dikey: orta

    (setq n (1+ n)))

  ;; --- Ozet ---------------------------------------------------------------
  (princ (strcat "\n----------------------------------------"
                 "\n Toplam uzunluk : " (rtos plLen 2 3)
                 "\n Egim           : %" (rtos (* slope 100.0) 2 4)
                 "\n Baslangic kotu : " (rtos startKot 2 decim)
                 "\n Bitis kotu     : " (rtos (+ startKot (* slope plLen)) 2 decim)
                 "\n Etiket sayisi  : " (itoa n)
                 (if revFlag "\n Yon            : TERS" "")
                 "\n----------------------------------------"))
  (princ "\nKOTLA tamamlandi.")
  (princ))

(princ "\nKOTLA.lsp yuklendi. Komut: KOTLA")
(princ)
