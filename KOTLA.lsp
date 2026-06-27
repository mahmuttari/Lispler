;;; ============================================================================
;;;  KOTLA.lsp  -  Yol guzergahi (alyman) uzerinde ENKESIT cizgileri + KOT
;;; ----------------------------------------------------------------------------
;;;  AMAC:
;;;    Donusler ve YAY (arc) parcalari iceren uzun bir polyline (yol alymani)
;;;    uzerinde; her VERTEX, her segmentin ORTA NOKTASI ve UC NOKTALAR icin,
;;;    polyline'in O NOKTADAKI yerel TEGETINE DIK birer ENKESIT cizgisi cizer.
;;;    Cizgiler, ilk secilen ornek (sablon) enkesit cizgisi ile AYNI BOYDA olur.
;;;    Her enkesit cizgisinin ucuna, o noktanin olmasi gereken KOTU yazilir.
;;;    Enkesit cizgilerinin Z koordinati = hesaplanan kot (kotlu / 3B, yatay).
;;;    Tum enkesitlerin TAM ORTA noktalarindan gecen, Z=kot olan bir "kotlu
;;;    eksen" cizgisi (ardisik LINE parcalari) olusturulur.
;;;
;;;  ENKESIT CIZGISI:
;;;    - Yon : polyline'in o noktadaki tegetine DIK (yaylarda da yerel teget).
;;;    - Boy : ilk secilen ornek cizginin boyu.
;;;    - Sol/Sag dagilim: Ornek cizgi alymani KESIYORSA, kesim noktasinin
;;;      soluna/saguna dusen uzunluklar korunur (asimetrik enkesit destegi).
;;;      Kesmiyorsa cizgi noktada SIMETRIK (her iki yana esit) cizilir.
;;;
;;;  KOT HESABI:
;;;    mesafe = polyline basindan o noktaya kadarki yol uzunlugu
;;;             (yaylar gercek yay boyu ile - vlax-curve fonksiyonlari).
;;;    kot    = baslangic_kotu + egim * mesafe
;;;    Egim % olarak girilir (orn 2.5 -> 0.025). Bos birakilirsa bitis kotu
;;;    sorulur, egim = (bitis - baslangic) / toplam_uzunluk olarak hesaplanir.
;;;
;;;  KULLANIM:
;;;    1) KOTLA komutunu calistirin.
;;;    2) Ornek (sablon) enkesit cizgisini secin  -> boy ve sol/sag dagilim.
;;;       (Sol/sag farkli olsun isterseniz bu cizgiyi alymani keser sekilde cizin.)
;;;    3) Yol alymani (polyline) secin.
;;;    4) Baslangic kotunu girin.
;;;    5) Egimi (%) girin  -veya-  ENTER ile gecip bitis kotunu girin.
;;;    6) Yon, ondalik ve yazi yuksekligi sorularini yanitlayin.
;;;
;;;  KATMANLAR (yoksa otomatik acilir):
;;;    ENKESIT    -> enkesit cizgileri (Z=kot)   (yesil)
;;;    KOT_YAZI   -> kot yazilari (TEXT)          (sari)
;;;    KOT_EKSEN  -> orta noktalardan gecen kotlu eksen (kirmizi)
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

;;; --- Yardimci: 3B nokta (z yoksa 0) --------------------------------------
(defun kotla:3p (p)
  (list (car p) (cadr p) (if (caddr p) (caddr p) 0.0)))

;;; --- Yardimci: birim vektor ----------------------------------------------
(defun kotla:unit (v / L)
  (setq L (sqrt (+ (* (car v) (car v)) (* (cadr v) (cadr v)) (* (caddr v) (caddr v)))))
  (if (< L 1e-12)
    (list 0.0 0.0 0.0)
    (mapcar '(lambda (x) (/ x L)) v)))

;;; --- Yardimci: vektoru +90 dondur (sol normal) ---------------------------
(defun kotla:perpL (v)
  (list (- (cadr v)) (car v) 0.0))

;;; --- Yardimci: 2B capraz carpimin z bileseni (yon/taraf tayini) ----------
(defun kotla:crossz (a b)
  (- (* (car a) (cadr b)) (* (cadr a) (car b))))

;;; --- Yardimci: noktanin curve uzerindeki yerel birim tegeti --------------
(defun kotla:tangent (curve d / par der)
  (setq par (vlax-curve-getParamAtDist curve d)
        der (vlax-curve-getFirstDeriv  curve par))
  (kotla:unit (kotla:3p der)))

;;; ===========================================================================
;;;  ANA KOMUT
;;; ===========================================================================
(defun c:KOTLA ( / *error* tmplEnt plEnt plTyp
                   A B Ltot leftLen rightLen
                   plObj tmObj il C Cp Tc wa wb sa sb
                   plLen ep i vdists prev dists d pt sta kot
                   startKot egimPct slope endKot revFlag
                   decim txtH gap Tg Nl e1 e2 tAng tpos n mids prevm m)

  (defun *error* (msg)
    (if (and msg
             (/= msg "Function cancelled")
             (/= msg "quit / exit abort"))
      (princ (strcat "\n** Hata: " msg)))
    (princ))

  (princ "\n=== YOL ALYMANI ENKESIT + KOT (KOTLA) ===")

  ;; --- 1) Ornek (sablon) enkesit cizgisi ----------------------------------
  (setq tmplEnt (car (entsel "\nOrnek enkesit cizgisini secin (LINE): ")))
  (while (or (null tmplEnt)
             (/= (cdr (assoc 0 (entget tmplEnt))) "LINE"))
    (princ "\n  >> Lutfen bir LINE secin (ornek enkesit).")
    (setq tmplEnt (car (entsel "\nOrnek enkesit cizgisini secin (LINE): "))))
  (setq A    (kotla:3p (vlax-curve-getStartPoint tmplEnt))
        B    (kotla:3p (vlax-curve-getEndPoint   tmplEnt))
        Ltot (distance A B))
  (if (< Ltot 1e-9)
    (progn (princ "\n** Gecersiz (sifir boylu) ornek cizgi.") (exit)))

  ;; --- 2) Yol alymani (polyline) ------------------------------------------
  (setq plEnt (car (entsel "\nYol alymanini (polyline) secin: ")))
  (while (or (null plEnt)
             (not (member (setq plTyp (cdr (assoc 0 (entget plEnt))))
                          '("LWPOLYLINE" "POLYLINE" "LINE" "ARC" "SPLINE"))))
    (princ "\n  >> Lutfen bir polyline / line / arc secin.")
    (setq plEnt (car (entsel "\nYol alymanini (polyline) secin: "))))
  (setq ep    (vlax-curve-getEndParam plEnt)
        plLen (vlax-curve-getDistAtParam plEnt ep))
  (if (< plLen 1e-9)
    (progn (princ "\n** Gecersiz (sifir boylu) polyline.") (exit)))

  ;; --- Ornek cizginin sol/sag dagilimini coz -------------------------------
  ;; Ornek cizgi alymani kesiyorsa: kesim noktasinin sol/sag uzunluklarini al.
  ;; Kesmiyorsa: simetrik (her iki yana Ltot/2).
  (setq leftLen (/ Ltot 2.0) rightLen (/ Ltot 2.0))   ; varsayilan: simetrik
  (setq plObj (vlax-ename->vla-object plEnt)
        tmObj (vlax-ename->vla-object tmplEnt)
        il    (vl-catch-all-apply
                '(lambda () (vlax-invoke tmObj 'IntersectWith plObj 0))))
  (if (and (not (vl-catch-all-error-p il)) il (>= (length il) 3))
    (progn
      (setq C  (kotla:3p (list (car il) (cadr il) (caddr il)))
            Cp (kotla:3p (vlax-curve-getClosestPointTo plEnt C))
            Tc (kotla:tangent plEnt (vlax-curve-getDistAtPoint plEnt Cp))
            wa (mapcar '- A Cp)
            wb (mapcar '- B Cp)
            sa (kotla:crossz Tc wa)        ; >0 ise A sol tarafta
            sb (kotla:crossz Tc wb))
      (cond
        ((and (> sa 0) (< sb 0))
         (setq leftLen (distance Cp A) rightLen (distance Cp B)))
        ((and (< sa 0) (> sb 0))
         (setq leftLen (distance Cp B) rightLen (distance Cp A)))
        (T (princ "\n  (Not: ornek cizgi alymani net kesmiyor; simetrik cizilecek.)")))))

  ;; --- 3) Baslangic kotu ---------------------------------------------------
  (setq startKot (getreal "\nBaslangic kotu: "))
  (while (null startKot)
    (princ "\n  >> Bir sayi girin.")
    (setq startKot (getreal "\nBaslangic kotu: ")))

  ;; --- 4) Egim (%) veya bitis kotu ----------------------------------------
  (initget 0)
  (setq egimPct (getreal "\nEgim [%] (ENTER = bitis kotundan hesapla): "))
  (if egimPct
    (setq slope (/ egimPct 100.0))
    (progn
      (setq endKot (getreal "\nBitis kotu: "))
      (while (null endKot)
        (princ "\n  >> Bir sayi girin.")
        (setq endKot (getreal "\nBitis kotu: ")))
      (setq slope (/ (- endKot startKot) plLen))))

  ;; --- 5) Yon --------------------------------------------------------------
  (initget "Evet Hayir E H")
  (setq revFlag (getkword "\nYon ters cevrilsin mi? [Evet/Hayir] <Hayir>: "))
  (setq revFlag (and revFlag (member revFlag '("Evet" "E"))))

  ;; --- 6) Ondalik ve yazi yuksekligi --------------------------------------
  (initget 4)
  (setq decim (getint "\nKot ondalik basamak sayisi <2>: "))
  (if (null decim) (setq decim 2))
  (initget 6)
  (setq txtH (getreal "\nYazi yuksekligi <2.5>: "))
  (if (null txtH) (setq txtH 2.5))
  (setq gap (* txtH 0.8))

  ;; --- Katmanlar -----------------------------------------------------------
  (kotla:ensure-layer "ENKESIT"   3)
  (kotla:ensure-layer "KOT_YAZI"  2)
  (kotla:ensure-layer "KOT_EKSEN" 1)

  ;; --- Ornek nokta mesafelerini topla (vertex + segment orta noktasi) -----
  (setq i 0 vdists '())
  (while (<= i ep)
    (setq vdists (cons (vlax-curve-getDistAtParam plEnt i) vdists)
          i      (1+ i)))
  (setq vdists (reverse vdists))
  (if (> (- plLen (car (reverse vdists))) 1e-6)
    (setq vdists (append vdists (list plLen))))
  (setq dists '() prev nil)
  (foreach d vdists
    (if prev (setq dists (cons (/ (+ prev d) 2.0) dists)))
    (setq dists (cons d dists)
          prev  d))
  (setq dists (reverse dists))

  ;; --- Her ornek nokta: enkesit cizgisi + kot yazisi ----------------------
  (setq n 0 mids '())
  (foreach d dists
    (setq pt  (kotla:3p (vlax-curve-getPointAtDist plEnt d))
          sta (if revFlag (- plLen d) d)
          kot (+ startKot (* slope sta))
          Tg  (kotla:tangent plEnt d)             ; yerel birim teget
          Nl  (kotla:perpL Tg)                    ; sol normal (tegete dik)
          e1  (mapcar '+ pt (mapcar '(lambda (x) (* x leftLen))  Nl))  ; sol uc
          e2  (mapcar '- pt (mapcar '(lambda (x) (* x rightLen)) Nl))) ; sag uc

    ;; Z koordinati = hesaplanan kot (enkesit kotlu / 3B, yatay)
    (setq e1   (list (car e1) (cadr e1) kot)
          e2   (list (car e2) (cadr e2) kot)
          m    (list (/ (+ (car e1)  (car e2))  2.0)   ; cizginin tam ortasi
                     (/ (+ (cadr e1) (cadr e2)) 2.0)
                     kot)
          mids (cons m mids))

    ;; Enkesit cizgisi (alymana dik, Z = kot)
    (entmake (list '(0 . "LINE")
                   (cons 8 "ENKESIT")
                   (cons 10 e1)
                   (cons 11 e2)))

    ;; Kot yazisi: sol ucun biraz disinda, cizgi yonunde, okunabilir
    (setq tAng (angle '(0 0 0) Nl))
    (if (and (> tAng (* 0.5 pi)) (<= tAng (* 1.5 pi)))
      (setq tAng (- tAng pi)))
    (setq tpos (mapcar '+ e1 (mapcar '(lambda (x) (* x gap)) Nl)))
    (entmake (list '(0 . "TEXT")
                   (cons 8 "KOT_YAZI")
                   (cons 10 tpos)
                   (cons 11 tpos)
                   (cons 40 txtH)
                   (cons 50 tAng)
                   (cons 1 (rtos kot 2 decim))
                   (cons 72 1)
                   (cons 73 2)))
    (setq n (1+ n)))

  ;; --- Enkesitlerin tam orta noktalarindan gecen kotlu eksen (LINE) -------
  (setq mids (reverse mids) prevm nil)
  (foreach m mids
    (if prevm
      (entmake (list '(0 . "LINE")
                     (cons 8 "KOT_EKSEN")
                     (cons 10 prevm)
                     (cons 11 m))))
    (setq prevm m))

  ;; --- Ozet ----------------------------------------------------------------
  (princ (strcat "\n----------------------------------------"
                 "\n Toplam uzunluk : " (rtos plLen 2 3)
                 "\n Enkesit boyu   : " (rtos Ltot 2 3)
                 " (sol " (rtos leftLen 2 2) " / sag " (rtos rightLen 2 2) ")"
                 "\n Egim           : %" (rtos (* slope 100.0) 2 4)
                 "\n Baslangic kotu : " (rtos startKot 2 decim)
                 "\n Bitis kotu     : " (rtos (+ startKot (* slope plLen)) 2 decim)
                 "\n Enkesit sayisi : " (itoa n)
                 "\n Eksen parcasi  : " (itoa (max 0 (1- (length mids))))
                 (if revFlag "\n Yon            : TERS" "")
                 "\n----------------------------------------"))
  (princ "\nKOTLA tamamlandi.")
  (princ))

(princ "\nKOTLA.lsp yuklendi. Komut: KOTLA")
(princ)
