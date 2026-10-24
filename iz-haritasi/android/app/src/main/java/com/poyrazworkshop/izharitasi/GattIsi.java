package com.poyrazworkshop.izharitasi;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.BluetoothStatusCodes;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Tek seferlik GATT işi: ses çaldırma ya da ürün adını okuma. Ses protokolleri AirGuard'daki sırayla denenir
 * (seemoo-lab/AirGuard, AppleFindMy.kt):
 *   AirTag (1. kuşak)  7DFC9000/7DFC9001, 0xAF yazılır; ses bitince AirTag bağlantıyı kendisi kapatır.
 *   DULT               15190001/8E0C0001, önce bildirim açılır; 00 03 başlat, süre sonunda 01 03 durdur.
 *   Find My (0xFD44)   4F860003, önce bildirim açılır; 01 00 03 başlat, 01 01 03 durdur.
 * Ses yalnız sahibinden ayrı cihazda çalışır (Apple'ın takip önleme kuralı).
 */
final class GattIsi extends BluetoothGattCallback {
    static final int SES = 1;
    static final int AD = 2;

    static final UUID AIRTAG_SERVIS = UUID.fromString("7dfc9000-7d1c-4951-86aa-8d9728f8d66c");
    static final UUID AIRTAG_KARAK = UUID.fromString("7dfc9001-7d1c-4951-86aa-8d9728f8d66c");
    static final UUID DULT_SERVIS = UUID.fromString("15190001-12f4-c226-88ed-2ac5579f2a85");
    static final UUID DULT_KARAK = UUID.fromString("8e0c0001-1d68-fb92-bf61-48377421680e");
    static final UUID FINDMY_SERVIS = UUID.fromString("0000fd44-0000-1000-8000-00805f9b34fb");
    static final UUID FINDMY_KARAK = UUID.fromString("4f860003-943b-49ef-bed4-2f730304427a");
    static final UUID BILGI_SERVIS = UUID.fromString("87290102-3c51-43b1-a1a9-11b9dc38478b");
    static final UUID AD_KARAK = UUID.fromString("6aa50003-6352-4d57-a7b4-003a416fbb0b");
    static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    static final byte[] AIRTAG_BASLAT = {(byte) 0xAF};
    static final byte[] DULT_BASLAT = {0x00, 0x03};
    static final byte[] DULT_DURDUR = {0x01, 0x03};
    static final byte[] FINDMY_BASLAT = {0x01, 0x00, 0x03};
    static final byte[] FINDMY_DURDUR = {0x01, 0x01, 0x03};

    private final YerelKopru kopru;
    private final Context baglam;
    private final int is;
    private final int no;
    private final String adres;
    private final int sureMs;
    private final Handler ana = new Handler(Looper.getMainLooper());

    private BluetoothGatt gatt;
    private BluetoothGattCharacteristic karak;
    private String protokol;
    private byte[] bekleyenBaslat;
    private byte[] durdurKomutu;
    private byte[] sonYazilan;
    private boolean sesBasladi;
    private boolean bitti;
    private final Runnable zamanAsimi = () -> bitir(false, "baglanti", null);

    GattIsi(YerelKopru kopru, Context baglam, int is, int no, String adres, int sureMs) {
        this.kopru = kopru;
        this.baglam = baglam;
        this.is = is;
        this.no = no;
        this.adres = adres;
        this.sureMs = Math.max(1000, Math.min(sureMs, 30000));
    }

    void baslat() {
        BluetoothAdapter a = kopru.adaptor();
        if (a == null || !a.isEnabled()) {
            bitir(false, "bluetooth-kapali", null);
            return;
        }
        BluetoothDevice cihaz;
        try {
            cihaz = a.getRemoteDevice(adres);
        } catch (IllegalArgumentException e) {
            bitir(false, "baglanti", null);
            return;
        }
        ana.postDelayed(zamanAsimi, 25000);
        try {
            gatt = cihaz.connectGatt(baglam, false, this, BluetoothDevice.TRANSPORT_LE);
            if (gatt == null) bitir(false, "baglanti", null);
        } catch (SecurityException e) {
            bitir(false, "izin", null);
        }
    }

    @Override
    public void onConnectionStateChange(final BluetoothGatt g, final int durum, final int yeni) {
        ana.post(() -> {
            if (bitti) return;
            if (yeni == BluetoothProfile.STATE_CONNECTED && durum == BluetoothGatt.GATT_SUCCESS) {
                try {
                    if (!g.discoverServices()) bitir(false, "baglanti", null);
                } catch (SecurityException e) {
                    bitir(false, "izin", null);
                }
            } else if (yeni == BluetoothProfile.STATE_DISCONNECTED) {
                // AirTag komutu aldıktan sonra bağlantıyı kendisi kapatır (AirGuard'da durum 19)
                if ("airtag".equals(protokol) && sesBasladi) bitir(true, null, "airtag");
                else bitir(false, protokol == null ? "baglanti" : "ses-reddedildi", null);
            } else if (durum != BluetoothGatt.GATT_SUCCESS) {
                bitir(false, "baglanti", null);
            }
        });
    }

    @Override
    public void onServicesDiscovered(final BluetoothGatt g, final int durum) {
        ana.post(() -> {
            if (bitti) return;
            if (durum != BluetoothGatt.GATT_SUCCESS) {
                bitir(false, "baglanti", null);
                return;
            }
            if (is == AD) {
                BluetoothGattService s = g.getService(BILGI_SERVIS);
                BluetoothGattCharacteristic k = s == null ? null : s.getCharacteristic(AD_KARAK);
                if (k == null) {
                    bitir(false, "ad-okunamadi", null);
                    return;
                }
                try {
                    if (!g.readCharacteristic(k)) bitir(false, "ad-okunamadi", null);
                } catch (SecurityException e) {
                    bitir(false, "izin", null);
                }
                return;
            }
            if (dene(g, AIRTAG_SERVIS, AIRTAG_KARAK, "airtag", AIRTAG_BASLAT, null)) return;
            if (dene(g, DULT_SERVIS, DULT_KARAK, "dult", DULT_BASLAT, DULT_DURDUR)) return;
            if (dene(g, FINDMY_SERVIS, FINDMY_KARAK, "findmy", FINDMY_BASLAT, FINDMY_DURDUR)) return;
            bitir(false, "ses-servisi-yok", null);
        });
    }

    private boolean dene(BluetoothGatt g, UUID servis, UUID karakUuid, String ad, byte[] baslat, byte[] durdur) {
        BluetoothGattService s = g.getService(servis);
        if (s == null) return false;
        BluetoothGattCharacteristic k = s.getCharacteristic(karakUuid);
        if (k == null) return false;
        karak = k;
        protokol = ad;
        durdurKomutu = durdur;
        bekleyenBaslat = baslat;
        if (durdur != null) {
            // DULT ve Find My: önce bildirim/gösterge açılır; başlatma komutu tanımlayıcı yazılınca gider
            try {
                g.setCharacteristicNotification(k, true);
            } catch (SecurityException e) {
                bitir(false, "izin", null);
                return true;
            }
            BluetoothGattDescriptor t = k.getDescriptor(CCCD);
            if (t != null) {
                byte[] deger = (k.getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0
                        ? BluetoothGattDescriptor.ENABLE_INDICATION_VALUE
                        : BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE;
                if (tanimlayiciYaz(g, t, deger)) return true;
            }
        }
        yaz(g, k, baslat);
        return true;
    }

    @SuppressWarnings("deprecation")
    private boolean tanimlayiciYaz(BluetoothGatt g, BluetoothGattDescriptor t, byte[] deger) {
        try {
            if (Build.VERSION.SDK_INT >= 33) return g.writeDescriptor(t, deger) == BluetoothStatusCodes.SUCCESS;
            t.setValue(deger);
            return g.writeDescriptor(t);
        } catch (SecurityException e) {
            return false;
        }
    }

    @Override
    public void onDescriptorWrite(final BluetoothGatt g, BluetoothGattDescriptor t, int durum) {
        // Tanımlayıcı yazılamasa da komut denenir (AirGuard gibi)
        ana.post(() -> {
            if (!bitti && bekleyenBaslat != null && karak != null) yaz(g, karak, bekleyenBaslat);
        });
    }

    @SuppressWarnings("deprecation")
    private void yaz(BluetoothGatt g, BluetoothGattCharacteristic k, byte[] deger) {
        if (deger == bekleyenBaslat) bekleyenBaslat = null;
        sonYazilan = deger;
        try {
            boolean tamam;
            if (Build.VERSION.SDK_INT >= 33) {
                tamam = g.writeCharacteristic(k, deger, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
                        == BluetoothStatusCodes.SUCCESS;
            } else {
                k.setValue(deger);
                k.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
                tamam = g.writeCharacteristic(k);
            }
            if (!tamam) bitir(false, "ses-reddedildi", null);
        } catch (SecurityException e) {
            bitir(false, "izin", null);
        }
    }

    @Override
    public void onCharacteristicWrite(final BluetoothGatt g, BluetoothGattCharacteristic k, final int durum) {
        ana.post(() -> {
            if (bitti) return;
            if (durum != BluetoothGatt.GATT_SUCCESS) {
                bitir(false, "ses-reddedildi", null);
                return;
            }
            if (durdurKomutu == null) {
                // AirTag: kopma beklenir; gelmezse 15 sn sonra başarılı sayılır
                sesBasladi = true;
                ana.postDelayed(() -> bitir(true, null, protokol), 15000);
                return;
            }
            if (sonYazilan == durdurKomutu) {
                bitir(true, null, protokol);
                return;
            }
            sesBasladi = true;
            ana.postDelayed(() -> {
                if (!bitti) yaz(g, karak, durdurKomutu);
            }, sureMs);
        });
    }

    // Android 13+ bu imzayı çağırır
    @Override
    public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic k, byte[] deger, int durum) {
        okundu(durum, deger);
    }

    // Android 12 ve öncesi
    @Override
    @SuppressWarnings("deprecation")
    public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic k, int durum) {
        okundu(durum, k.getValue());
    }

    private void okundu(final int durum, final byte[] deger) {
        ana.post(() -> {
            if (bitti) return;
            if (durum != BluetoothGatt.GATT_SUCCESS || deger == null) {
                bitir(false, "ad-okunamadi", null);
                return;
            }
            String ad = new String(deger, StandardCharsets.UTF_8).replace("\u0000", "").trim();
            if (ad.isEmpty()) bitir(false, "ad-okunamadi", null);
            else bitir(true, null, ad);
        });
    }

    private void bitir(boolean tamam, String kod, String deger) {
        if (bitti) return;
        bitti = true;
        ana.removeCallbacks(zamanAsimi);
        kopru.sonuc(no, tamam, kod, deger);
        if (gatt != null) {
            try {
                gatt.disconnect();
                gatt.close();
            } catch (SecurityException e) {
                // izin geri alınmış
            }
            gatt = null;
        }
    }
}
