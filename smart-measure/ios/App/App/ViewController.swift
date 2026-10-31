import UIKit
import Capacitor

/// Capacitor'ın görünüm denetleyicisi; uygulamanın kendi eklentisini (Olcer) köprüye kaydeder. Main.storyboard bu sınıfı kullanır.
class ViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(OlcerPlugin())
    }
}
