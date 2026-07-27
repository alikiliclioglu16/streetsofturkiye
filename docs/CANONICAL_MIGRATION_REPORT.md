# Canonical Content Migration Report (C0)

**Tarih:** 27 Temmuz 2026
**Görev:** Content Canonicalization C0
**Kaynak SHA-256:** `ed74da639543bd1847d3e970f114e006ec9be8a8d441197a1968afca5a07f995`
**Doğrulama:** Depodaki `legacy/index.html` bu SHA ile birebir eşleşti; kaynak dosya değiştirilmedi.

Faz 02 başlatılmadı. Keloğlan GLB entegrasyonu yapılmadı.

---

## 1. Kurulan mimari

İçerik ikiye ayrıldı ve aralarındaki tek bağ `contentRef` oldu.

```
content/
  canonical/          ← salt okunur yetke, kaynak HTML'den türetilmiş
    manifest.json     ← SHA, sayımlar, kurallar
    regions.json      ← 7 bölge
    taxonomy.json     ← kategoriler, 53 legacyArt tipi, küresel rehber replikleri
    city-index.json   ← 81 il, harita için hafif indeks
    cities/*.json     ← 81 il kaydı
    cities.all.json   ← toplu dosya (tarayıcıya asla gönderilmez)
  scenes/             ← teknik 3B verisi
    istanbul.json
    nevsehir.json
    gaziantep.json
  canonical-integrity.json  ← 1413 kanonik dizginin özeti
```

**Sahne dosyalarında ne var:** çevre, rota, dönüşümler, varlık kimlikleri, kameralar, tetik yarıçapları, etkileşim mekaniği, ses kimlikleri.
**Sahne dosyalarında ne yok:** başlık, açıklama, rehber repliği, ödül etiketi, soru, şık. Hiçbiri.

Birleştirme yalnız `src/content/compose.ts` içinde, çalışma zamanında yapılıyor.

## 2. Kaldırılan veya kanonik kayda bağlanan uydurma/parafraz metinler

Aşağıdakiler önceki sürümlerde koda ya da sahne dosyasına gömülüydü. Hepsi kaldırıldı.

| Nerede | Kaldırılan metin | Yerine gelen |
|---|---|---|
| Pilot içerik | Uydurma durak başlıkları: "İznik Çini Paneli", "Galata Kulesi Gözlem Katı", "Boğaz Vapuru" | `istanbul-stop-01…05` kanonik başlıkları |
| Pilot içerik | Parafraz edilmiş bilgi metinleri | Kanonik `description` alanları, birebir |
| Pilot quiz | **Benim yazdığım** ikinci İstanbul sorusu: "Boğaz İstanbul'un iki yakasını bağlar. Bunlar hangi iki kıtadır?" | Kanonik `istanbul-quiz-01`: "İstanbul is the only city in the world built on…" |
| Pilot quiz | Uydurma şıklar: "Avrupa ve Asya / Asya ve Afrika / Avrupa ve Afrika" | Kanonik şıklar, kaynaktaki sırayla |
| `InteractionPanel.tsx` | Sabit kodlanmış şıklar: "Lale motifi", "Kare desen", "Yuvarlak nokta" | Kanonik ödül etiketleri; doğru cevap o durağın ödülü, çeldiriciler aynı ilin diğer duraklarının ödülleri |
| `InteractionPanel.tsx` | Sabit ipucu: "Uzun, sivri uçlu olanı ara." | Kanonik `guideLine` |
| Sahne/içerik | Görev talimatı: "Find {reward} at {title}." — kanonik başlığı kopyalıyordu | `gameplayCopy.instruction` = "Find {reward}." Başlık artık geçmiyor |
| `IntroPanel` verisi | Uydurma giriş başlığı "İki Kıtanın Buluştuğu Şehir" ve repliği "Mavi rotayı takip et. Acele etmeden ayrıntılara bakacağız." | Kanonik il adı + ilk durağın kanonik rehber repliği |
| `RewardPanel` / `CompletionPanel` | Ödül adları varlık kaydından geliyordu ("İznik tile panel") | Kanonik `reward.label` + kaynaktaki emoji |
| Tüm duraklar | `editorialStatus: "legacy-unverified"` | `editorialStatus: "canonical"` — içerik yetkeden geliyor |
| `content/pilot/` | Tüm klasör | `content/canonical/` + `content/scenes/` |
| `content/regions.json` | Yerel bölge listesi | `content/canonical/regions.json` |

Hiçbir kanonik dizgi düzeltilmedi, kısaltılmadı, uzatılmadı, çevrilmedi veya olgu denetiminden geçirilip değiştirilmedi.

## 3. İki soru kuralının kaldırılması

Önceki proje sahibi kararı "il başına 2 soru" idi. Kanonik kaynak bunu desteklemiyor: **78 ilde 1 soru, 3 ilde 2 soru**, toplam 84. Kural geri çekildi.

- `REQUIRED_QUIZ_ITEMS` ve `meetsQuizStandard()` silindi.
- Doğrulayıcı artık soru sayısının kaynakla **birebir** eşleşmesini şart koşuyor; ikiye zorlama denemesi hata veriyor.
- Test: 78/3 dağılımı ve `max = 2` doğrulanıyor.

## 4. İstanbul'un eksik iki durağı

Denetim notunda "mevcut İstanbul graybox'ında yalnız 3 teknik hotspot var, diğer 2 kanonik durağı kaybetme" deniyordu.

**Durum: kayıp yok, beşi de sahnede.** `content/scenes/istanbul.json` beş teknik hotspot içeriyor:

| # | Kanonik durak | Varlık | Durum |
|---|---|---|---|
| 1 | Hagia Sophia & the Blue Mosque | `city_istanbul_iznik_tile_panel` | commissioned |
| 2 | Galata Tower | `city_istanbul_galata_tower` | commissioned |
| 3 | The Grand Bazaar | `graybox_bazaar` | **graybox — Meshy brief bekliyor** |
| 4 | The Simit Cart | `graybox_simit` | **graybox — Meshy brief bekliyor** |
| 5 | Ferry on the Bosphorus | `city_istanbul_ferry` | commissioned |

Beşinin de `sceneStatus: "ready"`; üçüncü ve dördüncü durak `assetStatus: "graybox"` ile işaretli. Yani oyuncu beş durağı da geziyor, ama iki tanesi hâlâ ilkel geometri. Aynı durum Nevşehir'de de var (balon ve halı tezgâhı).

`pendingStopIds` alanı, ileride bir kanonik durağın sahnesi olmazsa onu raporlamak için hazır; şu an üç pilot ilde de boş.

## 5. Doğrulama kapıları

`npm run content:check` şu durumlarda **hata veriyor** (hepsi negatif testle denendi):

| Kural | Denendi |
|---|---|
| Kaynak SHA'sı migrasyon olmadan değişirse | ✔ |
| İl sayısı 81 değilse | ✔ |
| Durak sayısı 249 değilse | ✔ |
| Soru sayısı 84 değilse | ✔ |
| 78/3 soru dağılımı bozulursa (ikiye zorlama dahil) | ✔ |
| Kanonik bir İngilizce dizgi değişirse (1413 dizginin özeti) | ✔ |
| Bir sahne olmayan kanonik kimliğe atıfta bulunursa | ✔ |
| Bir sahne dosyası kanonik metni kopyalarsa | ✔ — İstanbul sahnesine kanonik cümle yapıştırıldı, doğrulayıcı hata verdi |
| Yayımlanan kopyalar kaynaktan saparsa veya bayat dosya kalırsa | ✔ |

## 6. Kalite kapısı

```
npm run content:check  → 81 il, 249 durak, 84 soru (78 tek, 3 çift); 1413 dizgi eşleşti; 88 dosya senkron
npm run lint           → temiz
npm run typecheck      → temiz
npm test               → 8 dosya / 69 test geçti
npm run build          → 4 rota derlendi
```

Sunucu doğrulaması: `/map` 200, `/city/istanbul` 200, `/content/canonical/cities/istanbul.json` 200, `/content/scenes/istanbul.json` 200 (5 hotspot), `/content/canonical/city-index.json` 200.

**Bir uyarı:** ara bir çalıştırmada test raporu "59 geçti" dedi ama UI test dosyası worker başlatamadığı için hiç çalışmamıştı — vitest bunu hata saymıyor. Bağımlılıklar düzgün kurulduktan sonra o dosya iki gerçek hata verdi ve düzeltildi. Yeşil bir test raporunun dosya sayısını da kontrol etmek gerekiyor.

## 7. Şüpheli görülenler — kanonik veri DEĞİŞTİRİLMEDİ

Prompt gereği burada yalnız rapor ediyorum, hiçbirine dokunmadım:

1. **Nevşehir'in adı** kanonik kayıtta "Nevşehir (Cappadocia)". Bu bir il adı değil, açıklamalı bir etiket. Haritada ve şehir başlığında böyle görünüyor.
2. **İstanbul quiz 2** ("What is a simit?") 4. durakla, quiz 1 ise 5. durakla ilgili. İçerik doğru; yalnızca soru sırası durak sırasını izlemiyor.
3. **Rehber repliklerinin 234'ü** ilgili duraktan değil, küresel `SAYS` listesinden geliyor (`guideLine.source` alanında işaretli). Bu 234 replik durağa özgü değil, genel. Pilot üç ilde 15 replik durağa özgü.
4. **Tüm kanonik içerik İngilizce.** Türkçe alanlar `null` ve öyle bırakıldı. Arayüz metinleri Türkçe, içerik İngilizce — çocuk kullanıcı için karışık bir deneyim olabilir; ayrı bir yerelleştirme katmanı kararı gerekiyor.

## 8. Sıradaki tek ve kesin görev

Meshy M0 modelini varlık kaydına bağlayıp `AssetInstance` yolunu gerçek GLB ile doğrulamak. Faz 02 hâlâ başlatılmadı.
