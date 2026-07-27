# Nasreddin Hoca Entegrasyonu — Raporu

**Tarih:** 27 Temmuz 2026
**Karar:** Nasreddin Hoca dans etmez. Bilge, sıcak, ölçülü bir rehberdir.
**Faz 02 başlatılmadı. Kanonik içeriğe dokunulmadı. Keloğlan'ın dans sistemi bozulmadı.**

---

## 1. Teslim edilen dosya

Pakette iki GLB vardı; animasyonlu olan seçildi.

| | Merged Animations *(seçilen)* | Character output |
|---|---|---|
| Boyut | 19.867.032 bayt (18,95 MB) | 14.009.560 bayt |
| Üçgen | 197.482 | 197.482 |
| Animasyon | **7 klip** | 1 |

Dosya adı değiştirilmedi:

```
app/public/assets/heroes/
  Meshy_AI_Teal_Robed_Sage_biped_Meshy_AI_Meshy_Merged_Animations.glb
SHA-256: bb359aa93d2405917c9fbc310cdb25ccad89a9f7af0b57401937d6c88fecee24
```

## 2. Ölçülen değerler

| Ölçüt | Nasreddin Hoca | Keloğlan | Şartname hedefi |
|---|---|---|---|
| Üçgen | **197.482** | 222.150 | 180.000–250.000 ✔ |
| Vertex | 121.649 | 118.681 | benzer ✔ |
| Mesh / materyal | 1 / 1 | 1 / 1 | 1 / 1 ✔ |
| Image / texture | 2 / 2 | 1 / 2 | 1 / 2 — bir doku fazla, sorun değil |
| Eklem | 24, biped, kök `Hips` | 24, aynı | aynı ✔ |
| Armature ölçeği | 0.01 | 0.01 | ✔ |
| Ölçülen boy | 1,70 m | 1,70 m | 1,75–1,85 m istenmişti |
| Manifest boyu | 1,65 m | 1,45 m | — |
| Dosya | 18,95 MB | 15,95 MB | 15–18 MB, biraz üstünde |

İki karakter aynı teknik sınıfta. Boy şartnamede 1,75–1,85 m istenmişti, gelen 1,70 m — yani Keloğlan ile aynı boyda. Motor manifest boyuna (1,65 m) ölçeklediği için sahnede Hoca, Keloğlan'dan (1,45 m) belirgin şekilde uzun duruyor; yetişkin/çocuk farkı korunuyor.

## 3. Klip envanteri — dosyadaki 7 klibin tamamı

| Klip | Süre | Hareketin %95'i | Kök kayması | Rol |
|---|---|---|---|---|
| `Idle_11` | 1,90 s | — | ihmal edilebilir | **bekleme** |
| `Walking` | 1,03 s | — | **0,000** | **yürüme** |
| `Running` | 0,63 s | — | **0,000** | **koşma** |
| `Talk_with_Hands_Open` | 3,97 s | 3,40 s | ihmal edilebilir | **konuşma** |
| `Agree_Gesture` | 13,00 s | 11,00 s | **+0,209 m ileri** | **onay** |
| `Wave_One_Hand` | 4,10 s | 3,30 s | ihmal edilebilir | **veda** |
| `Clapping_Run` | 13,67 s | 11,90 s | ihmal edilebilir | **dışlandı** |

Altı rolün altısı da dosyada mevcut, hiçbiri fallback'e düşmüyor.

`Walking` ve `Running` kök kayması tam sıfır — yerinde animasyonlar, hareket denetleyicisi tek kaynak olarak kalıyor, karakter iki kez hareket etmiyor.

### İki ölçüm notu

**Karar belgesindeki uyarı doğru çıktı.** `Agree_Gesture` ham klibinde **20,9 cm ileri kayma** var. Motor bunu her karede iptal ediyor ve klip bitince konumu bire bir geri koyuyor, dolayısıyla Hoca hotspot veya tamamlanma işaretinden uzaklaşmıyor.

**Bir gerekçe ise ölçümle doğrulanmadı.** `Clapping_Run` için "yüksek kök hareketi içeriyor" denmiş; ölçtüğümde kök kayması ihmal edilebilir çıktı (1 cm'in altında). Klip yine de dışlandı, ama gerekçe olarak yalnız karakter tonu geçerli. Kayıtta böyle yazdım.

## 4. 13 saniyelik onay hareketi — bir sapma bildiriyorum

`Agree_Gesture` 13 saniye sürüyor ve bu sürenin 11 saniyesi gerçek hareket, dolgu değil. Politikaya birebir uysaydım şehir tamamlanma sekansı şöyle olurdu:

```
Agree (13,0 s) → Wave (4,1 s) → panel     = 17,1 saniye
```

Yedi yaşındaki bir çocuğun il yıldızını görmek için 17 saniye beklemesi doğru gelmedi. Onay hareketini **4 saniyeye sınırladım**, sekans 8,1 saniyeye indi.

Bu bir tasarım kararı ve senin onayına açık. Kayıtta tek satır:

```ts
maxDurationSeconds: { Agree_Gesture: 4 }
```

Bu satırı silersen klip tam uzunlukta oynar, başka hiçbir şey değişmez. Doğru cevap sonrası oynayan onay hareketi de aynı sınıra tabi — orada akışı bloke etmiyor ama 13 saniye boyunca oynamaya devam etmesi tuhaf olurdu.

## 5. İki karakter, tek mimari

Bileşenlerde karakter başına koşul yok. Davranış rehberin kendi politikasından çözülüyor:

```ts
celebration:
  | { kind: 'dance-bag';        pool: [...]; allowReplay: true }   // Keloğlan
  | { kind: 'gesture-sequence'; sequence: ['agree','wave']; allowReplay: false }  // Hoca
successClip: 'agree' | null
```

| Davranış | Keloğlan | Nasreddin Hoca |
|---|---|---|
| Şehir tamamlama | tek dans, torbadan | agree → wave |
| "Başka bir kutlama dansı" düğmesi | görünür | **görünmez** |
| Dans havuzu | 4 onaylı klip | **yok** |
| Durak/doğru cevap sonrası | yok | `Agree_Gesture` bir kez |
| Kutlama sonrası | idle | idle |

Üçüncü bir rehber eklemek için yalnız kayda bir politika yazmak yeterli; tamamlanma arayüzü değişmiyor.

## 6. Kök hareketi kuralı

Politika `lockHorizontalTranslationForNonLocomotion` diyor; motor artık tam olarak bunu yapıyor. `walk` ve `run` dışındaki her klipte yatay kök çevirisi her karede iptal ediliyor, klip bitince konum ve dönüş bire bir geri konuyor. Bir test, yalnız bu iki klibin locomotion sayıldığını doğruluyor.

## 7. Kalite kapısı

```
npm run content:check → 81 il, 249 durak, 84 soru; 1413 dizgi eşleşti; 88 dosya senkron
npm run lint          → temiz
npm run typecheck     → temiz
npm test              → 9 dosya / 130 test geçti
npm run build         → 4 rota derlendi
```

Sunucu: `/map` 200, `/city/istanbul` 200, `?guide=keloglan` 200, Hoca GLB'si 19.867.032 bayt ile 200.

Yeni testler: iki kutlama stilinin ayrılığı, Hoca'ya dans havuzu verilmemesi, agree → wave → panel sırası, replay düğmesinin yalnız Keloğlan'da olması, `Clapping_Run`'ın hiçbir yolla seçilememesi, dört fallback zinciri, süre sınırı, ve Keloğlan'ın dans davranışının bozulmadığı.

## 8. Veremediklerim

**Görsel doğrulama yok.** Bu ortamda tarayıcı render döngüsü çalışmıyor. Klip adlarının dosyayla eşleştiğini ve süreleri/kök kaymalarını ölçtüm, ama `Agree_Gesture`'ın gerçekten bir onay jesti gibi göründüğünü ancak sen bakınca bileceğiz. QA listesindeki görsel maddeler sende.

**Depo boyutu.** İki hero ile birlikte depo ~37 MB. Git LFS'i kurmanın tam zamanı; sonraki çevre modelleri gelmeden yapmak çok daha kolay.

## 9. İstanbul'da hangi rehber görünür

İstanbul'un kanonik rehberi Nasreddin Hoca. Artık modeli olduğu için `/city/istanbul` doğrudan Hoca'yı yükler. Keloğlan'ı görmek için `?guide=keloglan` parametresi duruyor.
