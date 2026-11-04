import Foundation

/// Ses düzeyi hesabı: Android'deki SesIsleyici.java ve www/js/olcum/ses.js › createProcessor ile birebir. Örnekler
/// A-ağırlık süzgecinden (üç ikinci dereceden bölüm, katsayılar sayfadan gelir) geçer, karesel değer "hızlı" (F, 125 ms)
/// zaman ağırlığıyla ortalanır. Sonuç tam ölçekli sinüse göre dBFS(A)'dır. Ses saklanmaz: her blok işlenip atılır.
final class SesIsleyici {
    static let tauHizli = 0.125
    static let kirpma = 0.99
    static let tabanDb = -120.0

    struct Sonuc {
        let hizli: Double
        let blok: Double
        let tepe: Double
        var kirpma: Bool { tepe >= SesIsleyici.kirpma }
    }

    private let bolum: [[Double]]   // [b0, b1, b2, a1, a2]
    private var durum: [[Double]]   // her bölüm için iki durum değişkeni
    private let alfa: Double
    private var hizli = 0.0

    /// bolumler boşsa nil
    init?(ornekleme: Int, bolumler: [[Double]]) {
        guard !bolumler.isEmpty, bolumler.allSatisfy({ $0.count == 5 }) else { return nil }
        bolum = bolumler
        durum = Array(repeating: [0, 0], count: bolumler.count)
        alfa = 1 - exp(-1.0 / (SesIsleyici.tauHizli * Double(ornekleme)))
    }

    private static func db(_ karesel: Double) -> Double {
        karesel > 0 ? max(tabanDb, 10 * log10(2 * karesel)) : tabanDb
    }

    /// örnekler -1…1 aralığında (AVAudioEngine'in Float32 biçimi; Android'de 16 bit / 32768)
    func blok(_ ornek: UnsafePointer<Float>, _ n: Int) -> Sonuc {
        var toplam = 0.0, tepe = 0.0
        for i in 0..<n {
            var x = Double(ornek[i])
            let ax = abs(x)
            if ax > tepe { tepe = ax }
            for j in 0..<bolum.count {
                let c = bolum[j]
                let y = c[0] * x + durum[j][0]
                durum[j][0] = c[1] * x - c[3] * y + durum[j][1]
                durum[j][1] = c[2] * x - c[4] * y
                x = y
            }
            let kare = x * x
            toplam += kare
            hizli += (kare - hizli) * alfa
        }
        return Sonuc(hizli: SesIsleyici.db(hizli), blok: SesIsleyici.db(n > 0 ? toplam / Double(n) : 0), tepe: tepe)
    }
}
