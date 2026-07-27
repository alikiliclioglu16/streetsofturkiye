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
npm test           → 11 dosya / 152 test geçti (logic + jsdom ui)
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
