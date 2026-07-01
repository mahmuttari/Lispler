;;;===========================================================================
;;; ATIKSU PARSEL BACA BAGLANTI BILGILERI YAZMA MAKROSU
;;; NetCAD LISP (AutoLISP uyumlu)
;;;
;;; Kullanim: Komut satirina PARCELBACA yazin
;;;
;;; Islem Sirasi:
;;;   1. C baglanti noktasi secilir
;;;   2. Parsel baca noktasi secilir
;;;   3. Ikisi arasindaki hat cizgisi secilir
;;;   4. C noktasi zemin noktasi secilir (ZK ve AK okunur)
;;;   5. Parsel bacasi zemin noktasi secilir (ZK ve AK okunur)
;;;   6. Bilgiler hesaplanir ve formata uygun yazilir
;;;   7. Kullanici isterse bir sonraki baglantiya gecer
;;;===========================================================================

(defun C:PARCELBACA (/ cBagNokta parselNokta hatEnt cZeminEnt pZeminEnt
                       cBagX cBagY parselX parselY
                       cNoktaAdi parselBacaAdi
                       cZK cAK pZK pAK
                       hatYatayMesafe hatEgikMesafe
                       hatAci yaziAci perpX perpY
                       deltaZ yaziYukseklik satirAraligi noktaOffset
                       yaziRenk hatCapiMetin katmanAdi
                       eskiOsmode eskiRenk eskiKatman
                       devamMi sayac tempVal
                       hatData hatBaslangic hatBitis
                       cZeminData pZeminData
                       ortaX ortaY mesafeYaziX mesafeYaziY
                       yaziX yaziY tx ty satirSayaci metin)

  ;; Yapilandirma
  (setq yaziYukseklik 0.35)
  (setq satirAraligi 0.55)
  (setq noktaOffset 0.5)
  (setq yaziRenk 6)
  (setq hatCapiMetin "O200BB")
  (setq katmanAdi "PARSEL_BACA_BILGI")
  (setq sayac 0)

  ;; Kullanicidan ayar iste
  (setq tempVal (getreal "\nYazi yuksekligi (varsayilan 0.35) <0.35>: "))
  (if tempVal (setq yaziYukseklik tempVal))

  (setq tempVal (getreal "\nSatir araligi (varsayilan 0.55) <0.55>: "))
  (if tempVal (setq satirAraligi tempVal))

  (setq tempVal (getstring "\nHat capi metni (varsayilan O200BB) <O200BB>: "))
  (if (and tempVal (/= tempVal "")) (setq hatCapiMetin tempVal))

  ;; Mevcut ayarlari kaydet
  (setq eskiOsmode (getvar "OSMODE"))
  (setq eskiRenk (getvar "CECOLOR"))
  (setq eskiKatman (getvar "CLAYER"))

  ;; Katman olustur/ayarla
  (command "LAYER" "M" katmanAdi "C" (itoa yaziRenk) katmanAdi "")

  ;; ===============================================================
  ;; ANA DONGU - Coklu baglanti islemi
  ;; ===============================================================
  (setq devamMi T)

  (while devamMi

    (setq sayac (1+ sayac))
    (setvar "OSMODE" 0)

    ;;---------------------------------------------------------
    ;; 1. ADIM: C Baglanti Noktasini Sec
    ;;---------------------------------------------------------
    (setq cBagNokta (getpoint "\n1/5 - C baglanti noktasini secin: "))
    (if (null cBagNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (exit)
      )
    )
    (setq cBagX (car cBagNokta))
    (setq cBagY (cadr cBagNokta))

    ;;---------------------------------------------------------
    ;; 2. ADIM: Parsel Baca Noktasini Sec
    ;;---------------------------------------------------------
    (setq parselNokta (getpoint "\n2/5 - Parsel baca noktasini secin: "))
    (if (null parselNokta)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (exit)
      )
    )
    (setq parselX (car parselNokta))
    (setq parselY (cadr parselNokta))

    ;;---------------------------------------------------------
    ;; 3. ADIM: Hat Cizgisini Sec
    ;;---------------------------------------------------------
    (setq hatEnt (entsel "\n3/5 - Hat cizgisini secin: "))
    (if (null hatEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
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
    ;; 4. ADIM: C Noktasi Zemin Noktasini Sec
    ;;---------------------------------------------------------
    (setq cZeminEnt (entsel "\n4/5 - C noktasinin zemin noktasini secin: "))
    (if (null cZeminEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (exit)
      )
    )

    (setq cZeminData (entget (car cZeminEnt)))
    (setq cNoktaAdi (nokta-adi-oku cZeminData))
    (setq cZK (nokta-z-oku cZeminData))

    ;; AK degerini oku, bulunamazsa kullanicidan iste
    (setq cAK (nokta-ak-oku (car cZeminEnt)))
    (if (= cAK 0.0)
      (progn
        (setq tempVal (getreal
          (strcat "\nC noktasi (" cNoktaAdi ") AK bulunamadi. AK degerini girin: ")))
        (if tempVal (setq cAK tempVal))
      )
    )

    ;;---------------------------------------------------------
    ;; 5. ADIM: Parsel Bacasi Zemin Noktasini Sec
    ;;---------------------------------------------------------
    (setq pZeminEnt (entsel "\n5/5 - Parsel bacasi zemin noktasini secin: "))
    (if (null pZeminEnt)
      (progn
        (princ "\nIslem iptal edildi.")
        (setvar "OSMODE" eskiOsmode)
        (setvar "CECOLOR" eskiRenk)
        (exit)
      )
    )

    (setq pZeminData (entget (car pZeminEnt)))
    (setq parselBacaAdi (nokta-adi-oku pZeminData))
    (setq pZK (nokta-z-oku pZeminData))

    ;; AK degerini oku, bulunamazsa kullanicidan iste
    (setq pAK (nokta-ak-oku (car pZeminEnt)))
    (if (= pAK 0.0)
      (progn
        (setq tempVal (getreal
          (strcat "\nParsel bacasi (" parselBacaAdi ") AK bulunamadi. AK degerini girin: ")))
        (if tempVal (setq pAK tempVal))
      )
    )

    ;;---------------------------------------------------------
    ;; Hesaplamalar
    ;;---------------------------------------------------------
    (setq hatAci (angle (list cBagX cBagY) (list parselX parselY)))

    ;; Yazi acisi (okunabilirlik icin)
    (setq yaziAci hatAci)
    (if (> yaziAci pi) (setq yaziAci (- yaziAci pi)))
    (if (and (> yaziAci (/ pi 2)) (<= yaziAci pi))
      (setq yaziAci (- yaziAci pi))
    )

    ;; Dik yon
    (setq perpX (- (sin hatAci)))
    (setq perpY (cos hatAci))

    ;; Egik mesafe kontrolu
    (if (<= hatEgikMesafe 0)
      (progn
        (setq deltaZ (abs (- pZK cZK)))
        (setq hatEgikMesafe (sqrt (+ (* hatYatayMesafe hatYatayMesafe)
                                      (* deltaZ deltaZ))))
      )
    )

    ;;---------------------------------------------------------
    ;; RENK ve KATMAN AYARLA
    ;;---------------------------------------------------------
    (setvar "CECOLOR" (itoa yaziRenk))
    (setvar "CLAYER" katmanAdi)

    ;;---------------------------------------------------------
    ;; PARSEL BACA BILGILERINI YAZ (6 satir)
    ;;---------------------------------------------------------
    (setq satirSayaci 0)
    (setq yaziX (+ parselX (* perpX noktaOffset)))
    (setq yaziY (+ parselY (* perpY noktaOffset)))

    ;; Satir 0: Baca Adi
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty parselBacaAdi yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; Satir 1: Zemin Kotu
    (setq metin (strcat "ZK:" (kot-format pZK)))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; Satir 2: Akar Kotu
    (setq metin (strcat "AK:" (kot-format pAK)))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; Satir 3: Yatay Mesafe
    (setq metin (strcat "YL=" (kot-format hatYatayMesafe) "m"))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; Satir 4: Egik Mesafe
    (setq metin (strcat "EL=" (kot-format hatEgikMesafe) "m"))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; Satir 5: Hat Capi
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty hatCapiMetin yaziYukseklik yaziAci)

    ;;---------------------------------------------------------
    ;; C BAGLANTI NOKTASI BILGILERINI YAZ (3 satir)
    ;;---------------------------------------------------------
    (setq satirSayaci 0)
    (setq yaziX (+ cBagX (* perpX noktaOffset)))
    (setq yaziY (+ cBagY (* perpY noktaOffset)))

    ;; C Nokta Adi
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty cNoktaAdi yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; C Zemin Kotu
    (setq metin (strcat "ZK:" (kot-format cZK)))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)
    (setq satirSayaci (1+ satirSayaci))

    ;; C Akar Kotu
    (setq metin (strcat "AK:" (kot-format cAK)))
    (setq tx (+ yaziX (* perpX (* satirAraligi satirSayaci))))
    (setq ty (+ yaziY (* perpY (* satirAraligi satirSayaci))))
    (yazi-olustur tx ty metin yaziYukseklik yaziAci)

    ;;---------------------------------------------------------
    ;; HAT ORTASINA MESAFE BILGISI YAZ
    ;;---------------------------------------------------------
    (setq ortaX (/ (+ cBagX parselX) 2.0))
    (setq ortaY (/ (+ cBagY parselY) 2.0))
    (setq mesafeYaziX (+ ortaX (* perpX (* noktaOffset 0.5))))
    (setq mesafeYaziY (+ ortaY (* perpY (* noktaOffset 0.5))))
    (yazi-olustur mesafeYaziX mesafeYaziY (kot-format hatYatayMesafe) yaziYukseklik yaziAci)

    ;;---------------------------------------------------------
    ;; Devam kontrolu
    ;;---------------------------------------------------------
    (princ (strcat "\n--- Baglanti #" (itoa sayac) " tamamlandi ---"))
    (princ (strcat "\nBaca: " parselBacaAdi " | C: " cNoktaAdi))
    (princ (strcat "\nYL=" (kot-format hatYatayMesafe) "m  EL=" (kot-format hatEgikMesafe) "m"))

    (initget "Evet Hayir")
    (setq tempVal (getkword "\nBir sonraki baglantiya devam? [Evet/Hayir] <Evet>: "))
    (if (= tempVal "Hayir")
      (setq devamMi nil)
    )

  ) ;; while sonu

  ;; Eski ayarlari geri yukle
  (setvar "OSMODE" eskiOsmode)
  (setvar "CECOLOR" eskiRenk)
  (setvar "CLAYER" eskiKatman)

  (princ (strcat "\nMakro tamamlandi. Toplam " (itoa sayac) " baglanti islendi."))
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
  ;; Kot degerini "0.00" formatinda string olarak dondurur
  (if (< deger 0)
    (progn (setq isaret "-") (setq tempDeger (- deger)))
    (progn (setq isaret "") (setq tempDeger deger))
  )
  (setq tamKisim (fix tempDeger))
  (setq ondalik (fix (+ (* (- tempDeger tamKisim) 100) 0.5)))
  (if (>= ondalik 100)
    (progn
      (setq tamKisim (1+ tamKisim))
      (setq ondalik 0)
    )
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
