# Keloğlan Hero Entegrasyonu — M0-K1 Raporu

**Tarih:** 27 Temmuz 2026
**Görev:** Keloğlan'ın production hero karakter olarak entegrasyonu
**Faz 02 başlatılmadı. Kanonik içeriğe dokunulmadı. Nasreddin Hoca entegre edilmedi.**

---

## 1. Teslim edilen dosya

Pakette iki GLB vardı; **animasyonlu olan** seçildi.

| | Merged Animations *(seçilen)* | Character output |
|---|---|---|
| Boyut | 16.722.860 bayt (15,95 MB) | 15.842.308 bayt |
| Üçgen | 222.150 | 222.150 |
| Animasyon | **12 klip** | 1 (`Armature\|clip0\|baselayer`) |

Dosya adı **değiştirilmedi**, izlenebilirlik için Meshy'nin verdiği adla duruyor:

```
app/public/assets/heroes/
  Meshy_AI_Little_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb
SHA-256: 41f8f1fa2f0bac36085d2dc903fd34ab46577aa338e436a727359d1a9fa13f68
```

## 2. Ölçülen teknik değerler

GLB ikili olarak ayrıştırılıp doğrudan okundu, tahmin yok.

| Ölçüt | Değer |
|---|---|
| Üçgen | **222.150** — karar belgesindeki ~222.150 ile birebir |
| Vertex | 118.681 |
| Mesh | 1, tek materyal, 1 image / 2 texture |
| İskelet | 24 eklem, biped, kök `Hips` |
| Node | 26, sahne kökü `Armature` (ölçek 0.01) |
| Bind pose sınır kutusu | 0,907 × **1,700** × 0,402 m |
| Pivot | y = 0'da, taban merkezinde ✔ |
| Skinning | tek skin, 24 eklem ✔ |

**Model küçültülmedi.** Kodda decimation, LOD üretimi veya otomatik mesh değiştirme yolu yok.

### Ölçek kararı

Model 1,70 m ölçüldü; varlık manifesti Keloğlan'ı **1,45 m** olarak brief'liyor — masallarda çocuk olduğu için. Motor `measuredHeightMeters` değerini kullanarak tam olarak 1,45 m'ye ölçekliyor. Bu bilinçli bir düzeltme; registry'de yazılı, tahmine dayanmıyor. 32 metrelik Galata Kulesi'nin yanında yetişkin boyunda bir Keloğlan yanlış okunurdu.

## 3. Klip envanteri — dosyada bulunan 12 klibin tamamı

| # | Klip | Süre | Ölçülen kök kayması | Durum |
|---|---|---|---|---|
| 1 | `Breakdance_1990` | 0,50 s | — | **dışlandı** — yarım duruyor |
| 2 | `FunnyDancing_01` | 7,77 s | **+0,207 m yanal** | onaylı, yatayda sabitleniyor |
| 3 | `FunnyDancing_03` | 8,03 s | ihmal edilebilir | onaylı |
| 4 | `Hip_Hop_Dance` | 4,10 s | ihmal edilebilir | onaylı |
| 5 | `Idle_11` | 1,90 s | ihmal edilebilir | **idle** |
| 6 | `Joyful_Dance_with_Hand_Sway` | 6,57 s | ihmal edilebilir | onaylı |
| 7 | `Love_You_Pop_Dance` | 10,00 s | ihmal edilebilir | **dışlandı** — sanat yönü |
| 8 | `Running` | 0,63 s | **0,000** | **run** |
| 9 | `Step_Hip_Hop_Dance` | 2,60 s | **+0,834 m ileri** | **dışlandı** — ölçümle doğrulandı |
| 10 | `Talk_Passionately` | 10,27 s | ihmal edilebilir | **talk** |
| 11 | `Walking` | 1,03 s | **0,000** | **walk** |
| 12 | `ymca_dance` | 4,50 s | ihmal edilebilir | **dışlandı** — sanat yönü |

İki dışlama gerekçesi ölçümle doğrulandı: `Step_Hip_Hop_Dance` gerçekten 83 cm ileri kayıyor, `Breakdance_1990` gerçekten yarım saniye.

`Walking` ve `Running` kliplerinin kök kayması **tam sıfır** — yerinde animasyonlar. Motor karakteri kendisi taşıdığı için bu tam istenen davranış, zeminde kayma olmaz.

## 4. Kök hareketi güvenliği

`FunnyDancing_01`'in 21 cm yanal kayması gerçek bir sorundu: kutlama sırasında Keloğlan kendi işaretinden kayardı. Çözüm:

- Dans sırasında yatay kök çevirisi her karede iptal ediliyor (dikey serbest, zıplama korunuyor).
- Klip bittiğinde konum ve dönüş bire bir eski değerine döndürülüyor.
- Danslar `LoopOnce` + `clampWhenFinished`, hareket klipleri `LoopRepeat`.
- Dolayısıyla hiçbir dans karakteri duvardan, hotspot'tan veya rota sınırından dışarı taşıyamıyor.

## 5. Kutlama koreografisi

```
CITY_COMPLETED → saving → framing → dancing → summary
                    ↑                             │
                    └────── ANOTHER_DANCE ────────┘
```

- **İlerleme önce kaydediliyor.** Son doğru cevapta `answerQuiz` iki depo yazımını da `await` ediyor, ancak ondan sonra kutlama başlıyor. Yarıda kapatılan bir sekme il yıldızını kaybettirmez. Test bunu doğruluyor: `saving` durumundan `CAMERA_FRAMED` ile çıkmak mümkün değil.
- **Girdi kilitleniyor** — dört durumun hepsinde `inputLocked: true`.
- **Kamera** orta plana geçiyor: yataydan ~5,5 m, 2,2 m yükseklikte, göğüs hizasına bakıyor.
- Dans bitince tamamlanma paneli açılıyor; **"Başka bir kutlama dansı"** düğmesi torbadan sıradaki farklı klibi oynatıyor.
- **Reduced motion**: dans tamamen atlanıyor, özet doğrudan açılıyor, replay düğmesi görünmüyor. Ödül yine veriliyor.
- Zaten tamamlanmış bir ile tekrar girildiğinde dans oynamıyor, doğrudan özet geliyor.

### Tekrarsız torba

- Havuz dört onaylı klip; dışlananlar seçilemiyor — 100 çekimlik test bunu doğruluyor.
- Torba `localStorage`'a yazılıyor, sayfa yenilense de aynı dans arka arkaya gelmiyor.
- Torba dolduğunda karıştırılıyor ve yeni torbanın ilk klibi öncekinin sonuncusundan farklı oluyor.
- Seçim deterministik tohumla test edilebilir; 200 çekimde arka arkaya tekrar yok.

## 6. Yükleme davranışı

| Kural | Durum |
|---|---|
| `/map` GLB indirmiyor | ✔ haritada `HeroCharacter` yok, test kaynak taramasıyla doğruluyor |
| Yalnız seçili rehber yükleniyor | ✔ |
| Şehir kabuğu ve kanonik içerik hazır olmadan istenmiyor | ✔ `heroReady` koşulu |
| Yüklenirken gerçek durum gösteriliyor | ✔ "Keloğlan hazırlanıyor…" |
| Yüklenirken placeholder duruyor, boş ekran yok | ✔ Suspense fallback placeholder |
| Hata durumunda placeholder, şehir oynanabilir | ✔ hata sınırı + `heroRenderMode` |
| Şehirler arası önbellek | ✔ `onCityUnmount()` bilinçli no-op |
| Çift skinned mesh bellekte tutulmuyor | ✔ tek klon, unmount'ta `stopAllAction` |

Sunucu doğrulaması: GLB uç noktası **16.722.860 bayt** ile 200 dönüyor.

## 7. Şimdi Keloğlan'ı nerede görebilirsin

İstanbul'un kanonik rehberi **Nasreddin Hoca** ve o model henüz yok. Kanonik sırayı değiştirmedim. Bunun yerine QA amaçlı bir sorgu parametresi ekledim:

```
/city/istanbul?guide=keloglan
```

Bu yalnız sahnedeki hero modelini değiştirir; kanonik içeriğe, rehber atamasına veya ilerlemeye dokunmaz. Bilinmeyen bir değer verilirse yok sayılır. Parametresiz açıldığında İstanbul yine Nasreddin Hoca'yı ister ve placeholder silindir görünür — bu doğru davranış.

Yerelde:

```bash
cd app && npm run dev
# http://localhost:3000/city/istanbul?guide=keloglan
```

Sekmenin **önde** olması gerekiyor; arka plan sekmesinde tarayıcı render döngüsünü durduruyor.

## 8. Kalite kapısı

```
npm run content:check → 81 il, 249 durak, 84 soru; 1413 dizgi eşleşti; 88 dosya senkron
npm run lint          → temiz
npm run typecheck     → temiz
npm test              → 9 dosya / 109 test geçti (40'ı hero)
npm run build         → 4 rota derlendi
```

Sunucu: `/map` 200, `/city/istanbul` 200, `/city/istanbul?guide=keloglan` 200, GLB 200.

## 9. Veremediklerim

**Tarayıcı QA yok.** Playwright tarayıcı ikilisi bu ortamın ağ izin listesinde olmadığı için indirilemiyor; canlı siteye Chrome ile baktığımda da otomasyon sekmesi arka planda olduğu için `requestAnimationFrame` 1,5 saniyede **0 kare** verdi. Bu koşulda ne ekran görüntüsü ne FPS anlamlı olur. Yani şu maddeleri **sen doğrulamalısın**:

- Modelin yönü ve duruşu ekranda doğru mu
- Idle / walk / run / talk gerçekten oynuyor mu
- Dans karakteri yerinden oynatıyor mu
- "Başka bir kutlama dansı" farklı klip veriyor mu
- Masaüstü ve mobil FPS

Telemetri katmanı bunları okuyabilmen için hazır: aktif hero, klip adı, üçgen, draw call, doku, DPR, profil, gölge durumu ve yürürlükteki çevre tavizleri.

**Bir de dürüst bir sınır:** klip adlarını dosyadan okudum ve motorun aradığı adlarla eşleştiğini testle doğruladım, ama kliplerin *içeriğinin* adına uyduğunu göremedim. `Walking` klibinin gerçekten yürüme animasyonu olduğunu ancak sen bakınca bileceğiz.

## 10. Entegrasyondan sonra bulunan hata — son durak ulaşılamıyordu

Test sırasında bildirdiğin "5. durağa geçmiyor" doğruydu ve nedeni sahne yerleşimindeydi.

**Neydi:** Rehberli yürüyüşün ara noktaları her durağın **6 metre** önüne konuyordu, tetik yarıçapı ise 4,5 metre. Ara duraklar yine de tetikleniyordu, çünkü yürüyüş bir sonraki noktaya giderken onların yanından geçiyor ve o sırada menzile giriyordu. Son durağın "sonraki noktası" olmadığı için yürüyüş orada, 6 metre uzakta bitiyordu — halka görünüyor ama menzile hiç girilmiyordu.

Ölçülen mesafeler (düzeltme öncesi):

| Şehir | Durak | Rotaya en yakın mesafe | Yarıçap | Sonuç |
|---|---|---|---|---|
| İstanbul | 1–4 | 0,55 – 2,40 m | 4,5 | tetikleniyor |
| İstanbul | **5** | **6,00 m** | 4,5 | **ulaşılmıyor** |
| Nevşehir | **5** | **6,00 m** | 4,5 | **ulaşılmıyor** |
| Gaziantep | **3** | **6,00 m** | 4,5 | **ulaşılmıyor** |

Yani hata İstanbul'a özel değildi; **her şehrin son durağı** rehberli modda ulaşılamazdı. Elle keşifte oyuncu oraya yürüyebildiği için sorun görünmüyordu.

**Düzeltme:** yaklaşma mesafesi 6 metreden 3 metreye indirildi ve tetik yarıçapıyla aynı sabitten türetildi, böylece ikisi birbirinden bağımsız kayamaz. Düzeltme sonrası en uzak durak 3,00 m, yani menzilin rahatça içinde.

**Tekrarlamaması için iki bekçi eklendi:**

1. `npm run content:check` artık her durağın rota poligonuna olan en kısa mesafesini ölçüyor ve tetik yarıçapını aşarsa derlemeyi durduruyor. Eski yerleşimi geri koyarak denedim, doğrulayıcı beklendiği gibi hata verdi:
   `hotspot gaziantep-hotspot-03 is 6.00 m from the guided route but its trigger radius is 4.5 m`
2. İki test: her durağın rota menzilinde olduğunu doğrulayan invaryant testi, ve rehberli yürüyüşün son durağın tetiğine gerçekten girdiğini simüle eden test.

Bu, benim ilk turda kaçırdığım bir hataydı: rehberli mod testlerim "duraklarda duruyor mu" ve "tamamlanınca devam ediyor mu" sorularını soruyordu, ama "her durağa ulaşılabiliyor mu" sorusunu hiç sormuyordu. Şimdi soruyor.

## 11. Sıradaki tek ve kesin görev

Keloğlan'ı tarayıcıda doğrula. Sorun yoksa Nasreddin Hoca üretimi başlar — şartname `docs/MESHY_BRIEF_NASREDDIN_HOCA.md` içinde, teslim edilen Keloğlan ölçülerek yazıldı.
