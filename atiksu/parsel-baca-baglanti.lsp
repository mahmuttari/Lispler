;;;===========================================================================
;;; ATIKSU PARSEL BACA BAGLANTI BILGILERI YAZMA MAKROSU
;;; NetCAD LISP (AutoLISP uyumlu)
;;;
;;; Kullanim: Komut satirina PARCELBACA yazin
;;;
;;; Islem Sirasi:
;;;   1. C baglanti noktasi secilir
;;;   2. Parsel baca noktasi secilir
;;;   3. Hat cizgisi secilir
;;;   4. C zemin noktasi secilir (ad, ZK, AK okunur)
;;;   5. Parsel baca zemin noktasi secilir (ad, ZK, AK okunur)
;;;   6. PARSEL BACA text grubu fare ile istenen noktaya yerlestirilir
;;;   7. C BAGLANTI text grubu fare ile istenen noktaya yerlestirilir
;;;   8. Devam/Cik secenegi
;;;
;;; Text Gruplari:
;;;   PARSEL BACA (6 satir): Ad, ZK, AK, YL, EL, Cap
;;;   C BAGLANTI  (3 satir): Ad, ZK, AK
;;;===========================================================================

(defun C:PARCELBACA (/ cBagNokta parselNokta hatEnt cZeminEnt pZeminEnt
                       cBagX cBagY parselX parselY
                       cNoktaAdi parselBacaAdi
                       cZK cAK pZK pAK
                       hatYatayMesafe hatEgikMesafe
                       hatAci yaziAci perpX perpY
                       deltaZ yaziYukseklik satirAraligi
                       yaziRenk hatCapiMetin katmanAdi
                       eskiOsmode eskiRenk eskiKatman
                       devamMi sayac tempVal
                       hatData hatBaslangic hatBitis
                       cZeminData pZeminData
                       yerNokta yerX yerY
                       tx ty metin)

  ;; Yapilandirma
  (setq yaziYukseklik 0.35)
  (setq satirAraligi 0.55)
  (setq yaziRenk 6)
  (setq hatCapiMetin "O200BB")
  (setq katmanAdi "PARSEL_BACA_BILGI")
  (setq sayac 0)

  ;; Kullanicidan ayar iste
  (setq tempVal (getreal "\nYazi yuksekligi <0.35>: "))
  (if tempVal (setq yaziYukseklik tempVal))

  (setq tempVal (getreal "\nSatir araligi <0.55>: "))
  (if tempVal (setq satirAraligi tempVal))

  (setq tempVal (getstring "\nHat capi metni <O200BB>: "))
  (if (and tempVal (/= tempVal "")) (setq hatCapiMetin tempVal))

  ;; Mevcut ayarlari kaydet
  (setq eskiOsmode (getvar "OSMODE"))
  (setq eskiRenk (getvar "CECOLOR"))
  (setq eskiKatman (getvar "CLAYER"))

  ;; Katman olustur/ayarla
  (command "LAYER" "M" katmanAdi "C" (itoa yaziRenk) katmanAdi "")

  ;; ===============================================================
  ;; ANA DONGU
  ;; ===============================================================
  (setq devamMi T)

  (while devamMi

    (setq sayac (1+ sayac))
    (setvar "OSMODE" 0)

    ;;---------------------------------------------------------
    ;; 1. C Baglanti Noktasini Sec
    ;;---------------------------------------------------------
    (setq cBagNokta (getpoint "\n1/5 - C baglanti noktasini secin: "))
    (if (null cBagNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )
    (setq cBagX (car cBagNokta))
    (setq cBagY (cadr cBagNokta))

    ;;---------------------------------------------------------
    ;; 2. Parsel Baca Noktasini Sec
    ;;---------------------------------------------------------
    (setq parselNokta (getpoint "\n2/5 - Parsel baca noktasini secin: "))
    (if (null parselNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )
    (setq parselX (car parselNokta))
    (setq parselY (cadr parselNokta))

    ;;---------------------------------------------------------
    ;; 3. Hat Cizgisini Sec
    ;;---------------------------------------------------------
    (setq hatEnt (entsel "\n3/5 - Hat cizgisini secin: "))
    (if (null hatEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )

    (setq hatData (entget (car hatEnt)))
    (setq hatBaslangic (cdr (assoc 10 hatData)))
    (setq hatBitis (cdr (assoc 11 hatData)))

    ;; Yatay mesafe (2D)
    (setq hatYatayMesafe (distance
      (list (car hatBaslangic) (cadr hatBaslangic))
      (list (car hatBitis) (cadr hatBitis))
    ))

    ;; Egik mesafe (3D)
    (if (and (caddr hatBaslangic) (caddr hatBitis))
      (setq hatEgikMesafe (distance hatBaslangic hatBitis))
      (setq hatEgikMesafe hatYatayMesafe)
    )

    ;;---------------------------------------------------------
    ;; 4. C Zemin Noktasini Sec
    ;;---------------------------------------------------------
    (setq cZeminEnt (entsel "\n4/5 - C noktasinin zemin noktasini secin: "))
    (if (null cZeminEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )

    (setq cZeminData (entget (car cZeminEnt)))
    (setq cNoktaAdi (nokta-adi-oku cZeminData))
    (setq cZK (nokta-z-oku cZeminData))

    (setq cAK (nokta-ak-oku (car cZeminEnt)))
    (if (= cAK 0.0)
      (progn
        (setq tempVal (getreal
          (strcat "\nC noktasi (" cNoktaAdi ") AK bulunamadi. AK girin: ")))
        (if tempVal (setq cAK tempVal))
      )
    )

    ;;---------------------------------------------------------
    ;; 5. Parsel Baca Zemin Noktasini Sec
    ;;---------------------------------------------------------
    (setq pZeminEnt (entsel "\n5/5 - Parsel bacasi zemin noktasini secin: "))
    (if (null pZeminEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )

    (setq pZeminData (entget (car pZeminEnt)))
    (setq parselBacaAdi (nokta-adi-oku pZeminData))
    (setq pZK (nokta-z-oku pZeminData))

    (setq pAK (nokta-ak-oku (car pZeminEnt)))
    (if (= pAK 0.0)
      (progn
        (setq tempVal (getreal
          (strcat "\nParsel bacasi (" parselBacaAdi ") AK bulunamadi. AK girin: ")))
        (if tempVal (setq pAK tempVal))
      )
    )

    ;;---------------------------------------------------------
    ;; Hesaplamalar
    ;;---------------------------------------------------------
    (setq hatAci (angle (list cBagX cBagY) (list parselX parselY)))

    (setq yaziAci hatAci)
    (if (> yaziAci pi) (setq yaziAci (- yaziAci pi)))
    (if (and (> yaziAci (/ pi 2)) (<= yaziAci pi))
      (setq yaziAci (- yaziAci pi))
    )

    (setq perpX (- (sin hatAci)))
    (setq perpY (cos hatAci))

    (if (<= hatEgikMesafe 0)
      (progn
        (setq deltaZ (abs (- pZK cZK)))
        (setq hatEgikMesafe (sqrt (+ (* hatYatayMesafe hatYatayMesafe)
                                      (* deltaZ deltaZ))))
      )
    )

    (setvar "CECOLOR" (itoa yaziRenk))
    (setvar "CLAYER" katmanAdi)

    ;;=========================================================
    ;; PARSEL BACA TEXT GRUBUNU YERLESTIR (6 satir)
    ;; Kullanici fare ile istenen noktayi tiklar
    ;;=========================================================
    (setq yerNokta (getpoint "\nPARSEL BACA text grubunu yerlestirecek noktayi secin: "))
    (if (null yerNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )
    (setq yerX (car yerNokta))
    (setq yerY (cadr yerNokta))

    ;; Satir 0: Baca Adi
    (yazi-olustur yerX yerY parselBacaAdi yaziYukseklik yaziAci)

    ;; Satir 1: Zemin Kotu
    (setq tx (+ yerX (* perpX satirAraligi)))
    (setq ty (+ yerY (* perpY satirAraligi)))
    (setq metin (strcat "ZK:" (kot-format pZK)))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;; Satir 2: Akar Kotu
    (setq tx (+ yerX (* perpX (* satirAraligi 2))))
    (setq ty (+ yerY (* perpY (* satirAraligi 2))))
    (setq metin (strcat "AK:" (kot-format pAK)))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;; Satir 3: Yatay Mesafe
    (setq tx (+ yerX (* perpX (* satirAraligi 3))))
    (setq ty (+ yerY (* perpY (* satirAraligi 3))))
    (setq metin (strcat "YL=" (kot-format hatYatayMesafe) "m"))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;; Satir 4: Egik Mesafe
    (setq tx (+ yerX (* perpX (* satirAraligi 4))))
    (setq ty (+ yerY (* perpY (* satirAraligi 4))))
    (setq metin (strcat "EL=" (kot-format hatEgikMesafe) "m"))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;; Satir 5: Hat Capi
    (setq tx (+ yerX (* perpX (* satirAraligi 5))))
    (setq ty (+ yerY (* perpY (* satirAraligi 5))))
    (yazi-olustur tx ty hatCapiMetin yaziYukseklik yaziAci)

    ;;=========================================================
    ;; C BAGLANTI TEXT GRUBUNU YERLESTIR (3 satir)
    ;; Kullanici fare ile istenen noktayi tiklar
    ;;=========================================================
    (setq yerNokta (getpoint "\nC BAGLANTI text grubunu yerlestirecek noktayi secin: "))
    (if (null yerNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (setvar "CLAYER" eskiKatman)
        (exit)
      )
    )
    (setq yerX (car yerNokta))
    (setq yerY (cadr yerNokta))

    ;; Satir 0: C Nokta Adi
    (yazi-olustur yerX yerY cNoktaAdi yaziYukseklik yaziAci)

    ;; Satir 1: C Zemin Kotu
    (setq tx (+ yerX (* perpX satirAraligi)))
    (setq ty (+ yerY (* perpY satirAraligi)))
    (setq metin (strcat "ZK:" (kot-format cZK)))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;; Satir 2: C Akar Kotu
    (setq tx (+ yerX (* perpX (* satirAraligi 2))))
    (setq ty (+ yerY (* perpY (* satirAraligi 2))))
    (setq metin (strcat "AK:" (kot-format cAK)))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;;---------------------------------------------------------
    ;; Devam kontrolu
    ;;---------------------------------------------------------
    (princ (strcat "\n--- Baglanti #" (itoa sayac) " tamamlandi ---"))
    (princ (strcat "\nBaca: " parselBacaAdi " | C: " cNoktaAdi))
    (princ (strcat "\nYL=" (kot-format hatYatayMesafe) "m  EL=" (kot-format hatEgikMesafe) "m"))

    (initget "Evet Hayir")
    (setq tempVal (getkword "\nDevam? [Evet/Hayir] <Evet>: "))
    (if (= tempVal "Hayir")
      (setq devamMi nil)
    )

  ) ;; while sonu

  ;; Eski ayarlari geri yukle
  (setvar "OSMODE" eskiOsmode)
  (setvar "CECOLOR" eskiRenk)
  (setvar "CLAYER" eskiKatman)

  (princ (strcat "\nToplam " (itoa sayac) " baglanti islendi."))
  (princ)
)

;;;===========================================================================
;;; YARDIMCI FONKSIYONLAR
;;;===========================================================================

(defun yazi-olustur (x y metin yukseklik aci)
  (command "TEXT"
    (list x y)
    yukseklik
    (* (/ aci pi) 180.0)
    metin
  )
)

(defun kot-format (deger / tamKisim ondalik sonuc isaret tempDeger)
  (if (< deger 0)
    (progn (setq isaret "-") (setq tempDeger (- deger)))
    (progn (setq isaret "") (setq tempDeger deger))
  )
  (setq tamKisim (fix tempDeger))
  (setq ondalik (fix (+ (* (- tempDeger tamKisim) 100) 0.5)))
  (if (>= ondalik 100)
    (progn (setq tamKisim (1+ tamKisim)) (setq ondalik 0))
  )
  (if (< ondalik 10)
    (setq sonuc (strcat isaret (itoa tamKisim) ".0" (itoa ondalik)))
    (setq sonuc (strcat isaret (itoa tamKisim) "." (itoa ondalik)))
  )
  sonuc
)

(defun nokta-adi-oku (entData / adi)
  (setq adi (cdr (assoc 2 entData)))
  (if (null adi)
    (progn
      (setq adi (cdr (assoc 1 entData)))
      (if (null adi) (setq adi "NONAME"))
    )
  )
  adi
)

(defun nokta-z-oku (entData / nokta zDeger)
  (setq nokta (cdr (assoc 10 entData)))
  (if (and nokta (caddr nokta))
    (setq zDeger (caddr nokta))
    (progn
      (setq zDeger (cdr (assoc 38 entData)))
      (if (null zDeger) (setq zDeger 0.0))
    )
  )
  zDeger
)

(defun nokta-ak-oku (entName / xdata akDeger)
  (setq akDeger 0.0)
  (setq xdata (entget entName '("AK")))
  (if xdata
    (progn
      (setq akDeger (cdr (assoc 1040 (cdr (assoc -3 xdata)))))
      (if (null akDeger) (setq akDeger 0.0))
    )
  )
  akDeger
)

(princ "\nAtiksu Parsel Baca Baglanti Makrosu yuklendi.")
(princ "\nKomut: PARCELBACA")
(princ)
