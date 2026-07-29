# Implementation Status

**Son güncelleme:** 27 Temmuz 2026 — Nasreddin Hoca entegrasyonu dahil
**Tamamlanan fazlar:** Faz 00, Faz 01, Faz 01B (Kapı A), C0, Hero Karakter Mimarisi, M0-K1 Keloğlan
**Kanıt belgeleri:** `docs/QA_EVIDENCE.md`, `docs/CANONICAL_MIGRATION_REPORT.md`, `docs/HERO_CHARACTER_REPORT.md`, `docs/KELOGLAN_INTEGRATION_REPORT.md`, `docs/NASREDDIN_HOCA_INTEGRATION_REPORT.md`, `docs/HERO_RENDER_BUGFIX_REPORT.md`
**Faz 02 başlatılmadı.**
**Uygulama konumu:** `app/` (kaynak paket dosyalarına dokunulmadı)

---

## 1. Faz 00 — Denetim

### Doğrulananlar

| Kontrol | Sonuç |
|---|---|
| `cities.normalized.json` il sayısı | 81 ✓ (manifest ile birebir) |
| Legacy durak sayısı | 249 ✓ |
| Legacy quiz sayısı | 84 ✓ |
| Bölge sayısı | 7 ✓ |
| Pilot şehirlerin `city.schema.json` (Draft 2020-12) doğrulaması | İstanbul, Nevşehir, Gaziantep — üçü de geçerli ✓ |
| Pilot JSON'lardaki `assetId` referansları | 9 referansın 9'u `pilot-assets.csv` içinde ✓ |
| `scripts/validate-content.mjs` | Üç şehir için de OK ✓ |

### Tespit edilen boşluklar ve alınan kararlar

**B-01 — Legacy içerikte Türkçe yok.**
249 legacy durağın tamamında `title.tr` ve `body.tr` alanı `null`. Pilot dosyalar iki dilli.
*Karar:* Yedek dil zinciri (`tr → en → ""`) mimarinin çekirdeğine kondu, sonraya bırakılmadı. `src/content/i18n.ts` içindeki `t()` hiçbir zaman `null` döndürmez, böylece hiçbir UI bileşeni eksik çeviri için dallanmak zorunda kalmaz. `isFallback()` ileride editör aracının hangi metnin İngilizceden düştüğünü işaretlemesi için hazır.

**B-02 — `legacyArt` → varlık eşlemesi yok.**
53 legacy sanat tipinin (`mosque`, `bridge`, …) varlık kaydına giden bir yolu yok. Faz 01 bunu üretmiyor; 81 şehre ölçeklerken gereken ilk şey bu tablo.
*Karar:* Faz 02 sonrası backlog'a alındı. `CONTENT_MIGRATION.md` zaten `legacyArt`'ın nihai varlığı belirlememesi gerektiğini söylüyor, o yüzden eşleme bir "ipucu → brief" tablosu olacak, doğrudan bir asset id üretici değil.

**B-03 — Teslim edilmiş 3B varlık yok.**
Manifestteki 25 satırın 23'ü `briefed`, 2'si `placeholder`.
*Karar:* Varlık kaydındaki her satırın `models` alanı boş; `resolveAsset()` her zaman primitif geometriye düşüyor. Motorun hiçbir yerinde GLB dosya yolu yok.

**B-04 — Quiz yoğunluğu. ÇÖZÜLDÜ.**
Pilot dosyalarda şehir başına 1 soru vardı, legacy veride 84 soru var.
*Karar (proje sahibi, 27 Temmuz 2026):* Üretim standardı **şehir başına 2 hatırlama sorusu**.
*Uygulanan:* İstanbul'a ikinci soru eklendi (Boğaz / iki kıta — üçüncü durakta yapılan etkileşimi hatırlatıyor, editör onayı bekliyor). Quiz kapısı artık tüm soruları sırayla soruyor, il yalnızca sonuncusu doğru cevaplandıktan sonra tamamlanıyor. Panelde "1/2" konum göstergesi var. `meetsQuizStandard()` ve iki test, standarda uymayan şehirleri raporluyor — Nevşehir ve Gaziantep şu an bilerek başarısız, ikinci soruları Faz 02 içerik işi.

**B-05 — Şema ile içerik arasında küçük bir gerilim.**
`city.schema.json` `estimatedMinutes` ve `intro` alanlarını zorunlu tutmuyor ama üç pilot dosyada da var.
*Karar:* Zod şemasında ikisi de opsiyonel bırakıldı, UI ikisinin de yokluğunu tolere ediyor.

---

## 2. Faz 01 — Yapılanlar

### Uygulama iskeleti

Next.js 16 (App Router) · React 19 · TypeScript 6 strict · Three.js 0.185 · React Three Fiber 9 · Drei 10 · Zustand 5 · Zod 4 · Vitest 4. Vercel'e dağıtılabilir; canlı bir backend'e bağımlılık yok.

```
app/src/
  app/            map ve city/[cityId] rotaları
  components/
    game-ui/      panel, HUD, dokunmatik kol, performans katmanı
    map/          81 il haritası
    three/        Canvas, sahne, oyuncu rig'i, hotspot nesneleri
  engine/
    assets/       varlık kaydı + placeholder çözümleme
    camera/       takip kamerası, pitch sınırları, yumuşatma
    controls/     klavye/dokunmatik adaptörü, hareket, rehberli rota
    interactions/ durum makinesi
    progress/     repository arayüzü + localStorage uygulaması + saf kurallar
    quality/      kalite katmanları, cihaz tespiti
    scene/        içerik → motor yapılandırması
  content/        Zod şemaları, yükleyiciler, i18n
  stores/         oyun oturumu ve ayarlar
```

### Faz 01 gereksinim listesi

| # | Gereksinim | Durum |
|---|---|---|
| 1 | Yeni Next.js/TypeScript uygulaması | ✓ |
| 2 | Harita rotası ve şehir rotası | ✓ `/map`, `/city/[cityId]` |
| 3 | Çalışma zamanı doğrulanan şehir verisi | ✓ Zod, `citySchema` |
| 4 | Varlık kaydı + kalite varyantları + placeholder | ✓ |
| 5 | Veriden üretilen çevre, rota ve hotspot | ✓ `buildScene()` |
| 6 | Masaüstü ve dokunmatik keşif kontrolleri | ✓ WASD/oklar + sanal kol |
| 7 | Rehberli rota modu | ✓ |
| 8 | Güvenli kamera ve hareket sınırları | ✓ poligon içi test + pitch clamp |
| 9 | Tam bir `inspect-and-find` etkileşimi | ✓ |
| 10 | Bilgi kartı ve ödül | ✓ |
| 11 | Quiz kapısı | ✓ tüm duraklar bitmeden açılmıyor; şehir başına 2 soru |
| 12 | İl tamamlama ve haritaya dönüş | ✓ |
| 13 | Yerel ilerleme deposu | ✓ repository arayüzü arkasında |
| 14 | Yükleme, geçersiz veri, eksik varlık durumları | ✓ |
| 15 | Hareket azaltma ve ses ayarları | ✓ üç ses kanalı ayrı |
| 16 | Geliştirme performans katmanı | ✓ fps / draw call / üçgen / bellek |
| 17 | Otomatik testler | ✓ 28 test |

### Faz 01 kabul kriterleri (`QA_ACCEPTANCE.md`)

| Kriter | Durum |
|---|---|
| Uygulama legacy HTML dışında | ✓ `legacy/index.html` salt okunur kaldı |
| İstanbul JSON'dan yükleniyor | ✓ `public/content/pilot/istanbul.json` |
| Sahne placeholder'ları gerçek GLB ile aynı arayüzden geçiyor | ✓ `resolveAsset()` |
| Gir → yürü → durağa var → etkileşim → ödül → quiz → haritaya dön | ✓ |
| Rehberli mod aynı rotayı manuel hareket olmadan tamamlıyor | ✓ testle doğrulandı |
| Mobil kontroller çalışıyor | ✓ dokunmatik kol, `pointer: coarse` tespiti |
| Yenilemede ilerleme geri geliyor | ✓ localStorage |
| Performans katmanı var | ✓ |
| Production derlemesi geçiyor | ✓ |

### Global kalite kapısı

```
npm run lint       → temiz
npm run typecheck  → temiz (strict, noUncheckedIndexedAccess, `any` yok)
npm run content:check → 81 il, 249 durak, 84 soru; 1413 kanonik dizgi baseline ile eşleşti
npm test           → 16 dosya / 300 test geçti (logic + jsdom ui)
npm run build      → başarılı, 4 rota
npm start          → /map ve /city/istanbul 200
```

---

## 3. Mimari notlar

**Şehir eklemek motoru değiştirmiyor.** `buildScene()` içinde tek bir şehir adı geçmiyor. Yeni şehir = doğrulanmış JSON + varlık kaydına birkaç satır.

**3B sahne kalıcı ilerlemeye sahip değil.** Sahne yalnızca yakınlık olayı yayınlıyor (`onNearestChange`); ödülü store veriyor, kalıcılığı repository yazıyor.

**Kare başına React state güncellemesi yok.** Girdi anlık görüntüsü (`inputState`) React dışında mutable bir nesne; kamera ve oyuncu `useFrame` içinde doğrudan yazılıyor; performans örneklemesi saniyede iki kez.

**Etkileşim tipleri rotayı tıkamıyor.** `inspect-and-find` tam uygulandı. Diğer beş tip `simple-choice` sunumuna düşüyor ve panel bunun geçici olduğunu yazıyor.

**Harita 81 ili çiziyor.** Legacy koordinatlardan üretilen 17 KB'lik indeksle. 280 KB'lik migration dosyası harita rotasına inmiyor.

**Erişilebilirlik.** Tüm paneller odak tuzaklı diyalog, Escape kapatıyor, odak halkası görünür, ilerleme sayı + şekil ile anlatılıyor (yalnız renkle değil), `prefers-reduced-motion` hem otomatik algılanıyor hem elle kapatılabiliyor, rehberli mod var.

**Yeni ESLint kuralı.** Herhangi bir bileşende `.glb` ile biten bir string hata veriyor — CLAUDE.md kural 4'ün otomatik bekçisi.

---

## 4. Performans gözlemleri

Ölçüm konteyner ortamında yapılmadı (GPU yok). Bütçeye uyum için kurulan mekanizmalar:

- DPR düşük/orta/yüksek için 1.0 / 1.5 / 2.0 ile sınırlı
- Gölgeler düşük katmanda kapalı, gölge haritası 512/1024/2048
- Graybox sahnede yaklaşık 15 draw call, ~10k üçgen — 250k mobil bütçesinin çok altında
- Şehir bırakılırken R3F ağacı tamamen sökülüyor; `useMemo`'lu sahne tanımı kalite değişiminde yeniden kuruluyor

Gerçek ölçüm, Faz 02'de bir mobil cihaz ve bir masaüstü görünümünde yapılmalı.

---

## 4b. Kapı A düzeltmeleri (PROMPT 01B)

| Bulgu | Durum | Kanıt |
|---|---|---|
| A-01 Varlık kaydı hizalaması | ✅ kapandı | 25/25 manifest satırı CSV'den üretiliyor; üç şehirde de `unknownAssetIds: []`; 8 test |
| A-02 Gerçek GLB yolu | ⚠️ kod tamam, gerçek dosyayla denenmedi | `AssetInstance` tek yol; fallback ve hata sınırı yerinde; doğrulama M0 modeliyle |
| A-03 Rehberli modda durma | ✅ kapandı | `guidedPauseHotspot()`; dört davranışın hepsi testli |
| A-04 Tarayıcı QA kanıtı | ⚠️ kısmi | jsdom'da 10 gerçek DOM testi çalışıyor; Playwright süiti yazıldı ama tarayıcı binary'si indirilemedi |
| İçerik kaynak bütünlüğü | ✅ kapandı | Kök `content/` tek kaynak; `content:sync` / `content:check`; sapma testi |

Ayrıntı ve tam komutlar için `docs/QA_EVIDENCE.md`.

**A-01'in yan etkisi:** Registry elle yazıldığı için Galata Kulesi 14 m olarak duruyordu; manifest 32 m diyor. Boyutlar artık CSV'den geliyor, sahne oranları düzeldi. Koleksiyon ödülleri de daha önce hiç çözülmüyordu; `RewardPanel` bilinmeyen varlık gösteriyordu.

## 4c. C0 — İçerik Kanonikleştirme

Kanonik içerik `content/canonical/` altında salt okunur yetke olarak duruyor; teknik sahne verisi `content/scenes/` altına ayrıldı ve aralarındaki tek bağ `contentRef`. Birleştirme çalışma zamanında `src/content/compose.ts` içinde yapılıyor.

| Konu | Durum |
|---|---|
| Kaynak SHA doğrulaması | ✅ `legacy/index.html` kanonik SHA ile birebir |
| 81 il / 249 durak / 84 soru | ✅ doğrulayıcıda şart |
| İki soru kuralı | ✅ geri çekildi; 78 il 1 soru, 3 il 2 soru |
| Sahne dosyalarında kanonik metin yok | ✅ negatif testle doğrulandı |
| İstanbul'un 5 kanonik durağı | ✅ beşi de sahnede; 3. ve 4. durak graybox varlıkla |
| Kanonik dizgi bütünlüğü | ✅ 1413 dizginin özeti kilitli |

Ayrıntı: `docs/CANONICAL_MIGRATION_REPORT.md`.

## 4d. Hero karakter mimarisi (D-012)

Kalite sistemi `safe / balanced / high` profillerine geçti; üç profilde de hero mesh'i birebir aynı, farklılaşan tek şey çevre maliyeti. Normal şehirde tek hero yükleniyor, pasif hero hiç istenmiyor, harita 2B portre kullanıyor.

| Konu | Durum |
|---|---|
| Tek aktif hero | ✅ testli |
| Pasif hero yüklenmiyor | ✅ testli |
| Tembel yükleme, şehir kabuğundan sonra | ✅ |
| Şehirler arası önbellek | ✅ `onCityUnmount()` bilinçli no-op |
| Mesh üç profilde de tam | ✅ merdivende karakter maddesi yok, testli |
| Tek AnimationMixer | ✅ kaynak taramalı test |
| Tekrarsız dans torbası | ✅ 200 çekimde tekrar yok |
| İki hero modu varsayılan kapalı | ✅ |
| GLB hatasında placeholder | ✅ testli |
| Telemetri katmanı | ✅ 11 alan |
| **Gerçek GLB ile doğrulama** | ✅ Keloğlan entegre edildi, 222.150 üçgen, 12 klip |
| **FPS ölçümü** | ⚠️ bu ortamda alınamadı, GPU yok |

Ayrıntı: `docs/HERO_CHARACTER_REPORT.md`.

## 4e. M0-K1 — Keloğlan entegrasyonu

Teslim edilen animasyonlu GLB, dosya adı değiştirilmeden `app/public/assets/heroes/` altına kondu ve registry'ye ölçülen değerleriyle işlendi: 222.150 üçgen, 16.722.860 bayt, SHA-256 kayıtlı, 12 klip envanteri çıkarıldı.

| Konu | Durum |
|---|---|
| Model küçültülmedi | ✅ decimation yolu yok |
| Dört durum klibi eşleşti | ✅ `Idle_11` / `Walking` / `Running` / `Talk_Passionately` |
| Dört onaylı dans | ✅ dışlananlar seçilemiyor, testli |
| Kök hareketi güvenliği | ✅ `FunnyDancing_01` 0,21 m kayması sabitleniyor |
| Kutlama koreografisi | ✅ ilerleme dans öncesi kaydediliyor |
| "Başka bir kutlama dansı" | ✅ |
| Reduced motion | ✅ dans atlanıyor, ödül veriliyor |
| Yükleme durumu | ✅ "Keloğlan hazırlanıyor…" |
| **Tarayıcıda görsel doğrulama** | ⚠️ bu ortamda yapılamadı |
| Son durak ulaşılabilirliği | ✅ düzeltildi — her şehrin son durağı rehberli modda ulaşılamıyordu |
| Nesne çarpışması | ✅ eklendi — daha önce hiç yoktu, oyuncu binaların içinden geçiyordu |
| Durakta durma | ✅ halkaya girmek etkileşimi kendiliğinden başlatıyor |
| Sahne geometrisi | ✅ nesne başına ayak izinden türetiliyor, dört doğrulayıcı kuralı |

**Test için:** `/city/istanbul?guide=keloglan` — kanonik rehber atamasına dokunmayan QA parametresi.

Ayrıntı: `docs/KELOGLAN_INTEGRATION_REPORT.md`, `docs/NASREDDIN_HOCA_INTEGRATION_REPORT.md`, `docs/HERO_RENDER_BUGFIX_REPORT.md`.

## 4f. Saha arızası — görünmeyen rehber ve donma

| Bulgu | Durum |
|---|---|
| Karakter 1,7 cm olarak çiziliyordu | ✅ düzeltildi — skinned mesh `Object3D.clone()` ile kopyalanıyordu, iskelet kopuyordu |
| Yükseklik kayda güvenerek ölçekleniyordu | ✅ artık monte edilmiş modelden ölçülüyor, sapmada konsol uyarısı |
| Kamera haberi gelmezse kalıcı donma | ✅ 2,5 sn zaman aşımı |
| Klip bitiş haberi gelmezse kalıcı donma | ✅ klip ve sekans zaman aşımları |
| Başarı jesti askıda kalması | ✅ zaman aşımı |
| Donmanın kesin nedeni | ⚠️ bu ortamda üretilemedi; üç aday yolun üçü de kapatıldı |

Ayrıntı: `docs/HERO_RENDER_BUGFIX_REPORT.md`.

## 4g. Tek hareket modu ve İngilizce sürüm

| Değişiklik | Durum |
|---|---|
| Rehberli mod kaldırıldı (D-016) | ✅ `guided.ts`, ayar ve tüm bağlantıları silindi |
| Ürün İngilizce (D-014) | ✅ arayüzde Türkçe metin kalmadı, dil seçici yok |
| Yalnız İstanbul açık (D-015) | ✅ diğer iki pilot şehir hazır ama kapalı |
| Bölge görsel kimliği | ✅ gökyüzü ve zemin rengi kanonik bölge kaydından |
| Üretimde telemetri (D-017) | ✅ `?debug=1` |
| Yükleme yazısının zaman aşımı | ✅ 15 sn |

## 4h. Saha turu düzeltmeleri

| Bulgu | Durum |
|---|---|
| Doğru şık farklı stille gösteriliyordu | ✅ tüm şıklar aynı görünüyor (D-021) |
| Sağ/sol tuşları tersti | ✅ işaret hatası düzeltildi, testli |
| Koşma hiç çalışmıyordu (eşik 5.0 > hız 4.2) | ✅ Shift ile 7.4 m/s, eşik 5.6 |
| Zıplama | ✅ kaldırıldı (D-022) — klibi olmadan doğru görünmüyordu |
| Kalite modları | ✅ kaldırıldı, tek yapılandırma (D-020) |
| Materyal düzeltmesi sonrası üçgen | ✅ 593.714 → 396.232, 60 fps |

## 4i. Saha turu — ikinci tur

| Bildirilen | Durum |
|---|---|
| Shift'e basınca sonsuz yürüme | ✅ `event.key` yerine `event.code` (D-025) |
| Hoca'ya arkadan bakıyoruz, döndüremiyoruz | ✅ sol/sağ artık döndürüyor |
| Bazen A-pose'a geçip kayıyor | ✅ klip seçiminde histerezis + bind-pose koruması |
| Ayarlardaki ses düğmeleri hiçbir şey yapmıyor | ✅ kaldırıldı (D-026) |
| Durakta soru sorulmuyordu | ✅ soru kaldırıldı, sunum + "Collect" (D-023) |
| Karşılama ekranı prototipteki gibi değil | ✅ metin kaynaktan çıkarıldı (D-024) |
| Harita gerçek Türkiye haritası değil | ✅ kara parçası ve izdüşüm kaynaktan (D-024) |

## 4j. Varlık üretimi

`docs/ISTANBUL_ASSET_SPEC.md` teknik şartname, `docs/MESHY_PRODUCTION_PACK_1.md` Meshy'ye hazır 11 istem.
Sokak kiti 81 ilde ortak (D-032): İstanbul'a özel 5 nesne, geri kalan 6 parça her şehirde aynı.

## 4k. Sokak kiti — lamba ve bank

`kit_street_lamp` (5,00 m, 1.834 üçgen, 1,31 MB) ve `kit_bench` (1,82×0,90×0,70 m, 1.586 üçgen, 0,93 MB).
İki dosyanın da her teslim iddiası ölçümle tuttu; ikisi de `OPAQUE` ve tabanları y=0'da.

Lambanın ilk sürümü 8,36 MB'dı; 1024 dokuyla yeniden ihraç edilince **6,4 kat** küçüldü.
Artık her paylaşılan kit propu 2 MB altında olmak zorunda ve bunu bir test uyguluyor (D-036).
Teslim edilen propun kendi ölçeği artık normalize edilmiyor (D-037).

İstanbul'da dört lamba, iki bank. Yerleşimler üreticide denetleniyor: tetik halkalarının dışında,
rota merkez hattından en az 7,2 m, açılar ve aralıklar bilinçli olarak farklı.
Ayrıntı: `docs/STREET_KIT_GATE_NOTE.md`.

## 4l. Zemin

Arnavut kaldırımı prosedürel üretiliyor (`scripts/build-ground-texture.mjs`): torus üzerine sarılmış
Voronoi hücreleri, yükseklikten türetilen normal harita. Albedo + normal + roughness toplam **368 KB** —
bir kit propundan küçük, üstelik ekranda en çok bakılan yüzey için.

Dokular gri tonlamalı; bölgenin kendi zemin rengi çalışma zamanında tint olarak uygulanıyor,
yani tek set 81 ilin hepsine yetiyor (D-040). Karo 4 metrede bir tekrarlıyor, taşlar 44 cm (D-047).

## 4m. Çarpışma ve sokak kedisi

Proplara çarpışma hacmi verildi (D-041) — daha önce lamba ve bankın içinden geçilebiliyordu.
Döndürülmüş bir bankın ayak izi, döndürülmüş dikdörtgenin eksen hizalı sınırlarından hesaplanıyor.

`kit_street_cat` entegre edildi: 19.303 üçgen, 27 eklemli dörtayaklı, 1 saniyelik `Walking` klibi, 0,97 MB.
İstanbul'da **beş kedi**, her biri kendi kısa rotasında, uç noktalarda 3–7 saniye duruyor.
Kedi teslim edilen rigde 1,7 cm boyunda çiziliyordu; motor ölçüp brief boyuna büyütüyor (D-044).
Çarpışma hacmi **yok** — çocuk kedinin içinden geçebilir.

**Üçgen sapması:** brief 800–1.500 diyordu, gelen 19.303. Boyut kuralına uyduğu için bu kapıda kabul edildi.

## 4n. Simit arabası

`city_istanbul_simit_cart` 4. durağa bağlandı. Teslim edilen dosya 969.492 üçgen ve 31,33 MB'dı;
sahneye olduğu gibi konsa kare hızı 50'den ~12'ye düşerdi. Proje içinde sadeleştirildi:
**20.182 üçgen, 1,45 MB** — boyut, materyal ve taban korunarak (D-048).
Sadeleştirici: `scripts/simplify-model.mjs`. Teslim edilen dosyanın üzerine yazılmadı.

İstanbul artık 5 durağın 4'ünde ısmarlanmış varlık kullanıyor; sadece Kapalıçarşı graybox.

## 4o. Simge ölçeği ve durak kamerası

Galata Kulesi manifestte **4×4×14 m** (D-050). Gerçek kule 67 m; 32 metrelik model durak kamerasını
taşla dolduruyordu, çocuk kuleyi hiç göremiyordu. 14 metrede hâlâ sokağın en yükseği —
Hoca'nın sekiz katı, lambanın üç katı — ama tek karede tamamı görünüyor.

Durak kamerası artık nesnenin boyundan türetiliyor (D-051): çini paneli ve simit arabası 5,8 m,
Kapalıçarşı 6,9 m, vapur 8,3 m, kule 19,9 m. Bir test her şehirdeki her durak nesnesinin
kendi kadrajına sığdığını doğruluyor.

## 4p. Üç NPC ve yeşillik

`featured_soldier` Galata kapısının yanında, `featured_traveler` çarşı girişinde,
`featured_craftsman_male` simit arabasının başında. Üçü de durağın **yanında** duruyor,
önünde değil — üretici rotaya 2,5 metreden yakın yerleşimi düşürüyor (D-054).

Yasaklı animasyonlar **dosyadan silindi** (D-052): askerin 20 klibinden 3'ü kaldı.
Üç dosya 11,48 MB → **6,96 MB**. Askerin baltalı duruşları da kullanılmıyor.

19 ağaç prosedürel üretiliyor (D-053): servi, çınar, çalı; ağaç başına ~250 üçgen.

**Performans uyarısı:** kare başına tahmini 809.706 üçgen, kaba tahminle ~36 fps.
Kalabalık fazına geçmeden gerçek ölçüm gerekiyor.

## 4r. Kapalıçarşı kapısı ve servili saksı

`city_istanbul_grand_bazaar` 3. durağa bağlandı: 7.793 üçgen, 52,08 MB'dan **1,90 MB**'a indi.
`kit_planter_cypress` paylaşılan kit propu oldu: 3.747 üçgen, 8,40 MB'dan **0,65 MB**'a.
İstanbul'da dört saksı, lamba ve banklarla aynı denetimden geçerek yerleştirildi.

Dokular artık role göre boyutlandırılıyor (D-057): renk haritası büyük, diğerleri yarısı.
Dört teslimat üst üste geometrisi bütçede, dokuları bütçe dışı geldi.

**İstanbul'da graybox kalmadı** — beş durağın beşi de ısmarlanmış varlığa işaret ediyor.
İkisinin (çini paneli, vapur) modeli henüz teslim edilmedi, yer tutucu çiziliyor.

## 4s. Sokak kiti tamamlandı

`kit_crates` (3.755 üçgen, 8,49 → 0,62 MB) ve `kit_market_stall` (3.851 üçgen, 6,74 → 0,46 MB) eklendi.
Tezgâh bilerek boş: aynı model Gaziantep'te baharat, Nevşehir'de çömlek tezgâhı olacak — üstüne
konanla değişecek, kendisi değil.

İstanbul'da 15 kit propu: 4 lamba, 4 saksı, 3 kasa, 2 bank, 2 tezgâh. Hepsi aynı denetimden geçiyor —
tetik halkalarının dışında, rota merkez hattından en az 4 m.

Kitin altı parçasının beşi teslim edildi; kedi ayrı kategoride. Kalan: yok.

## 4s. Sokak kiti tamamlandı

`kit_crates` (3.755 üçgen, 8,49 → 0,62 MB) ve `kit_market_stall` (3.851 üçgen, 6,74 → 0,46 MB)
eklendi. Tezgâh bilinçli olarak boş: aynı model Gaziantep'te baharat, Nevşehir'de çömlek tezgâhı olacak.

Paylaşılan kit artık altı parça ve toplam **5,17 MB** — 81 ilin hepsinde aynı dosyalar.

Kayıt artık diskle bağlanıyor (D-058): her teslim dosyasının varlığı, bayt sayısı ve SHA-256'sı
test ediliyor, mükerrer kimlik yasak. İki prop iki kez kayıtlıydı ve eskisi geçersiz bir sağlama taşıyordu.

## 4t. Ayasofya, Beyoğlu, Kız Kulesi ve deniz

`city_istanbul_hagia_sophia` 1. durağın nesnesi oldu — kanonik soru camilerle ilgili.
8 metrede tutuldu (D-061): 12 metrede ayak izi 21 m derinliğe çıkıp Galata'nın halkasına giriyordu.

`city_istanbul_ferry_boat` denizde demirli, `city_istanbul_maidens_tower` denizde.
İkisi de katı değil ve gölge yaratmıyor (D-060).

**Deniz eklendi** (D-059): oyun alanının sınırında başlıyor, çocuk rıhtım kenarında duruyor.
Yalnız İstanbul'da; Nevşehir'in kıyısı olmadığını bir test koruyor.

Sahne üreticisi artık teslim edilen boyutları okuyor (D-062) — daha önce çarpışma manifestten,
görsel teslimattan geliyordu ve ikisi farklıydı.

Üç dosya toplam 151,62 MB geldi, **7,56 MB**'a indi.

## 4u. Sokak yeniden düzenlendi

İlk durak doğuş noktasından **26 metre** uzakta (D-063) — 8 metredeyken Ayasofya'nın cephesi
Hoca'nın 85 santim önündeydi. Üç test bunu koruyor: doğuş noktası hiçbir şeyin içinde değil,
5 metreden fazla açıklığı var, her yöne yürünebiliyor.

**Gri kutular silindi** (D-064). Yerlerine çeşme (2), nostaljik tramvay ve taş rıhtım eklendi;
sokakta 19 yerleştirilmiş prop var ve hepsi teslim edilmiş model.

Tramvay ve rıhtım İstanbul'a özel (D-065), paylaşılan kite girmiyor.

## 4v. Durak 1 yeniden düzenlendi

`city_istanbul_iznik_tile_panel` 1. durağın nesnesi oldu: 1,51 × 2,20 × 1,06 m — çocuk boyunda,
yaklaşıp bakılacak bir pano. 20,31 MB'dan **0,58 MB**'a indi.

Ayasofya durak olmaktan çıkıp arka plana alındı (D-066). Durak nesnesiyken tetik halkası iki
komşu arasına sığmak zorunda olduğu için 8 metreye sıkışıyordu; artık oyun alanının dışında,
**12 metre** boyunda ve 20 metre eninde.

Bu zaten varlık şartnamesinin baştan söylediği şeydi: *bu duraktaki nesne bina değil.*
Tersini kurup görmek gerekti.

## 4y. İstanbul'un beş durağı da tamam

`city_istanbul_ferry_terminal` 5. durağın nesnesi oldu: 13,9 × 8,0 × 8,9 m, 12.168 üçgen,
50,82 MB'dan **1,90 MB**'a indi. Vapurun kendisi hiç teslim edilmedi; iskele onun yerine
geçti ve rıhtımda duruyor (D-068).

`city_istanbul_ferry` manifestte karşılanmamış bir brief olarak duruyor — silmek boşluğu
sessizce kapatırdı; bir test hiçbir durağın onu kullanmadığını doğruluyor.

**Beş durağın beşi de var olan bir dosyaya işaret ediyor.** Yer tutucu kalmadı.

## 4z. Doğuş meydanı

Oyun alanı doğuş noktasının arkasında 10 metrede bitiyordu; artık **42 metre** uzanıyor (D-069).
Orası boş zemin değil, bir meydan: Ayasofya arkayı kapatıyor, tramvay kenarında bekliyor —
çocuk sanki tramvaydan yeni inmiş gibi başlıyor.

Ayasofya arka plandan çıkıp meydana **katı bir prop** olarak taşındı. Oyun alanının dışına
koyunca zeminin de dışında kalıyordu, boşlukta duruyordu. 10 metreye küçültüldü.

İkinci sürümle değiştirildi: 10.094 üçgen ve 2048 renk haritası (D-071). İlk sürüm 1024'e
sıkıştırılmıştı — uzaktan bakılan bir bina için yeterliydi, yanına gidilen bir bina için değil.
70,27 MB'dan 2,94 MB'a.

Prop açıklığı artık x=0'a değil **rotanın kendisine** göre ölçülüyor (D-070) — eski kural
caminin meydanı karşıdan kapatmasını reddediyordu.

## 5a. Hero bütçesi düşürüldü

D-012'nin 180.000–250.000 üçgen aralığı, hiçbir şey indirme karşısında ölçülmeden önce
teslim brief'inden gelmişti. Proje sahibinin onayıyla aralık **70.000–120.000**'e indirildi (D-072).

| | Önce | Sonra |
|---|---|---|
| Nasreddin Hoca | 197.482 üçgen, 18,95 MB | 88.866 üçgen, **4,86 MB** |
| Keloğlan | 222.150 üçgen, 15,95 MB | 99.966 üçgen, **4,40 MB** |
| Bir İstanbul turu | 49,30 MB | **35,21 MB** |
| Karedeki hero payı | 394.964 üçgen | 177.732 üçgen |

İkisi de 24 eklemli iskeletini, deri ağırlıklarını, 1,700 m ölçülen boyunu ve tüm kliplerini
koruyor — Hoca'da 7, Keloğlan'da 12. Sonradan doğrulandı, varsayılmadı.

Tasarrufun yarısı dokudandı: iki adet 2048 RGBA PNG, her biri 5 MB, üstelik motorun zaten
opak yaptığı bir materyalde — alfa hiçbir şey taşımıyordu.

**Değişmeyen:** motor hâlâ hero mesh'ine dokunmuyor. Bu, üretilen dosyanın değişmesi;
oyun sırasında motorun feda edebileceklerinin değil.

## 5b. Uçtan uca tur simülasyonu

`tests/playthrough.test.ts` bir çocuğun tüm ziyaretini oyunun kendi fonksiyonlarıyla canlandırıyor:
doğ, rota işaretlerini izle, beş durağı karşıla, beşini topla, quiz'i geç, yıldızı kazan.

İlk çalıştırmada gerçek bir hata buldu: **rota işaretleri Galata Kulesi'nin içinden geçiyordu** (D-073).
Her durak yalnız bir ara nokta üretiyordu — nesnenin önünde. Oradan sonraki durağa giden düz hat
nesnenin ortasından geçiyordu. Nesneler katı olmadan önce zararsızdı, katı olunca duvara dönüştü.

Artık her durak iki nokta üretiyor: bakmak için durulan yer ve nesnenin öte yanını geçen nokta.

## 5c. Ses ve kare hızı

**Ses eklendi, tek bayt dosya olmadan** (D-074). Üç kanal: rehber, ortam, arayüz — ayrı ayrı
sessize alınabiliyor ve düğmeler artık gerçekten bir şey yapıyor. Toplama, doğru cevap, yeniden
deneme ve şehir tamamlama sesleri osilatörle; ortam sesi filtrelenmiş kahverengi gürültü.
Ses, giriş düğmesinde açılıyor — tarayıcının istediği jest o.

Yanlış cevap sesi bilerek zil değil. Öğrenme oyununda yanlış yapan çocuk nötr bir şey duyup
tekrar denemeli.

**Kare hızı:** ağaçlar örneklendi, 63 draw call → 4 (D-075, D-077). Kedi sadeleştirildi,
19.303 → 7.199 üçgen; beş kedi 96.515'ten 35.995'e indi (D-076). Kediler ve ağaçlar artık
gölge yaratmıyor.

| | Önce | Sonra |
|---|---|---|
| Tek geçiş üçgen | 412.384 | ~351.864 |
| Gölgeliyle | 824.768 | ~664.000 |
| Draw call | 108 | ~48 |

## 5d. Bayrak, müzik, Beyoğlu

**Bayrak** 81 ilin hepsinde aynı noktada (D-079): doğuş noktasının sağında, yürüyüşe bakar.
Katı — çocuk yanına gidebilir, öteye geçemez. 14,59 MB'dan 0,45 MB'a.

**İstanbul teması** eklendi (D-080): *Üsküdar'a Gider İken*, 4,53 MB MP3'ten **1,60 MB**
Opus/WebM'e. Müziğin kendi kanalı var, varsayılan sesi hepsinden düşük.
`<audio>` üzerinden akıtılıyor — çözülmüş hâli ~40 MB bellek eder.
Dört saniyede açılıyor, döngüye giriyor, rehber konuşurken ortamla birlikte kısılıyor.
Diğer 80 il kendi teması gelene kadar sessiz.

**Beyoğlu cephe sırası** geldi: 30,7 × 14 × 12,3 m, iki yerde. 25,01 MB'dan 2,55 MB'a (D-081).

## 5e. Yaşayan sokak

**Rüzgâr** (D-084): bayrak eğiliyor, ağaç tepeleri salınıyor. İki farklı periyotta sinüs, nesne başına
faz kayması — yirmi bir ağaç aynı anda eğilirse deprem gibi görünür. Gövdeler duruyor.
`sway()` saf bir fonksiyon, azaltılmış hareket sıfır güç geçilerek sağlanıyor.

**Tramvay hattı** (D-085): batı tarafında 120 m gidip geliyor, uçlarda dört saniye bekliyor.
Katı değil — çocuk hattın üstüne çıkarsa görmediği bir araç onu durdurmamalı.

**Kediler %50 büyüdü**: 0,40 → 0,60 m (D-086). Gösterilen kişiler bulamıyordu.

**Zemin oyun alanının 26 m ötesine uzatıldı** (D-082) — cepheler gökyüzünün üstünde
yüzüyordu. **Sokağın iki yanı on cephe sırasıyla kapatıldı** (D-083).

## 5e. Yaşayan sokak

**Rüzgâr** (D-084): bayrak eğiliyor, ağaç tepeleri salınıyor. İki farklı periyotta sinüs, nesne başına
faz kayması — yirmi bir ağaç aynı anda eğilirse deprem gibi görünür. Gövdeler duruyor.
`sway()` saf bir fonksiyon, azaltılmış hareket sıfır güç geçilerek sağlanıyor.

**Tramvay hattı** (D-085): batı tarafında 120 m gidip geliyor, uçlarda dört saniye bekliyor.
Katı değil — çocuk hattın üstüne çıkarsa görmediği bir araç onu durdurmamalı.

**Kediler %50 büyüdü**: 0,40 → 0,60 m (D-086). Gösterilen kişiler bulamıyordu.

**Zemin oyun alanının 26 m ötesine uzatıldı** (D-082) — cepheler gökyüzünün üstünde
yüzüyordu. **Sokağın iki yanı on cephe sırasıyla kapatıldı** (D-083).

## 5f. Rehber konuşuyor

Tarayıcının `speechSynthesis`'i her durağı açıldığında İngilizce okuyor: rehber cümlesi,
başlık, bilgi (D-088). Hız 0,92 — tarayıcı varsayılanı yetişkine göre hızlı.
Yerel ses, ağ sesine tercih ediliyor; ağ sesi konuşmadan önce duraklıyor.
Yeni durak, öncekinin sırasını beklemiyor, yerine geçiyor.

Konuşma Web Audio grafiğinden geçmediği için ses kanalının kısma ve susturması
söyleyiş üzerinde uygulanıyor — "Guide" düğmesi artık gerçekten bir şey susturuyor.

Kayıt gerekirse `speak()` arayüzü aynı kalarak değiştirilebilir.

**Tramvay yan gidiyordu** (D-087): modelin uzun ekseni X'te, yön hesabı +Z varsayıyordu.
Bileşen artık ayak izini okuyup çeyrek tur ekliyor.

## 5g. Yırtık bayraklar

Tüm teslim modellerin materyalini tek yüzlü yapmıştım — kapalı bir şekilde doğru,
ince bir şekilde yıkıcı. Bayrak tek bir düzlem; arka yüzü elenince yarısı çizilmiyor (D-089).

Kız Kulesi'nin çatısındaki bayrak, vapurun direklerindeki bayraklar, 81 ilde duran bayrak
propunun kendisi ve pazar tezgâhının tentesi — dördü de çift yüzlüye geri alındı.

Ortak sadeleştirici artık yüz sayısına hiç dokunmuyor. `OPAQUE` zorlaması duruyor,
o güvenli. Bir test her teslim GLB'yi denetliyor.

## 6. Nevşehir açıldı

**Dokunarak yürüme** (D-090): zemine dokunulan yere gidiliyor, çubuk isteyene duruyor.
Yol bulma yok — yürür, kayar, üç saniye ilerleyemezse vazgeçer.

**Dekor artık yürüyüşten türetiliyor** (D-091), şehir başına yazılmıyor. Elle yerleştirme
yalnız şehre özgü olan için: İstanbul'un camisi, rıhtımı, tramvay hattı.

**Her şehir kendi gibi ağaçlanıyor** (D-092): Anadolu'da kavak ve çalı, Marmara'da çınar ve servi.
Kavak bunun için eklendi.

**Nevşehir oynanabilir** (D-093): Keloğlan rehber, Kapadokya zemini, Anadolu ağaçları.
Beş duraktan üçünün modeli henüz teslim edilmedi, yer tutucu çiziliyor — bilerek.
Çok şehirli mimarinin (ikinci rehber, ikinci bölge, şehir başına ilerleme, elle
dokunulmamış bir sokağın döşenmesi) seksen şehir üstüne kurulmadan önce bir sokakta daha
kanıtlanması gerekiyordu. Nevşehir'in tam tur simülasyonu da geçiyor.

## 6b. Tamamlanan şehir kapanmıyor

Tamamlanmış bir şehre girince çocuk doğrudan özet paneline düşüyordu ve o panelin tek düğmesi
haritaya dönüyordu — yani bitirdiği şehre bir daha giremiyordu (D-094).

Artık sokakta açılıyor. Özet HUD'dan erişilebilir, panelde sokağa dönüş düğmesi var.
Toplanmış duraklar yaklaşınca tekrar açılmıyor ama istenirse bakılabiliyor; iki kez toplamak
iki yıldız vermiyor.

Yan etki: ses giriş düğmesinde açılıyordu ve tamamlanmış şehir o düğmeyi atlıyor.
Artık ilk dokunuş veya tuş o jest sayılıyor.

**Nevşehir teması** eklendi: *Gökyüzü Balonları*, 1,33 MB. Gaziantep kendi teması gelene kadar
sessiz — Boğaz şarkısını Kapadokya'ya çalmak, oraya çınar dikmekle aynı şey (D-095).

## 6c. Kapadokya

**Zemin bölgeye göre** (D-096): kıyı ve Marmara kaldırım, plato ve güneydoğu **kızıl kum**.
Üç ölçekte katmanlı gürültü ve hafif rüzgâr dalgaları; hücre ve harç yok, tozun derzi olmaz.
Karo 9 metrede tekrarlıyor (kaldırım 4) — tozun birimi yok, aynı tekrar desen gibi görünür.

**Hava da bölgeye göre** (D-097): kıyıda kabaran alçak uğultu, platoda kuru ve durgun rüzgâr.
Deniz sesi Kapadokya'da çalıyordu.

**Ufuk** (D-098): iki yanda on peri bacası sırtı, arkada Kapadokya vadisi.
Sırt ve 1. durak kümesi **aynı dosya, iki boyutta** — 6 m yanına gidilen, 17 m karşıdan görülen.
Balonlar geldiğinde ön taraf da kapanacak.

## 5. Bilinen sınırlar

1. **Ses yok.** Ayar kanalları (ortam / arayüz / rehber) ve durumları var, çalan bir ses yok. Faz 02'de `ambientAudioId` bağlanacak.
2. **Rehber karakteri silindir.** Animasyon durumları (idle, walk, wave…) henüz sözleşme olarak bile bağlanmadı; Faz 02 işi.
3. **Playwright yok.** Faz 01 uçtan uca testleri Vitest'teki saf mantık testleriyle karşılandı. Gerçek tarayıcı akış testi Faz 02'de eklenmeli.
4. **Nevşehir ve Gaziantep haritada kilitli.** İçerikleri geçerli, sahneleri Faz 02'de açılacak.
5. **`inspect-and-find` fare hedefi basit.** Panel üzerindeki üç motif primitif şekil; gerçek çini paneli gelince hedefler modelin kendi parçalarına bağlanmalı.
6. **Ürün İngilizce (D-014).** Arayüz de içerik de İngilizce; dil seçici kaldırıldı. `tr` alanları ileride bir Türkçe sürüm için duruyor.
7. **İstanbul ve Nevşehir'de ikişer durak graybox varlıkla çiziliyor** (Kapalıçarşı, simit arabası, balon, halı tezgâhı). Meshy brief'i gerekiyor.
8. **Her iki hero da teslim edildi ve entegre edildi.** Keloğlan 222.150 üçgen, Nasreddin Hoca 197.482 üçgen. İstanbul'un kanonik rehberi Hoca olduğu için varsayılan açılışta o görünür.
8b. **Zıplama yok.** İki GLB'de de `Jump` klibi bulunmadığı için özellik kaldırıldı. İstenirse önce klip gerekiyor.
8c. **Mobil ölçüm yok.** Tek yapılandırma seçildiği için zayıf cihazın düşeceği bir basamak kalmadı.
8d. **Keloğlan tarayıcıda görsel olarak doğrulanmadı.** Klip adları dosyadan okundu ve eşleşme testli, ama kliplerin içeriği görülmedi.
9. **Gerçek cihaz FPS ölçümü yok.** Telemetri katmanı hazır, ölçüm bekliyor.
10. **Su, deniz, gökyüzü yok.** `skyPreset` ve `environment.qualityNotes` okunuyor ama görsel karşılığı Faz 02'de.

---

## 6. Sıradaki tam görev — GÜNCELLENDİ

Faz 02 **başlatılmadı**. Kapı A kesin kabulü ve Meshy M0 entegrasyonu bekleniyor.

**Tek ve kesin sıradaki görev:** Meshy M0 paketinin ilk modelini `MODELS` tablosuna bağlayıp `AssetInstance` yolunu gerçek GLB ile doğrulamak (PROMPT 01B madde C). Kod değişikliği tek satır; doğrulanacak olan ölçek, pivot, seçilebilir alt mesh, yükleme/hata davranışı ve mobil performans.

Kapı A ve M0 kabulünden sonra `tasks/PHASE_02_PILOT_VERTICAL_SLICE.md` şu sırayla:

1. `PLAYABLE_CITY_IDS` listesini üç şehre çıkar ve Nevşehir ile Gaziantep'i aynı motordan geçir.
2. `sequence-select` (baklava malzemeleri) ve `rhythm-repeat` (bakırcı ritmi) etkileşimlerini uygula — üç ayrı tip şartı böylece dolar.
3. Bölge kitlerini (`marmara-urban-coastal`, Kapadokya, Gaziantep çarşısı) ayırt edilebilir hale getir.
4. Ses kanallarını gerçek seslere bağla.
5. Rehber karakterlerini animasyon sözleşmesiyle entegre et, model gelmezse belgelenmiş geçici çözümle.
6. Koleksiyon ekranını ekle ve dokuz pilot ödülün tamamını göster.
7. Playwright ile bir uçtan uca akış testi yaz.
8. Bir mobil ve bir masaüstü görünümünde gerçek performans ölçümü al.
