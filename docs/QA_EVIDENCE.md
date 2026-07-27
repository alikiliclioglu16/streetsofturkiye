# QA Evidence — Faz 01 / Kapı A

**Tarih:** 27 Temmuz 2026
**Kapsam:** PROMPT 01B (A-01…A-04), İçerik Kanonikleştirme C0, Hero Karakter Mimarisi (D-012)
**Karar talebi:** A-01, A-02, A-03 ve içerik güvencesi için tam kanıt sunuluyor. **A-04 kısmen karşılandı**; nedeni ve tam çalıştırma komutları aşağıda.

---

## 1. Ortam

| | |
|---|---|
| Çalıştırma yeri | Claude yürütme konteyneri (Linux, Ubuntu 24, GPU yok, tarayıcı binary'si yok) |
| Node | v22.22.2 |
| Paket kurulumu | `npm install` (450+55 paket) |
| Ağ | Yalnız npm/GitHub kaynaklarına açık; Playwright tarayıcı CDN'i (`cdn.playwright.dev`) engelli |
| Uygulama kökü | `app/` |

---

## 2. Çalıştırılan komutlar ve sonuçları

| Komut | Sonuç |
|---|---|
| `npm run content:check` | ✅ `81 cities, 249 stops, 84 questions (78 with one, 3 with two); 1413 strings match baseline` + `Content in sync (88 files).` |
| `npm run lint` | ✅ hatasız |
| `npm run typecheck` | ✅ hatasız (strict, `any` yok) |
| `npm test` | ✅ **9 dosya / 109 test geçti** |
| `npm run build` | ✅ 4 rota derlendi |
| `npm start` + HTTP kontrolü | ✅ `/map` 200, `/city/istanbul` 200, `/content/canonical/cities/istanbul.json` 200, `/content/scenes/istanbul.json` 200 (5 hotspot), `/content/canonical/city-index.json` 200 |
| `npx playwright install chromium` | ❌ **indirilemedi** — `Download failure, code=1` (ağ engeli) |
| `npm run test:e2e` | ⛔ tarayıcı binary'si olmadığı için çalıştırılamadı |

### Test dağılımı (93)

| Dosya | Test | Kapsam |
|---|---:|---|
| `tests/assets.test.ts` | 8 | A-01: manifest ↔ registry ↔ içerik hizası |
| `tests/movement.test.ts` | 14 | Sınırlar + A-03 rehberli mod durma davranışı |
| `tests/content.test.ts` | 10 | Şema doğrulama, dil yedeklemesi, 2 soru standardı |
| `tests/progress.test.ts` | 6 | Ödül tekrarsızlığı, quiz kapısı, il yıldızı |
| `tests/interaction.test.ts` | 6 | Etkileşim durum makinesi |
| `tests/content-sync.test.ts` | 3 | Kök içerik ↔ servis edilen kopya |
| `tests/ui-flow.test.tsx` | 10 | Gerçek DOM: odak, Escape, klavye, quiz akışı |
| `tests/canonical.test.ts` | 18 | C0: kanonik yetke, sahne ayrımı, birleştirme |
| `tests/heroes.test.ts` | 40 | D-012 + M0-K1: tek hero, önbellek, profiller, mixer, dans torbası, teslim edilen model, koreografi |

---

## 3. A-01 — Varlık kaydı hizalaması

**Bulgu doğrulandı.** Önceki registry elle yazılmıştı ve manifestte olmayan ID'ler uyduruyordu (`city_nevsehir_fairy_chimney`, `city_gaziantep_mosaic_panel`, `city_gaziantep_copper_stall`, `city_nevsehir_balloon`), 25 satırın 12'si hiç yoktu. Nevşehir ve Gaziantep sahneleri kurulsa "bilinmeyen varlık" verecekti.

**Yapılan**

- `scripts/build-asset-registry.mjs` CSV'yi okuyup `src/engine/assets/generated-manifest.ts` dosyasını üretiyor. Dosya repoya işlendi, başında "DO NOT EDIT BY HAND" uyarısı var. Komut: `npm run assets:registry`.
- Boyutlar CSV'deki **genişlik × derinlik × yükseklik** biçiminden Three.js sırasına (x, y, z) çevriliyor. Galata artık 32 m; önceki elle yazılmış değer 14 m'ydi.
- Hiçbir ID yeniden adlandırılmadı. İçerikteki `marmara-urban-coastal` ile manifestteki `kit_marmara_urban_coastal` arasında `kitAssetId()` adında belgelenmiş deterministik bir kural var.
- İl yıldızları (`star_istanbul` vb.) bilinçli olarak manifestte yok; `isModelAsset()` bunları registry dışında tutuyor.
- `buildScene()` artık yalnız hotspot'ları değil, kit, rehber, rota işareti ve **koleksiyon ödüllerini** de çözüyor. Ödüller önceki sürümde hiç kontrol edilmiyordu ve `RewardPanel` bilinmeyen varlık gösteriyordu.

**Kabul kanıtı**

```
✓ covers every row of the manifest                                    (25/25)
✓ keeps the generated manifest in step with the CSV
✓ resolves every hotspot, reward and kit reference in every pilot city
✓ reports zero unknown assets when building all three pilot scenes
✓ treats province stars as UI awards rather than models
✓ maps content kit ids onto manifest kit ids without renaming either side
✓ carries manifest budgets through to the registry
✓ falls back to placeholder geometry while no GLB is delivered
```

`buildScene()` İstanbul, Nevşehir ve Gaziantep için `unknownAssetIds: []` döndürüyor.

---

## 4. A-02 — Gerçek GLB yolu

**Yapılan**

- Tek bileşen: `src/components/three/AssetInstance.tsx`. Girdisi `ResolvedAsset`; ham yol almıyor.
- `modelUrl` doluysa `useGLTF` ile GLB yükleniyor, sahne grafiği klonlanıyor (aynı GLB'yi kullanan iki hotspot transform paylaşmasın diye).
- `modelUrl` boşsa, ID bilinmiyorsa, yükleme başarısızsa veya dosya bozuksa `PlaceholderAsset` çiziliyor. Yükleme başarısızlığı bir React hata sınırıyla yakalanıyor; hook'lar loader hatasını yakalayamadığı için sınıf bileşeni kullanıldı.
- `HotspotObject` ve `PlayerRig` artık `PlaceholderAsset`'i doğrudan çağırmıyor; ikisi de `AssetInstance` üzerinden geçiyor.
- **Ölçek düzeltmesi:** yüklenen model manifest yüksekliğinden 2 kattan fazla sapıyorsa otomatik ölçekleniyor. Meshy çıktıları tutarsız ölçekte geliyor; manifest sözleşme olduğu için sahne, model M0 ölçek kontrolünden geçmeden önce de doğru duruyor.
- **Önbellek ve serbest bırakma:** `useGLTF` URL bazında önbellekliyor, şehre yeniden girildiğinde yeniden indirilmiyor. Klonlanan grafik unmount'ta düşüyor; kaynak `releaseModel()` ile `useGLTF.clear(url)` çağrılarak bırakılıyor.

**Kanıt sınırı — dürüst not:** Yol kod olarak tamamlandı ve fallback tarafı testli, ancak **gerçek bir GLB ile çalıştırılmadı**. QA fixture GLB üretmedim: elimde geçerli bir ikili örnek yok ve uydurma bir dosya "doğrulandı" izlenimi verirdi. Gerçek doğrulama Meshy M0 paketinin ilk modeliyle yapılmalı; PROMPT 01B'nin C maddesi zaten bunu tarif ediyor. `MODELS` tablosuna tek satır eklemek yeterli, başka kod değişmiyor.

---

## 5. A-03 — Rehberli modda durma

**Bulgu doğrulandı.** Rehberli mod yalnız bir panel açıkken duruyordu; duraklardan yürüyerek geçiyordu.

**Yapılan.** `guidedPauseHotspot()` saf fonksiyonu: oyuncu tamamlanmamış bir durağın tetik yarıçapındaysa yürüyüşü durduruyor. Tamamlanmış duraklar hiç durdurmuyor, dolayısıyla ödül paneli kapanıp ilerleme kaydedildiği anda yürüyüş kendiliğinden devam ediyor. Elle keşif davranışı değişmedi.

**Kabul kanıtı**

```
✓ halts when it reaches an unfinished stop
✓ stays halted while the interaction is unresolved
✓ resumes once the stop is completed
✓ does not halt again at a completed stop
✓ walks the whole route when every stop is done
```

---

## 6. İçerik kaynak bütünlüğü

**Bulgu doğrulandı ve bu arada gerçekleşti.** İki soru kararı uygulanırken değişiklik yalnız `app/public/content/pilot/istanbul.json` dosyasına yazıldı; kökteki `content/pilot/istanbul.json` tek soruda kaldı. Tam olarak uyarılan sapma.

**Yapılan**

- Kök `content/` tek düzenlenebilir kaynak. `app/public/content/` artık üretilen çıktı.
- `npm run content:sync` kökten kopyalıyor ve 81 illik harita indeksini türetiyor. `npm run dev` ve `npm run build` bunu otomatik çalıştırıyor.
- `npm run content:check` yazmadan karşılaştırıyor; fark varsa hata koduyla çıkıyor.
- `tests/content-sync.test.ts` sapmayı testte yakalıyor ve bir kopyayı bilerek bozup kontrolün gerçekten başarısız olduğunu doğruluyor.
- Kökteki İstanbul dosyası iki soruya güncellendi ve kopyalar yeniden üretildi.

---

## 7. A-04 — Tarayıcı QA kanıtı

### Karşılanan

`tests/ui-flow.test.tsx` — jsdom üzerinde **gerçek DOM** ile çalışan 10 test, her `npm test` çalıştırmasında:

```
✓ moves focus into the dialog on open
✓ closes on Escape when dismissible
✓ keeps Tab inside the dialog
✓ marks itself as a modal dialog
✓ shows the position in a two-question set
✓ advances only on the correct option
✓ is fully operable from the keyboard
✓ flags content that has not passed editorial review
✓ falls back to English when Turkish is missing
✓ separates earned collectibles from missing ones without relying on colour
```

Ayrıca production sunucusu ayağa kaldırılıp `/map`, `/city/istanbul` ve içerik uçları HTTP 200 doğrulandı.

### Karşılanmayan

**Playwright çalıştırılamadı ve ekran görüntüsü üretilemedi.** Neden: konteynerin ağ izin listesi Playwright tarayıcı CDN'ini içermiyor; `npx playwright install chromium` `Download failure, code=1` veriyor. Konteynerde kurulu bir Chromium/Firefox de yok. Bu bir kod eksiği değil, çalıştırma ortamı sınırı.

**Süit yazıldı ve teslim edildi:** `playwright.config.ts` (masaüstü 1440×900 + Pixel 7) ve `e2e/istanbul-flow.spec.ts`. Kapsadıkları: harita → İstanbul → giriş → rehberli hareket → üç durak → ödül → iki soruluk quiz → tamamlama; yenilemede kalıcılık; ödül tekrarsızlığı; Escape; reduced-motion; mobil kolun görünürlüğü; konsol hatası toplama (sıfır olmalı); altı masaüstü + bir mobil ekran görüntüsü `docs/screenshots/` altına.

**Senin veya CI'ın çalıştırması için tam komutlar:**

```bash
cd app
npm ci
npx playwright install chromium
npm run test:e2e                      # her iki viewport
npx playwright test --project=desktop # yalnız masaüstü
npx playwright show-report e2e/report
```

Ekran görüntüleri `docs/screenshots/` altına `desktop-01-map.png` … `mobile-07-mobile-controls.png` adlarıyla düşer.

**Preview URL yok.** Bu ortamdan dağıtım yapamıyorum ve yapmam da doğru olmaz. Vercel'e bağlandığında her push otomatik preview üretecek; kurulum GitHub + Vercel adımlarında anlatıldığı gibi, tek kritik ayar **Root Directory = `app`**.

### Yerel çalıştırma

```bash
cd app && npm ci && npm run dev     # http://localhost:3000
```

---

## 8. Değişen dosyalar

**Yeni**

```
app/scripts/build-asset-registry.mjs
app/scripts/sync-content.mjs
app/src/engine/assets/generated-manifest.ts     (üretilen)
app/src/components/three/AssetInstance.tsx
app/tests/assets.test.ts
app/tests/content-sync.test.ts
app/tests/ui-flow.test.tsx
app/tests/setup-ui.ts
app/playwright.config.ts
app/e2e/istanbul-flow.spec.ts
docs/QA_EVIDENCE.md
```

**Değişen**

```
content/pilot/istanbul.json                     (2. quiz sorusu köke taşındı)
app/src/engine/assets/registry.ts               (manifestten üretiliyor)
app/src/engine/scene/buildScene.ts              (kit + ödül çözümü, tam unknown raporu)
app/src/engine/controls/guided.ts               (guidedPauseHotspot)
app/src/components/three/PlayerRig.tsx          (durakta durma, AssetInstance)
app/src/components/three/HotspotObject.tsx      (AssetInstance)
app/src/components/three/PlaceholderAsset.tsx   (manifest fallback adları)
app/src/components/three/CityScene.tsx          (ilerlemeyi rig'e geçirme)
app/tests/movement.test.ts                      (A-03 testleri)
app/vitest.config.ts                            (logic + ui projeleri)
app/package.json                                (yeni komutlar)
docs/IMPLEMENTATION_STATUS.md
```

**Silinen:** `app/scripts/build-city-index.mjs` (görevi `sync-content.mjs` devraldı)

---

## 8b. C0 kanonik içerik kanıtı

Doğrulayıcının her kuralı negatif testle denendi; ayrıntı ve tablo için
`docs/CANONICAL_MIGRATION_REPORT.md` bölüm 5. En önemlisi: İstanbul sahnesine
kanonik bir cümle yapıştırıldığında `content:check` hata verdi ve derleme
durdu — yani "sahne dosyası kanonik metni çoğaltamaz" kuralı gerçekten
uygulanıyor, yalnız belgede yazmıyor.

**Bir uyarı.** Ara bir çalıştırmada vitest "59 test geçti" dedi; oysa UI test
dosyası worker başlatamadığı için hiç çalışmamıştı ve bu hata sayılmıyordu.
Bağımlılıklar düzgün kurulunca aynı dosya iki gerçek hata verdi. Yeşil bir test
raporunda dosya sayısını da kontrol etmek gerekiyor.

## 8c. Hero karakter kanıtı

Politika kurallarının kod karşılığı ve safe profilinde verilen tavizlerin tam
listesi `docs/HERO_CHARACTER_REPORT.md` bölüm 2 ve 4'te.

**Ölçüm alınamadı.** Konteynerde GPU yok; canlı siteye Chrome'dan baktığımda
otomasyon sekmesi arka planda olduğu için `requestAnimationFrame` 1,5 saniyede
**0 kare** verdi — render döngüsü tamamen duruyor, FPS ölçmenin anlamı yok.
Telemetri katmanı hazır ve 11 alanı raporluyor; ölçüm sekme önde `npm run dev`
ile alınmalı.

**Gerçek GLB ile denenmedi.** İki hero da henüz teslim edilmedi. Kod içinde
düşük poligonlu varyant veya otomatik model değiştirme yolu bulunmuyor; bir
test, düşürme merdiveninde "character", "hero" ve "mesh" kelimelerinin
geçmediğini doğruluyor.

## 9. Bilinen sınırlar

1. **Playwright ve ekran görüntüleri bu ortamda üretilemedi.** Süit hazır; tek komutla çalışır.
2. **GLB yolu gerçek dosyayla denenmedi.** M0'ın ilk modeliyle doğrulanmalı.
3. **Nevşehir ve Gaziantep hâlâ haritada kilitli.** Varlık ve içerik referansları artık tam çözülüyor ama sahneleri Faz 02 işi.
4. **Bu iki şehrin ikinci quiz soruları yazılmadı.** Testler bunu standart altı olarak raporluyor.
5. **Ses yok.** Kanallar ve ayarlar var, çalan ses yok.
6. **Performans gerçek cihazda ölçülmedi.** GPU'suz ortam; overlay hazır.

---

## 10. Sıradaki tek ve kesin görev

Meshy M0 paketinden gelen ilk modeli `MODELS` tablosuna bağlayıp `AssetInstance` yolunu gerçek GLB ile doğrulamak (PROMPT 01B madde C). Faz 02 başlatılmadı ve `PROMPT_02_VERTICAL_SLICE.txt` çalıştırılmadı.
