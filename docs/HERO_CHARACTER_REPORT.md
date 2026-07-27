# Hero Character Architecture — Change Report

**Tarih:** 27 Temmuz 2026
**Karar:** D-012 — Keloğlan ve Nasreddin Hoca hero karakter
**Kapsam:** Yalnız mimari. Düşük poligonlu hero varyantı üretilmedi, kanonik içeriğe dokunulmadı, Keloğlan GLB'si henüz teslim edilmedi.

---

## 1. Ne değişti

Kalite sistemi `low / medium / high` katmanlarından **`safe / balanced / high` profillerine** geçti. Aradaki fark kritik: eski katmanlar her şeyi birlikte düşürüyordu, yeni profiller yalnız **çevreyi** düşürüyor. Hero mesh'i üç profilde de birebir aynı.

```
src/engine/heroes/
  policy.ts      profiller, bütçe, düşürme merdiveni, cihaz tespiti
  registry.ts    iki hero, animasyon manifestosu, checksum, bütçe raporu
  heroCache.ts   yükleme ve önbellek kuralları
  danceBag.ts    tekrarsız kutlama dansı torbası
  animation.ts   hareket → klip eşlemesi
src/components/three/HeroCharacter.tsx   tek montaj noktası, tek mixer
src/components/map/GuidePortrait.tsx     2B portre
```

## 2. Politika kuralları ve karşılıkları

| Kural | Nerede uygulandı |
|---|---|
| Normal şehirde tek hero | `heroCache.requestHero()` farklı bir hero istendiğinde öncekini bırakıyor; `maxActiveHeroes()` varsayılan 1 |
| Pasif hero yüklenmez | Pasif hero için hiçbir istek üretilmiyor; test bunu doğruluyor |
| Harita ve koleksiyon 2B | `GuidePortrait`; testte `map/page.tsx` içinde `HeroCharacter` geçmediği doğrulanıyor |
| Tembel yükleme | `heroReady = status === 'ready' && phase !== 'intro'` — şehir kabuğu, kanonik içerik ve graybox sahne hazır olmadan GLB istenmiyor |
| Önbellek şehirler arası korunur | `onCityUnmount()` bilinçli olarak boş döner |
| Bırakma yalnız rehber değişimi / bellek baskısı | `requestHero` (rehber değişimi) ve `releaseInactiveHeroes()` (açık baskı) |
| Mesh asla otomatik düşmez | `preserveFullQualityMeshAcrossProfiles: true`; merdivende karakter maddesi yok |
| Gölge politikası | high/balanced: hero gölge açık; safe: kapalı. Sahnede tek gölge veren ışık var |
| Tek mixer | `HeroCharacter` dışında `mixer.update` çağrısı yok; test tüm `src` ağacını tarayıp bunu doğruluyor |
| Dans havuzu tekrarsız | `danceBag.ts`; 200 çekimde arka arkaya tekrar yok |
| İki hero sahnesi | `allowTwoHeroScene` varsayılan `false`; `profileForTwoHeroScene()` dokunmatikte safe'e düşürüyor |
| Hata davranışı | `heroRenderMode()` — ready değilse, hata varsa veya model yoksa placeholder; şehir oynanabilir kalıyor |

## 3. Düşürme merdiveni

Kare hızı düştüğünde sırasıyla feda edilenler:

1. post-processing
2. çevre dekorasyon yoğunluğu
3. gölge haritası çözünürlüğü
4. zorunlu olmayan gölgeler
5. cihaz piksel oranı
6. uzak çevre varlıkları

Karakter mesh'i ve animasyonu bu listede **yok**. Bir test, merdiven metninde "character", "hero" veya "mesh" kelimelerinin geçmediğini doğruluyor — yani ileride biri merdivene karakter eklerse test kırılır.

## 4. Safe profilinde verilen tavizlerin tam listesi

`environmentConcessions(QUALITY_PROFILES.safe)` çıktısı:

```
post-processing
environment-decoration-density
shadow-map-resolution
nonessential-shadows
device-pixel-ratio
distant-environment-assets
```

Sayısal karşılıkları:

| | high | balanced | safe |
|---|---|---|---|
| DPR üst sınırı | 2.0 | 1.5 | 1.0 |
| Gölge haritası | 2048 | 1024 | 512 |
| Hero gölgesi | açık | açık | **kapalı** |
| Post-processing | açık | kapalı | kapalı |
| Dekorasyon yoğunluğu | 1.0 | 0.65 | 0.35 |
| Uzak varlık kesimi | 220 m | 140 m | 90 m |
| **Hero mesh** | **tam** | **tam** | **tam** |

Dekorasyon yoğunluğu artık gerçek: `CityScene` sahne dekorunu bu çarpanla üretiyor ve kesim mesafesini uyguluyor. Yani safe profilinde 24 dekor nesnesi 8'e iniyor ve uzaktakiler hiç çizilmiyor.

## 5. Keloğlan GLB'sinin durumu — dürüst not

**Model henüz teslim edilmedi**, dolayısıyla "mevcut Keloğlan GLB'sinin üretim varlığı olarak seçili kaldığının kanıtı" maddesini gerçek dosyayla gösteremiyorum. Gösterebildiklerim:

- `registry.ts` içinde Keloğlan `character_keloglan_base` varlık kimliğiyle tanımlı, `modelUrl: null`.
- Kod içinde hiçbir yerde düşük poligonlu varyant, decimation veya otomatik model değiştirme yolu yok. Test bunu merdiven üzerinden doğruluyor.
- `checkHeroBudget()` 222.150 üçgeni "bütçe içinde" kabul ediyor, 400.000'i ise "raporla, decimate etme" diyerek reddediyor.
- Model geldiğinde değişecek tek şey `registry.ts` içindeki üç alan: `modelUrl`, `checksum`, `triangles`, `transferBytes`. Başka hiçbir kod satırı değişmiyor.

Bu, C0'daki `AssetInstance` durumuyla aynı: yol hazır ama gerçek dosyayla henüz denenmedi. İlk gerçek testi Keloğlan GLB'si olacak.

## 6. Performans kanıtı — bu ortamdan alınamadı

Ölçüm yapılamadı ve bunu net söylüyorum:

- Konteynerde GPU yok.
- Chrome üzerinden canlı siteye baktığımda otomasyon sekmesi arka planda olduğu için `requestAnimationFrame` **1,5 saniyede 0 kare** verdi; render döngüsü tamamen duruyor. Bu koşulda FPS ölçmenin anlamı yok.

Telemetri katmanı hazır ve gerekli her alanı raporluyor: fps, draw call, üçgen, doku, DPR, aktif profil, aktif hero, aktif klip, hero gölgesi ve yürürlükteki taviz listesi. Ölçümü sen alacaksın:

```bash
cd app && npm run dev
```

Sekme **önde** olacak şekilde `/city/istanbul` aç. Sağ alttaki katmandan oku. Mobil için Chrome DevTools → cihaz emülasyonu → Pixel 7, sonra sayfayı yenile (profil tespiti açılışta çalışıyor).

Kaydedilmesi gerekenler: masaüstü FPS, mobil FPS, draw call, üçgen, doku/geometri sayısı ve kutlama dansı sırasındaki FPS ayrı olarak.

## 7. Kalite kapısı

```
npm run content:check → 81 il, 249 durak, 84 soru; 1413 dizgi eşleşti; 88 dosya senkron
npm run lint          → temiz
npm run typecheck     → temiz
npm test              → 9 dosya / 93 test geçti (24'ü hero mimarisi)
npm run build         → 4 rota derlendi
```

Bu arada kendi ESLint kuralım kendi testimi yakaladı: bileşenlerde `.glb` dizgisini yasaklayan kural, sahte bir yol kullanan hero testini de reddetti. Kuralın kapsamını `src/components` ve `src/app` ile sınırladım — kayıtlar ve testler yol yazabilir, bileşenler yazamaz. Kural amacına uygun hâle geldi.

## 8. Dikkat çeken bir ayrıntı

İstanbul'un kanonik rehberi **Nasreddin Hoca**, Keloğlan değil. Kanonik veride rehber sırayla atanıyor (`legacyGuideId`), İstanbul birinci il olduğu için Hoca'ya düşüyor. Keloğlan GLB'si geldiğinde onu sahnede görmek için Keloğlan'lı bir ile bakman gerekir — örneğin Tekirdağ. İstanbul'da test etmek istersen `content/scenes/istanbul.json` yerine kanonik `legacyGuideId`'yi değiştirmek gerekir ki o kanonik veri, dokunulmaz. Bunun yerine ayarlara geçici bir "rehberi zorla" seçeneği eklenebilir; istersen eklerim.

## 9. Sıradaki tek ve kesin görev

Keloğlan GLB'sini teslim al, `registry.ts` içindeki dört alanı doldur, gerçek dosyayla yükleme yolunu, ölçeği, pivotu, animasyon kliplerini ve mobil performansı doğrula.
