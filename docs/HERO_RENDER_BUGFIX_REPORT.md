# Arıza İnceleme Raporu — Görünmeyen Rehber ve 2. Durakta Donma

**Tarih:** 27 Temmuz 2026
**Bildirim:** "CGI Nasreddin Hocasız gidiyor, 2. durakta dondu."
**Sonuç:** İki ayrı hata. Birincisi ölçümle kesin olarak tespit edildi ve düzeltildi. İkincisinin kesin nedeni bu ortamda üretilemedi; hangi koşullarda kalıcı donma yaratabileceğini kanıtladım ve o sınıfın tamamını kapattım.

---

## 1. Ekran görüntüsünden okunanlar

Görüntüde sahnenin her parçası doğru duruyor:

| Görünen | Ne olduğu | Durum |
|---|---|---|
| Büyük bej silindir | Galata Kulesi graybox'ı | doğru |
| Yeşil halka | Tamamlanmış durağın tetik halkası | doğru — 2. durak bitmiş |
| Turkuaz elips | Rota işareti | doğru |
| Küçük koyu üçgen | **Oyuncunun yön göstergesi** | doğru |
| Karakter | — | **yok** |

Yön göstergesi orada olduğu için oyuncu rig'i sahnede ve konumu doğru. Eksik olan yalnız karakter modeli. Bu, "model yüklenmedi" değil, "model yüklendi ama görünmüyor" tablosudur — çünkü model hiç yüklenmeseydi placeholder silindir çizilirdi ve onu görürdün.

---

## 2. Birinci hata: karakter 1,7 santimetre boyunda çiziliyordu

### Ölçüm

GLB'yi ikili olarak açıp iskelet dönüşümlerini okudum:

| Ölçüm | Değer |
|---|---|
| Ham `POSITION` yüksekliği | 1,700 birim |
| İlk eklemin inverse bind matrix ölçeği | **100,0** |
| `Armature` düğüm ölçeği | **0,01** |
| Eklem uzayı | santimetre (`Hips` y = 79,38) |

Rig şöyle kurulmuş: mesh metre cinsinden, iskelet santimetre cinsinden. Inverse bind matrix 100× büyütüp mesh'i eklem uzayına taşıyor, `Armature` düğümündeki 0,01 ölçeği de sahneye dönerken küçültüyor. İkisi birbirini götürüyor ve **skinning doğru çalışırsa ekranda 1,70 m** oluyor.

Skinning çalışmazsa üç.js mesh'i düğüm dönüşümüyle çizer, yani yalnız `Armature`'ın 0,01'i uygulanır:

```
1,700 × 0,01 = 0,017 m  →  1,7 santimetre
```

Ekran görüntüsündeki turkuaz rota işaretinin yarıçapı 0,45 m. Karakter onun otuzda biri kadar. Görünmemesi normal.

### Neden skinning çalışmıyordu

Kodda şu satır vardı:

```ts
const model = useMemo(() => scene.clone(true), [scene]);
```

Bu, three.js'te skinned mesh için yapılmaması gereken şeydir. `Object3D.clone()` mesh'i kopyalar ama kopyanın `skeleton` alanı **orijinal kemikleri** göstermeye devam eder. Klonun kendi kemikleri — mixer'ın hareket ettirdiği kemikler — hiçbir şeyi sürmez. Mesh bind pozunda kalır ve düğüm dönüşümüne düşer.

Klonlamayı kaldıramazdım: önbellekteki kaynağı bozmadan iki şehirde aynı modeli kullanmak için klon gerekiyor. Doğru araç three'nin kendi `SkeletonUtils.clone()` fonksiyonu; iskeleti klonlanmış kemiklere yeniden bağlıyor.

### İkinci katman: yüksekliği ölçmek yerine kayda güvenmiştim

Kayda `measuredHeightMeters: 1.7` yazmıştım. Bu **ham mesh uzunluğu**, ekrandaki yükseklik değil. Ölçekleme bu sayıya güvendiği için düzeltme çarpanı 1,65 / 1,70 = 0,97 çıkıyordu — yani bozuk skinning'in yarattığı 100 kat farkı görmüyor, 1,7 cm'lik karakteri 1,65 cm'ye indiriyordu.

Artık yükseklik **monte edilmiş modelden ölçülüyor**, kayıttaki değer yalnız akıl sağlığı kontrolü. Ölçülen ile kayıtlı değer %50'den fazla ayrışırsa konsola açık bir uyarı düşüyor:

```
[hero] nasreddin-hoca rendered 0.017 m but the registry records 1.7 m.
Check that the skeleton is bound to the cloned bones.
```

Bu hata bir daha olursa sessiz kalmayacak.

### Neden Keloğlan'da da vardı

Aynı kod yolu. Keloğlan'ı hiç ekranda doğrulayamamıştık — `?guide=keloglan` ile bakmış olsaydın onun da görünmediğini görecektin. İki hero da aynı hatadan etkileniyordu.

---

## 3. İkinci hata: donma

Bunu bu ortamda **üretemedim** — konteynerde GPU yok, tarayıcı sekmesi arka planda olduğu için render döngüsü çalışmıyor. Dolayısıyla "şu satır" diyemiyorum. Yapabildiğim şey, kodda kalıcı donma üretebilecek yolları tek tek çıkarmak oldu. Üç tane buldum ve üçü de aynı kusurdan geliyor: **3B katmandan gelmesi beklenen bir haber hiç gelmezse, akış orada kalıyordu.**

### Yol A — kamera hiç yerine oturmazsa

Bir durağın halkasına girildiğinde etkileşim otomatik başlıyor, durum `entering` oluyor, girdi kilitleniyor ve kamera nesneye doğru yol alıyor. Panel, kamera "vardım" dediğinde açılıyor.

O haber gelmezse: girdi kilitli, panel yok, ekranda hiçbir şey yok. **Tam olarak "dondu" tablosu.** Klavye de çalışmaz, çünkü panel açıkken klavye bilinçli olarak devre dışı bırakılıyor.

### Yol B — animasyon klibi hiç bitmezse

Kutlama ve başarı jesti, mixer'ın `finished` olayını bekliyordu. Model placeholder ise **mixer hiç yok**, dolayısıyla o olay hiç gelmiyor. Şehir tamamlama sekansı `performing` durumunda sonsuza kadar kalıyor, girdi kilidi açılmıyor ve tamamlanma paneli hiç görünmüyor.

Bu, Nasreddin Hoca'da Keloğlan'dan daha olası: Hoca'nın politikasında durak ve doğru cevap sonrası bir `Agree_Gesture` var, Keloğlan'da yok. Yani Hoca'da her durakta bir kez daha bu yola giriliyor.

### Yol C — başarı jesti askıda kalırsa

`successPending` yalnız klip bitiş haberiyle temizleniyordu. Aynı sebeple temizlenmezse rehber kalıcı olarak "onaylıyor" durumunda kalıyordu.

### Yapılan

Üçüne de zaman aşımı kondu. Bunlar kozmetik değil, akışın devam etme garantisi:

| Bekleme | Süre | Süre dolunca |
|---|---|---|
| Kameranın yerine oturması | 2,5 sn | Panel yine de açılır |
| Tek bir klip | 6 sn, sınırlı klipte sınır + 1 sn | Sonraki adıma geçilir |
| Tüm kutlama sekansı | 20 sn | Doğrudan özet paneline geçilir |
| Başarı jesti | 6 sn | Temizlenir |

İlke şu: 3B katman hiç konuşmasa bile oyun sonuna kadar oynanabilir olmalı. Bir test, her rehber için sekansın her adımından `SKIP` ile özete ulaşılabildiğini doğruluyor.

---

## 4. Telemetri: bir dahakine tahmin etmeyelim

Geliştirme katmanına üç alan eklendi:

```
measured h    1.702 m        ← bozuk bind burada 0.017 m görünür
interaction   entering       ← donma anında hangi durumda olduğu
celebration   performing
```

Bir daha "dondu" dersen, sağ alttaki bu üç satırın fotoğrafı sorunu tek adımda çözer.

---

## 5. Doğrulanan ve doğrulanamayan

**Kesin:** Karakterin 1,7 cm olarak çizildiği ölçümle kanıtlandı — inverse bind matrix ölçeği 100, armature ölçeği 0,01, ham yükseklik 1,70. Skinned mesh'i `Object3D.clone()` ile kopyalamanın iskeleti kopmuş bırakacağı three.js'in bilinen davranışı.

**Kesin değil:** Donmanın hangi yoldan geldiği. Üç yol da kodda gerçekten vardı ve üçü de kalıcı donma üretebilirdi; hangisinin senin ekranında tetiklendiğini söyleyemem. Üçünü de kapattım.

**Hâlâ göremediğim:** Modelin ekranda doğru göründüğü, animasyonların oynadığı, jestlerin karakterine yakıştığı. Bunlar sende.

---

## 6. Kalite kapısı

```
npm run content:check → 81 il, 249 durak, 84 soru; 1413 dizgi eşleşti
npm run lint          → temiz
npm run typecheck     → temiz
npm test              → 9 dosya / 139 test geçti
npm run build         → 4 rota derlendi
```

---

## 7. Kontrol etmeni istediklerim

1. `/city/istanbul` — Nasreddin Hoca görünüyor mu, boyu kuleye göre makul mü
2. `/city/istanbul?guide=keloglan` — Keloğlan görünüyor mu, Hoca'dan kısa mı
3. Yürürken `Walking`, dururken `Idle_11` oynuyor mu
4. Durak tamamlanınca Hoca bir kez onaylıyor mu
5. Şehir sonunda onay → el sallama → panel sırası geliyor mu
6. Sağ alttaki katmanda `measured h` yaklaşık 1,7 m gösteriyor mu

Altıncısı en önemlisi: orada 0,017 gibi bir sayı görürsen bu hata geri gelmiş demektir.
