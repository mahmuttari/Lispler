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
;;;
;;; Yazilan Bilgiler:
;;;   - Baca Adi (ornek: BPB107)
;;;   - Zemin Kotu ZK (ornek: ZK:23.70)
;;;   - Akar Kotu AK (ornek: AK:22.30)
;;;   - Yatay Mesafe YL (ornek: YL=6.15m)
;;;   - Egik Mesafe EL (ornek: EL=6.26m)
;;;   - Hat Capi (sabit: O200BB)
;;;===========================================================================

(defun C:PARCELBACA (/ cBagNokta parselNokta hatEnt cZeminEnt pZeminEnt
                       cBagX cBagY parselX parselY
                       cNoktaAdi parselBacaAdi
                       cZK cAK pZK pAK
                       hatYatayMesafe hatEgikMesafe
                       hatAci yaziAci perpX perpY
                       deltaZ yaziYukseklik satirAraligi noktaOffset
                       yaziRenk)

  ;; Yapilandirma
  (setq yaziYukseklik 0.35)
  (setq satirAraligi 0.55)
  (setq noktaOffset 0.5)
  (setq yaziRenk 6)

  ;; OSMODE kaydet ve kapat
  (setq eskiOsmode (getvar "OSMODE"))
  (setvar "OSMODE" 0)

  ;; Mevcut rengi kaydet
  (setq eskiRenk (getvar "CECOLOR"))

  ;;---------------------------------------------------------
  ;; 1. ADIM: C Baglanti Noktasini Sec
  ;;---------------------------------------------------------
  (setq cBagNokta (getpoint "\n1/5 - C baglanti noktasini secin: "))
  (if (null cBagNokta)
    (progn
      (princ "\nIslem iptal edildi.")
      (setvar "OSMODE" eskiOsmode)
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
      (exit)
    )
  )

  ;; Hat bilgilerini oku
  (setq hatData (entget (car hatEnt)))
  (setq hatBaslangic (cdr (assoc 10 hatData)))
  (setq hatBitis (cdr (assoc 11 hatData)))

  ;; Yatay mesafe (2D)
  (setq hatYatayMesafe (distance
    (list (car hatBaslangic) (cadr hatBaslangic))
    (list (car hatBitis) (cadr hatBitis))
  ))

  ;; Egik mesafe (3D) - eger Z degerleri varsa
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
      (exit)
    )
  )

  ;; C noktasi bilgilerini oku
  (setq cZeminData (entget (car cZeminEnt)))
  (setq cNoktaAdi (nokta-adi-oku cZeminData))
  (setq cZK (nokta-z-oku cZeminData))
  (setq cAK (nokta-ak-oku (car cZeminEnt)))

  ;;---------------------------------------------------------
  ;; 5. ADIM: Parsel Bacasi Zemin Noktasini Sec
  ;;---------------------------------------------------------
  (setq pZeminEnt (entsel "\n5/5 - Parsel bacasi zemin noktasini secin: "))
  (if (null pZeminEnt)
    (progn
      (princ "\nIslem iptal edildi.")
      (setvar "OSMODE" eskiOsmode)
      (exit)
    )
  )

  ;; Parsel bacasi bilgilerini oku
  (setq pZeminData (entget (car pZeminEnt)))
  (setq parselBacaAdi (nokta-adi-oku pZeminData))
  (setq pZK (nokta-z-oku pZeminData))
  (setq pAK (nokta-ak-oku (car pZeminEnt)))

  ;;---------------------------------------------------------
  ;; Hesaplamalar
  ;;---------------------------------------------------------

  ;; Hat acisi (C noktasindan parsel bacasina)
  (setq hatAci (angle (list cBagX cBagY) (list parselX parselY)))

  ;; Yazi acisi (okunabilirlik icin 0-PI arasinda tut)
  (setq yaziAci hatAci)
  (if (> yaziAci pi) (setq yaziAci (- yaziAci pi)))
  (if (and (> yaziAci (/ pi 2)) (<= yaziAci pi))
    (setq yaziAci (- yaziAci pi))
  )

  ;; Dik yon (text offset icin)
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
  ;; PARSEL BACA BILGILERINI YAZ (Baca noktasinda)
  ;;---------------------------------------------------------
  (setvar "CECOLOR" (itoa yaziRenk))

  ;; Satir 0: Baca Adi
  (yazi-yerlestir parselX parselY parselBacaAdi
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 0)

  ;; Satir 1: Zemin Kotu
  (yazi-yerlestir parselX parselY
                  (strcat "ZK:" (rtos pZK 2 2))
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 1)

  ;; Satir 2: Akar Kotu
  (yazi-yerlestir parselX parselY
                  (strcat "AK:" (rtos pAK 2 2))
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 2)

  ;; Satir 3: Yatay Mesafe
  (yazi-yerlestir parselX parselY
                  (strcat "YL=" (rtos hatYatayMesafe 2 2) "m")
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 3)

  ;; Satir 4: Egik Mesafe
  (yazi-yerlestir parselX parselY
                  (strcat "EL=" (rtos hatEgikMesafe 2 2) "m")
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 4)

  ;; Satir 5: Hat Capi (sabit)
  (yazi-yerlestir parselX parselY
                  "O200BB"
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 5)

  ;;---------------------------------------------------------
  ;; C BAGLANTI NOKTASI BILGILERINI YAZ
  ;;---------------------------------------------------------

  ;; Satir 0: C Nokta Adi
  (yazi-yerlestir cBagX cBagY cNoktaAdi
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 0)

  ;; Satir 1: C Zemin Kotu
  (yazi-yerlestir cBagX cBagY
                  (strcat "ZK:" (rtos cZK 2 2))
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 1)

  ;; Satir 2: C Akar Kotu
  (yazi-yerlestir cBagX cBagY
                  (strcat "AK:" (rtos cAK 2 2))
                  yaziAci yaziYukseklik perpX perpY noktaOffset satirAraligi 2)

  ;;---------------------------------------------------------
  ;; HAT ORTASINA MESAFE BILGISI YAZ
  ;;---------------------------------------------------------
  (setq ortaX (/ (+ cBagX parselX) 2.0))
  (setq ortaY (/ (+ cBagY parselY) 2.0))

  (setq mesafeYaziX (+ ortaX (* perpX (* noktaOffset 0.5))))
  (setq mesafeYaziY (+ ortaY (* perpY (* noktaOffset 0.5))))

  (command "TEXT"
    (list mesafeYaziX mesafeYaziY)
    yaziYukseklik
    (* (/ yaziAci pi) 180.0)
    (rtos hatYatayMesafe 2 2)
  )

  ;;---------------------------------------------------------
  ;; Eski ayarlari geri yukle
  ;;---------------------------------------------------------
  (setvar "CECOLOR" eskiRenk)
  (setvar "OSMODE" eskiOsmode)

  (princ (strcat "\nParsel baca baglanti bilgileri yazildi."
                 "\nBaca: " parselBacaAdi
                 " | C Noktasi: " cNoktaAdi
                 " | YL=" (rtos hatYatayMesafe 2 2) "m"
                 " | EL=" (rtos hatEgikMesafe 2 2) "m"))
  (princ)
)

;;;===========================================================================
;;; YARDIMCI FONKSIYONLAR
;;;===========================================================================

(defun yazi-yerlestir (baseX baseY metin aci yukseklik
                       perpX perpY noktaOffset satirAraligi satirNo
                       / tx ty)
  (setq tx (+ baseX
              (* perpX noktaOffset)
              (* perpX satirAraligi satirNo)))
  (setq ty (+ baseY
              (* perpY noktaOffset)
              (* perpY satirAraligi satirNo)))

  (command "TEXT"
    (list tx ty)
    yukseklik
    (* (/ aci pi) 180.0)
    metin
  )
)

(defun nokta-adi-oku (entData / adi)
  ;; Nokta adini DXF verisinden oku
  ;; DXF 2: Blok adi, DXF 1: Text icerigi
  (setq adi (cdr (assoc 2 entData)))
  (if (null adi)
    (progn
      (setq adi (cdr (assoc 1 entData)))
      (if (null adi)
        (setq adi "NONAME")
      )
    )
  )
  adi
)

(defun nokta-z-oku (entData / nokta zDeger)
  ;; Z degerini DXF verisinden oku
  (setq nokta (cdr (assoc 10 entData)))
  (if (and nokta (caddr nokta))
    (setq zDeger (caddr nokta))
    (progn
      ;; DXF 38 (yukseklik) kontrol et
      (setq zDeger (cdr (assoc 38 entData)))
      (if (null zDeger)
        (setq zDeger 0.0)
      )
    )
  )
  zDeger
)

(defun nokta-ak-oku (entName / xdata akDeger)
  ;; Akar kotunu extended data veya ozelliklerden oku
  ;; NetCAD nokta ozelligi olarak AK degerini ara
  (setq xdata (entget entName '("AK")))
  (if xdata
    (progn
      (setq akDeger (cdr (assoc 1040 (cdr (assoc -3 xdata)))))
      (if (null akDeger) (setq akDeger 0.0))
    )
    (progn
      ;; XDATA bulunamazsa kullanicidan sor
      (setq akDeger (getreal
        (strcat "\nAkar Kotu (AK) bulunamadi. Deger girin: ")))
      (if (null akDeger) (setq akDeger 0.0))
    )
  )
  akDeger
)

(princ "\nAtiksu Parsel Baca Baglanti Makrosu yuklendi.")
(princ "\nKomut: PARCELBACA")
(princ)
