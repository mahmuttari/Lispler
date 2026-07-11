;;; ============================================================
;;; TEXT_TO_EXCEL_V19.LSP
;;; 1-12 sutun destegi
;;; Secilen nesneler KIRMIZI renk alir, komut bitince geri doner
;;; E komutu ile sutun sayisi degistirilebilir
;;; ============================================================

(defun TTE:cleanMtext (str / res i c)
  (setq res "" i 0)
  (while (< i (strlen str))
    (setq i (1+ i))
    (setq c (substr str i 1))
    (cond
      ((and (= c "\\") (< i (strlen str))
            (member (strcase (substr str (1+ i) 1)) '("P" "N")))
       (setq res (strcat res " ")) (setq i (1+ i)))
      ((and (= c "\\") (< i (strlen str))
            (= (substr str (1+ i) 1) "~"))
       (setq res (strcat res " ")) (setq i (1+ i)))
      ((or (= c "{") (= c "}")) nil)
      ((= c "\\")
       (while (and (< i (strlen str))
                   (/= (substr str (1+ i) 1) ";")
                   (/= (substr str (1+ i) 1) " "))
         (setq i (1+ i)))
       (if (and (< i (strlen str)) (= (substr str (1+ i) 1) ";"))
           (setq i (1+ i))))
      (t (setq res (strcat res c)))))
  res)

(defun TTE:sanitize (str)
  (if (not str) ""
    (vl-string-subst " " "\""
      (vl-string-subst " " ";" str))))

(defun TTE:getText (ent / ed typ)
  (setq ed  (entget ent)
        typ (cdr (assoc 0 ed)))
  (TTE:sanitize
    (if (= typ "MTEXT")
      (TTE:cleanMtext (cdr (assoc 1 ed)))
      (cdr (assoc 1 ed)))))

;;; --- Nesneyi kirmiziye boyar, eski rengi yedekler ---
(defun TTE:markEntity (ent / ed oldColor newEd)
  (setq ed (entget ent))
  (setq oldColor (cdr (assoc 62 ed)))
  (setq *TTE:colorBackup*
    (append *TTE:colorBackup*
            (list (cons ent (if oldColor oldColor 256)))))
  (if oldColor
    (setq newEd (subst (cons 62 1) (assoc 62 ed) ed))
    (setq newEd (append ed (list (cons 62 1)))))
  (entmod newEd)
  (entupd ent))

;;; --- Tum isaretli nesneleri eski rengine dondur ---
(defun TTE:restoreColors (/ pair ent oldColor ed newEd)
  (foreach pair *TTE:colorBackup*
    (setq ent      (car pair)
          oldColor (cdr pair))
    (setq ed (entget ent))
    (if (= oldColor 256)
      (setq newEd (vl-remove (assoc 62 ed) ed))
      (if (assoc 62 ed)
        (setq newEd (subst (cons 62 oldColor) (assoc 62 ed) ed))
        (setq newEd (append ed (list (cons 62 oldColor))))))
    (entmod newEd)
    (entupd ent))
  (setq *TTE:colorBackup* '()))

;;; --- Secim seti isle ---
(defun TTE:ssToItems (ss / i ent ed typ hdl txt result)
  (setq result '() i 0)
  (while (< i (sslength ss))
    (setq ent (ssname ss i)
          ed  (entget ent)
          typ (cdr (assoc 0 ed))
          hdl (cdr (assoc 5 ed)))
    (cond
      ((not (member typ '("TEXT" "MTEXT")))
       (princ (strcat "\n!! '" typ "' kabul edilmez, atlandi.")))
      ((member hdl *TTE:alreadySel*)
       (princ "\n!! Mukerrer nesne, atlandi."))
      (t
       (setq txt (TTE:getText ent))
       (setq *TTE:alreadySel* (append *TTE:alreadySel* (list hdl)))
       (TTE:markEntity ent)
       (setq result (append result (list txt)))))
    (setq i (1+ i)))
  result)

(defun TTE:timestamp (/ dstr tstr)
  (setq dstr (menucmd "M=$(edtime,$(getvar,date),YYYYMMDD)"))
  (setq tstr (menucmd "M=$(edtime,$(getvar,date),HH MM SS)"))
  (setq tstr (vl-string-subst "" " " tstr))
  (setq tstr (vl-string-subst "" " " tstr))
  (strcat dstr "_" tstr))

(defun TTE:uniquePath (/ ts)
  (setq ts (TTE:timestamp))
  (strcat (vl-string-right-trim "\\" (getvar "DWGPREFIX"))
          "ACAD_LISTE_" ts ".csv"))

(defun TTE:maxCols (rows / mx row)
  (setq mx 0)
  (foreach row rows
    (if (> (length row) mx) (setq mx (length row))))
  mx)

;;; --- Grup sayisi icin Turkce ek (unlu uyumu): 9'lu, 3'lu, 6'li, 12'li ---
(defun TTE:grpSuffix (n / tbl s)
  (setq tbl '((1 . "li") (2 . "li") (3 . "lu") (4 . "lu")  (5 . "li")  (6 . "li")
              (7 . "li") (8 . "li") (9 . "lu") (10 . "lu") (11 . "li") (12 . "li")))
  (setq s (cdr (assoc n tbl)))
  (if s s "li"))

(defun TTE:openFile (filePath / vbsPath vbsFile)
  (setq vbsPath (strcat (getenv "TEMP") "\\acad_open.vbs"))
  (setq vbsFile (open vbsPath "w"))
  (write-line "Set objShell = CreateObject(\"WScript.Shell\")" vbsFile)
  (write-line (strcat "objShell.Run \"\"\"" filePath "\"\"\"") vbsFile)
  (close vbsFile)
  (startapp "wscript" vbsPath))

(defun TTE:writeAndOpen (rows / filePath f i j line val maxCol)
  (if (= (length rows) 0)
    (progn (TTE:restoreColors) (alert "Hic veri yok!") (princ) (exit)))
  (setq maxCol (TTE:maxCols rows))
  (setq filePath (TTE:uniquePath))
  (setq f (open filePath "w"))
  (if (not f)
    (progn (TTE:restoreColors) (alert "HATA: Dosya yazılamadi!") (princ) (exit)))
  (setq line "" i 1)
  (while (<= i maxCol)
    (setq line (strcat line (if (> i 1) ";" "") "Sutun" (itoa i)))
    (setq i (1+ i)))
  (write-line line f)
  (foreach row rows
    (setq line "" j 0)
    (while (< j maxCol)
      (setq val (nth j row))
      (setq line (strcat line (if (> j 0) ";" "") (if val val "")))
      (setq j (1+ j)))
    (write-line line f))
  (close f)
  (TTE:restoreColors)
  (princ (strcat "\n>> Kaydedildi: " filePath))
  (TTE:openFile filePath)
  (alert (strcat "TAMAMLANDI!\n" (itoa (length rows))
                 " satir\n\nDosya: " filePath))
  (princ))

;;; ============================================================
;;; ANA KOMUT: TEXT2XL
;;; ============================================================
(defun c:TEXT2XL (/ colCount colTarget rows currentRow
                    done ss newItems txt inp newCol)
  (vl-load-com)

  (setq *TTE:alreadySel*  '())
  (setq *TTE:colorBackup* '())

  (princ "\n============================================")
  (princ "\n   TEXT TO EXCEL v19")
  (princ "\n--------------------------------------------")
  (princ "\n  Nesne sec : tek tik veya pencere/capraz")
  (princ "\n  Secilen nesneler KIRMIZI renk alir")
  (princ "\n  E + ENTER : sutun sayisini degistir (1-12)")
  (princ "\n  ENTER     : komutu bitir, Excel'i ac")
  (princ "\n  Renkler komut bitince otomatik eski haline doner")
  (princ "\n============================================\n")

  ;; Baslangic sutun sayisi: 1-12
  (setq colCount 0)
  (while (or (< colCount 1) (> colCount 12))
    (initget 1)
    (setq colCount (getint "\nBaslangic sutun sayisi (1-12): "))
    (if (or (< colCount 1) (> colCount 12))
      (princ "\n!! 1 ile 12 arasinda bir sayi girin.")))

  (setq colTarget colCount)
  (princ (strcat "\nAktif sutun sayisi: " (itoa colTarget)
                 " | E ile degistirebilirsiniz.\n"))

  (setq rows '() currentRow '() done 0)

  (while (= done 0)

    (princ (strcat "\n[Satir:" (itoa (1+ (length rows)))
                   " | " (itoa (length currentRow))
                   "/" (itoa colTarget)
                   " sutun] Sec / E / ENTER: "))

    (setq inp (strcase (getstring)))

    (cond
      ((= inp "")
       (setq done 1))

      ((= inp "E")
       (if (> (length currentRow) 0)
         (progn
           (setq rows (append rows (list currentRow)))
           (setq currentRow '())
           (princ (strcat "\n>>> Mevcut satir kaydedildi ("
                          (itoa (length (nth (1- (length rows)) rows)))
                          " sutun)."))))
       (setq newCol 0)
       (while (or (< newCol 1) (> newCol 12))
         (initget 1)
         (setq newCol (getint (strcat "\n  Yeni sutun sayisi (1-12) [Mevcut: "
                                      (itoa colTarget) "]: ")))
         (if (or (< newCol 1) (> newCol 12))
           (princ "\n!! 1-12 arasinda bir sayi girin.")))
       (setq colTarget newCol)
       (princ (strcat "\n  Sutun sayisi degistirildi -> " (itoa colTarget))))

      (t
       (princ "\n!! E=Sutun degistir | ENTER=Bitir")))

    (if (and (= done 0) (/= inp "E"))
      (progn
        (princ (strcat "\n[Satir:" (itoa (1+ (length rows)))
                       " | " (itoa (length currentRow))
                       "/" (itoa colTarget)
                       " sutun] Nesne sec (ENTER=Bitir): "))
        (setq ss (ssget '((0 . "TEXT,MTEXT"))))
        (if (null ss)
          (setq done 1)
          (progn
            (setq newItems (TTE:ssToItems ss))
            (foreach txt newItems
              (setq currentRow (append currentRow (list txt)))
              (princ (strcat "\n  + [" (itoa (length currentRow))
                             "/" (itoa colTarget) "] " txt))
              (if (>= (length currentRow) colTarget)
                (progn
                  (setq rows (append rows (list currentRow)))
                  (setq currentRow '())
                  (princ (strcat "\n>>> " (itoa (length rows)) ". "
                                 (itoa colTarget) "'" (TTE:grpSuffix colTarget)
                                 " grup secildi.")))))
            ;; Her secimden sonra: grup tamamlanmadiysa ilerleme bildir
            (if (> (length currentRow) 0)
              (princ (strcat "\n    (secili: " (itoa (length currentRow))
                             "/" (itoa colTarget)
                             " sutun; grup henuz tamamlanmadi)")))))))
  )

  (if (> (length currentRow) 0)
    (progn
      (setq rows (append rows (list currentRow)))
      (princ (strcat "\n>>> Son satir kaydedildi ("
                     (itoa (length currentRow)) " sutun)."))))

  (setq *TTE:alreadySel* '())
  (TTE:writeAndOpen rows))


;;; ============================================================
;;; PARSEL2XL : Parsel imalat textlerini SABIT sutun duzenine yerlestirir
;;; ------------------------------------------------------------
;;; Bir parselin textlerini HANGI SIRAYLA secerseniz secin, her text
;;; icerigindeki on eke gore hep AYNI sutuna gider. Bos sutunlar bos
;;; kalir. Eslesmeyen textler satir sonuna eklenir.
;;;
;;; SUTUN SEMASI (duzenlemek icin P2X:matchCol icindeki cond'u degistirin):
;;;    1 -> parsel/imalat no : SPB / BPB / EV ile baslar
;;;    2 -> A degeri         : "A:" ile baslar   (AK ile karismaz)
;;;    3 -> Z degeri         : "Z:" ile baslar   (ZK ile karismaz)
;;;    4 -> EL...            : "EL" ile baslar
;;;    5 -> YL...            : "YL" ile baslar
;;;    6 -> AK...            : "AK" ile baslar
;;;    7 -> ZK...            : "ZK" ile baslar
;;;    8 -> boru capi        : "%%C" / Ø / "...BB"
;;;    9 -> C-tipi no        : "C" ile baslar
;;; ============================================================

(setq *P2X:NCOL* 9)   ; toplam sabit sutun sayisi

;;; --- s metni pre on eki ile mi basliyor? ---
(defun P2X:starts (s pre)
  (and (>= (strlen s) (strlen pre))
       (= (substr s 1 (strlen pre)) pre)))

;;; --- boru capi text'i mi? (Ø / %%C / ...BB) ---
(defun P2X:isDia (s)
  (or (vl-string-search "%%C" s)
      (vl-string-search (chr 216) s)     ; Ø
      (vl-string-search "BB" s)))

;;; --- Bir text hangi sutuna gider? (yoksa nil) ---
(defun P2X:matchCol (txt / s)
  (setq s (strcase (vl-string-left-trim " " txt)))
  (cond
    ((P2X:starts s "ZK") 7)
    ((P2X:starts s "AK") 6)
    ((P2X:starts s "YL") 5)
    ((P2X:starts s "EL") 4)
    ((P2X:starts s "A:") 2)
    ((P2X:starts s "Z:") 3)
    ((or (P2X:starts s "SPB") (P2X:starts s "BPB") (P2X:starts s "EV")) 1)
    ((P2X:isDia s) 8)
    ((P2X:starts s "C") 9)
    (t nil)))

;;; --- n elemanli bos (nil) satir ---
(defun P2X:emptyRow (n / r)
  (setq r '())
  (repeat n (setq r (cons nil r)))
  r)

;;; --- lst listesinde idx konumuna val yaz (yeni liste dondur) ---
(defun P2X:setnth (lst idx val / i r)
  (setq i 0 r '())
  (foreach x lst
    (setq r (cons (if (= i idx) val x) r))
    (setq i (1+ i)))
  (reverse r))

;;; --- Secilen text listesinden sabit-duzenli satir kur ---
(defun P2X:buildRow (items / row extra col idx)
  (setq row (P2X:emptyRow *P2X:NCOL*) extra '())
  (foreach txt items
    (setq col (P2X:matchCol txt))
    (if (and col (<= col *P2X:NCOL*))
      (progn
        (setq idx (1- col))
        (if (nth idx row)
          (setq extra (append extra (list txt)))    ; sutun dolu -> fazladan
          (setq row (P2X:setnth row idx txt))))
      (setq extra (append extra (list txt)))))       ; eslesmeyen -> sona
  (append row extra))

;;; ============================================================
;;; ANA KOMUT: PARSEL2XL
;;; ============================================================
(defun c:PARSEL2XL (/ rows ss items row done label)
  (vl-load-com)
  (setq *TTE:alreadySel* '())
  (setq *TTE:colorBackup* '())

  (princ "\n============================================")
  (princ "\n   PARSEL -> EXCEL (sabit sutun duzeni)")
  (princ "\n--------------------------------------------")
  (princ "\n  Her parselin textlerini topluca secin.")
  (princ "\n  Sec sirasi onemsiz; text on ekine gore")
  (princ "\n  1..9 sutunlara otomatik yerlesir.")
  (princ "\n  ENTER (bos) : bitir, Excel'i ac")
  (princ "\n============================================\n")

  (setq rows '() done nil)
  (while (not done)
    (princ (strcat "\n[Parsel " (itoa (1+ (length rows)))
                   "] textleri secin (ENTER=Bitir): "))
    (setq ss (ssget '((0 . "TEXT,MTEXT"))))
    (if (null ss)
      (setq done t)
      (progn
        (setq items (TTE:ssToItems ss))
        (if items
          (progn
            (setq row   (P2X:buildRow items)
                  rows  (append rows (list row))
                  label (if (car row) (car row) "?"))
            (princ (strcat "\n>>> Parsel " (itoa (length rows))
                           " (" label ") : " (itoa (length items))
                           " text yerlestirildi.")))
          (princ "\n  !! Uygun text yok, atlandi.")))))

  (setq *TTE:alreadySel* '())
  (if rows
    (TTE:writeAndOpen rows)
    (progn (TTE:restoreColors) (princ "\nSecim yapilmadi.") (princ))))


(princ "\n>> Yuklendi. Komutlar: TEXT2XL  |  PARSEL2XL")
(princ)
