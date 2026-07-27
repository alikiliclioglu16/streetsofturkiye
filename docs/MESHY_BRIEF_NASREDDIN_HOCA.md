# Meshy Brief — Nasreddin Hoca (Hero Character 2/2)

**Hazırlanma tarihi:** 27 Temmuz 2026
**Amaç:** Teslim edilen Keloğlan ile **aynı teknik sınıfta** ikinci hero karakteri üretmek.
**Durum:** Üretim Meshy'de yapılacak. Bu belge şartnamedir, model değildir.

Bu şartname tahminle değil, teslim edilen Keloğlan GLB'si ölçülerek yazıldı. Sayılar o dosyadan geliyor.

---

## 1. Teslim edilen Keloğlan'ın ölçülen teknik profili

Nasreddin Hoca bu profile uymalı; ART_BIBLE'daki "biri diğerinden belirgin şekilde ucuz görünmemeli" kuralı bunu gerektiriyor.

| Ölçüt | Keloğlan (ölçüldü) | Nasreddin Hoca hedefi |
|---|---|---|
| Üçgen | 222.150 | 180.000–250.000 |
| Vertex | 118.681 | benzer |
| Mesh sayısı | 1 | 1 |
| Materyal | 1 | 1 |
| Doku (image / texture) | 1 / 2 | 1 / 2 |
| Eklem (joint) | 24, biped | 24, biped, aynı isimlendirme |
| Kök eklem | `Hips` | `Hips` |
| Armature ölçeği | 0.01 (cm→m) | aynı olabilir, ölçü doğruysa fark etmez |
| Model yüksekliği | 1.70 m | **1.75–1.85 m** (yetişkin) |
| Dosya boyutu | 16,7 MB | 15–18 MB |
| Yön | +Y yukarı, +Z ileri | aynı |
| Pivot | taban merkezinde | aynı |

**Not:** Keloğlan 1.70 m ölçüldü ama manifest onu 1.45 m olarak brief'liyor — masallarda çocuk olduğu için. Motor bu farkı `measuredHeightMeters` üzerinden ölçekleyerek kapatıyor. Nasreddin Hoca yetişkin, dolayısıyla manifestteki 1.65 m ile modeldeki boy yakın olmalı; aradaki fark yine otomatik düzeltilir ama küçük tutulması iyi olur.

## 2. Animasyon klip sözleşmesi

Motor klipleri **isimle** arıyor. Aşağıdaki dört ismin birebir aynı olması gerekiyor, yoksa fallback devreye girer ve karakter idle'da takılır.

| Motor durumu | Klip adı (zorunlu) | Süre hedefi |
|---|---|---|
| idle | `Idle_11` | 2–4 sn, döngülü |
| walk | `Walking` | ~1 sn, döngülü, **yerinde** |
| run | `Running` | ~0,6 sn, döngülü, **yerinde** |
| talk | `Talk_Passionately` | 8–12 sn, döngülü |

**Yerinde olması kritik.** Keloğlan'ın `Walking` ve `Running` kliplerinde kök yer değiştirmesi tam olarak sıfır ölçüldü; motor karakteri kendisi hareket ettiriyor. Klip kendi başına ilerlerse karakter zeminde kayar.

### Kutlama dansları

En az **dört** onaylı dans gerekiyor, tekrarsız torba sisteminin çalışması için. Keloğlan'ınkiler: `FunnyDancing_01`, `FunnyDancing_03`, `Hip_Hop_Dance`, `Joyful_Dance_with_Hand_Sway`.

Nasreddin Hoca için karakterine uygun olanı seçin — Hoca eşeğe ters binen, bilge ve şakacı bir figür. Hip hop ona yakışmaz. Öneri yönü: halk oyunu esintili, ağırbaşlı-komik, sakallı ve cüppeli bir figürün yapabileceği hareketler.

**Dans kliplerinde kök yer değiştirmesi 0,1 m'yi geçmemeli.** Keloğlan'da ölçtüklerim:

| Klip | Kök kayması | Karar |
|---|---|---|
| `FunnyDancing_01` | 0,21 m yanal | kabul, motor yatayda sabitliyor |
| `FunnyDancing_03` | ihmal edilebilir | kabul |
| `Hip_Hop_Dance` | ihmal edilebilir | kabul |
| `Joyful_Dance_with_Hand_Sway` | ihmal edilebilir | kabul |
| `Step_Hip_Hop_Dance` | **0,83 m ileri** | **reddedildi** |
| `Breakdance_1990` | — | **reddedildi**, 0,50 sn, yarım duruyor |

## 3. Görsel yön

`docs/ART_BIBLE.md` geçerli. Ek olarak:

- Yetişkin, orta yaşlı, sakallı, cüppeli ve sarıklı.
- Yüz ifadesi bilge ve sıcak; korkutucu veya asık suratlı değil.
- Çocuk kullanıcı için okunaklı silüet: sarık ve sakal siluetin ayırt edici parçaları olmalı.
- Keloğlan ile aynı stilize seviyesi — ikisi yan yana geldiğinde aynı dünyadan görünmeli.
- Eşek **bu modele dahil değil**; ayrı bir varlık olarak sonra brief'lenecek.

## 4. Teslim kontrolü

Model geldiğinde şunlar ölçülüp `registry.ts` içine yazılacak: dosya adı (değiştirilmeden), SHA-256, üçgen sayısı, bayt boyutu, ölçülen yükseklik, teslim edilen tüm klip adları, onaylı dans havuzu ve dışlanan kliplerin gerekçeleri.

Entegrasyon için kod değişikliği gerekmiyor — `registry.ts` içindeki `nasreddin-hoca` girdisinin doldurulması yeterli.

## 5. Üretim sırası uyarısı

Keloğlan entegrasyonu incelenmeden Nasreddin Hoca üretimine geçilmemesi, teslim paketinin kendi notu. Bu şartname hazır dursun; onay çıkınca Meshy'ye verilir.
