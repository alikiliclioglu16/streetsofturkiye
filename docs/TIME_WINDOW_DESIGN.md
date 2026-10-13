# Zaman Penceresi — tasarım dosyası

**Tarih:** 12 Ekim 2026
**Kapsam:** 19 şehir, **63 durak**
**Yerini aldığı sistem:** halkaya girince açılan `FactCard` bilgi kartı

Bu dosya envanteri koddan çıkarır, her durağa bir Zaman Penceresi tasarlar ve
hepsini tek bir veri-güdümlü sistemle çalıştıracak mimariyi önerir.

---

## 0. Önce rakamlar

| | |
|---|---|
| Şehir | 19 |
| Durak | **63** |
| Sahnesi kurulu şehir | 13 (45 durak) |
| Henüz hiç yapılmamış şehir | 6 (18 durak: Diyarbakır, Bursa, Muğla, Çanakkale, Ankara, Adana) |
| 5 duraklı şehir | İstanbul, İzmir, Nevşehir |
| 3 duraklı şehir | diğer 16 |

Altı şehrin durakları kanonik metinde ve ödüllerinde **vardır**; 3B varlıkları
yoktur. Onların Zaman Pencereleri de tasarlandı, ama şehirler açılana kadar
çalıştırılamaz — her birinin satırında `[şehir henüz yok]` yazar.

---

## 1. Tasarımın dayandığı şey: motor bunları zaten yapıyor

Hiçbir tasarım sıfırdan bir sistem istemiyor. Sahnelerde bugün çalışan şeyler:

| Mevcut sistem | Ne yapıyor | Hangi şehirlerde |
|---|---|---|
| `birdPaths` + `Birds` | kuş sürüsü, çember yörünge, yükseklik salınımı | İstanbul, Trabzon, Balıkesir, Mardin, İzmir, Antalya |
| `balloons` + `BalloonBurner` | yükselen balon, brülör alevi | Nevşehir |
| `tramLine` / `trainLine` / `ferryLine` / `cableCarLine` / `shuttleLines` / `canoeLines` | bir modelin A→B hat boyunca hareketi | İstanbul, Kars, Ordu, Van, Erzurum, Mardin, Trabzon, İzmir |
| `catRoutes` + `StreetCat` | hayvanın rota üzerinde yürümesi | her şehir (bölgeye göre kedi/at/kaz/karaca) |
| `Snowfall` | düşen parçacık | Erzurum |
| `mistBands` + `Mist` | yatay sis bandı, opaklık salınımı | Trabzon, Balıkesir |
| `WindProp` / `WindSlope` | rüzgârda salınan obje | Balıkesir, Trabzon |
| `Water` | su düzlemi, durgun veya salınımlı | İstanbul, Van, Trabzon, Balıkesir, İzmir, Antalya |
| `Statue` | çizilmiş kaide + model | Mardin, Erzurum |
| `fillLight` | ikinci, gölgesiz yönlü ışık | Bolu, Erzurum |
| `paragliders` | havada süzülen figür | Ordu |
| Web Audio cue'ları | `playTrainPass`, `playFerryHorn`, `playMeow`, `playCollect`… | hepsi |

**Sesler dosya değil.** `src/engine/audio/cues.ts` her efekti osilatörle
sentezliyor. Zaman Penceresi'nin ihtiyaç duyduğu rüzgâr, çekiç, su, alkış, çan
sesleri de aynı yerde yazılabilir — **yeni ses dosyası gerekmiyor**, ve bu, 63
durağın ses ihtiyacını sıfır indirmeye düşürür.

---

## 2. Ortak efekt kütüphanesi

63 durağın tamamı aşağıdaki **on iki ilkelin** birleşimidir. Her durak 2–4
tanesini kullanır. Yeni durak eklemek yeni kod değil, yeni satır demektir.

| # | İlkel | Ne yapar | Nereden türüyor |
|---|---|---|---|
| E1 | `focus` | kamera hedefe yumuşak pan + hafif zoom, sonra geri | yeni, ~40 satır tween |
| E2 | `dim` | çevre kararır, hedef aydınlık kalır | `fillLight` + ambient çarpanı |
| E3 | `ghost` | yarı saydam silüet belirir, hareket eder, söner | `AssetInstance` + opacity tween |
| E4 | `flight` | bir obje eğri boyunca uçar | `Birds` yörünge matematiği |
| E5 | `rise` | obje yukarı süzülür | `Balloons` |
| E6 | `scatter` | duran sürü havalanıp dağılır | `Birds` + mevcut kuş/güvercin modelleri |
| E7 | `spin` | obje kendi ekseninde döner | `rotationY` tween |
| E8 | `fall` | parçacık yağar (kar, yaprak, konfeti, çiçek) | `Snowfall`, renk ve hız parametreli |
| E9 | `steam` | duman/buhar/sprey bandı | `Mist`, dikey ve kısa ömürlü |
| E10 | `glow` | emissive nabız, ışık parlaması | malzeme `emissiveIntensity` tween |
| E11 | `travel` | mevcut hat objesini tetikle (tren, vapur, teleferik) | `tramLine` ailesi |
| E12 | `caption` | ekranda tek cümle, 3 sn | yeni, küçük bir overlay |

**Kural 9'un karşılığı:** aynı ilkel farklı şehirlerde farklı hissettirir çünkü
hedefi, rengi, sesi ve süresi farklıdır. E8 Erzurum'da kar, Bolu'da yaprak,
Adana'da konfeti, Antalya'da portakal çiçeğidir.

---

## 3. Şehir şehir envanter ve tasarım

Her durakta: **mevcut** veriler koddan alınmıştır (başlık, açıklama özeti,
ödül, kategori, varlık kimliği). **Zaman Penceresi** yeni tasarımdır.

Ekran cümleleri Türkçe yazılmıştır; sisteme `{en, tr}` çifti olarak girecek ve
İngilizcesi uygulama sırasında yazılacaktır.

---

### KARS · 3 durak · Doğu Anadolu · Keloğlan

#### 1. The Ghost City of Ani
`city_kars_ani_carved_doorway` · history · 🏚️ an Ani stone rubbing

**Öğrenme fikri:** Burası bir harabe değil, bir zamanlar kalabalık bir başkenttı.

**Zaman Penceresi:** Kamera oyuncudan ayrılıp oyulmuş kapıdan geçerek arkadaki
Ani kiliselerine döner. Ses kesilir — sadece rüzgâr kalır. Kiliselerin
çevresinde yarı saydam, duran insan silüetleri birkaç saniyeliğine belirir;
bir pazar yeri kalabalığı gibi dizilmişlerdir. Sonra sönerler ve rüzgâr geri
gelir.

**Kamera:** E1 — kapıdan Ani duvarlarına yavaş pan, hafif yükselerek.
**Görsel olay:** E3 — 6–8 adet yarı saydam silüet belirip söner.
**Ses:** rüzgâr (sentez, beyaz gürültü + alçak geçiren filtre), silüetler
belirirken çok kısık bir kalabalık uğultusu.
**Ekran cümlesi:** "Bir zamanlar burada bin bir kilise ve on binlerce insan vardı. Şimdi sadece rüzgâr var."
**Collectible:** 🏚️ an Ani stone rubbing — değişmiyor.
**Teknik çözüm:** Mevcut NPC modellerinden biri (`npc_featured_traveler`),
`transparent: true` + `opacity` tween, 8 kopya instanced.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. The Eastern Express
`city_kars_eastern_express_platform` · history · 🚂 an Eastern Express ticket

**Öğrenme fikri:** Bu tren Ankara'dan buraya kadar, karlar içinden bir gün boyu gider.

**Zaman Penceresi:** Kamera perondan raylara döner. Uzaktan far ışığı belirir,
büyür; lokomotif kadrajı soldan sağa geçer, camlarından sarı ışık ve siluetler
görünür. Geçerken kar savrulur. Tren uzaklaşırken düdük duyulur.

**Kamera:** E1 — perondan raya, sabit; tren kadrajdan geçer.
**Görsel olay:** E11 mevcut `trainLine` tetiklenir + E8 kar savrulması + E10
far parlaması.
**Ses:** `playTrainPass` **zaten var**, üstüne düdük.
**Ekran cümlesi:** "Doğu Ekspresi Ankara'dan Kars'a bir gün bir gece yol gider — hep karın içinden."
**Collectible:** 🚂 — değişmiyor.
**Teknik çözüm:** Hat ve ses hazır; tek yeni şey kamerayı tetikleme ve kar
parçacığı. **Bu durak neredeyse bedava.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Giant Gruyère Wheels
`city_kars_gravyer_stall` · food · 🧀 a wedge of gravyer

**Öğrenme fikri:** Bu peynir tekerleği bir çocuktan ağır.

**Zaman Penceresi:** Kamera tezgâha yaklaşır. Peynir tekerleği yavaşça yerinden
kalkar, havada bir tam tur döner ve iner — ağırlığını göstermek için yavaş ve
hafif sarsıntılı. Dönerken yanında Keloğlan boyunda yarı saydam bir ölçek
silüeti belirir: tekerlek ondan geniştir.

**Kamera:** E1 — tezgâha yakın plan, hafif alttan.
**Görsel olay:** E7 yavaş dönüş + E5 kısa yükselme + E3 boy karşılaştırma silüeti.
**Ses:** ahşap gıcırtısı, inerken tok bir "tonk".
**Ekran cümlesi:** "Bir gravyer tekerleği 60 kiloya kadar çıkar — senden ağır."
**Collectible:** 🧀 — değişmiyor.
**Teknik çözüm:** Tezgâh modelinin tamamı döner (alt obje ayırmaya gerek yok,
ölçek karşılaştırması için silüet yeter).
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### ERZURUM · 3 durak · Doğu Anadolu · Keloğlan

#### 1. The Twin Minaret Madrasa
`city_erzurum_lace_portal` · history · 🦅 a double-headed eagle

**Öğrenme fikri:** Taşın içine dantel gibi oyulmuş desenin arasında bir çift
başlı kartal saklı.

**Zaman Penceresi:** Kamera taç kapıya yaklaşır. Çevre kararır (E2), kapı
aydınlık kalır. Oymanın içindeki çift başlı kartal altın renginde yanmaya
başlar — önce soluk, sonra net; etrafındaki desen aynı kalır, sadece kartal
parlar. Üç saniye durur, söner, ışık normale döner.

**Kamera:** E1 — kapıya yavaş zoom, ortalanır.
**Görsel olay:** E2 + E10 — kartal konturu emissive olarak parlar.
**Ses:** tek, uzun bir taş/çan tınısı.
**Ekran cümlesi:** "750 yıllık taşın içine gizlenmiş: çift başlı kartal."
**Collectible:** 🦅 — değişmiyor.
**Teknik çözüm:** Kartal şeklinde küçük bir emissive düzlem (sprite),
kapının önüne hizalanır. **Sprite yeri modelden ölçülmeli.**
**Yeni asset:** Evet — tek bir PNG: çift başlı kartal silüeti (sprite, ~20 KB).
**Zorluk:** Orta.

#### 2. Palandöken
`city_erzurum_ski_gear` · nature · ⛷️ a Palandöken snowball

**Öğrenme fikri:** Burada kar Kasım'dan Mayıs'a yağar — yılın yarısı.

**Zaman Penceresi:** Kamera dağa döner. Kar yoğunlaşır (mevcut `Snowfall`
şiddeti kısa süre artar). Mevcut kayakçı figürlerinden biri zirveden aşağı
zikzak çizerek iner ve kadrajdan çıkar. Arkasında kar izi kalır.

**Kamera:** E1 — Palandöken zirvesine pan, kayakçıyı takip ederek aşağı iner.
**Görsel olay:** E11 mevcut `shuttleLines` kayakçısı + E8 kar yoğunlaşması.
**Ses:** kar üstünde kayma hışırtısı, rüzgâr.
**Ekran cümlesi:** "Palandöken'de kar Kasım'da başlar, Mayıs'ta biter. Yılın yarısı kış."
**Collectible:** ⛷️ — değişmiyor.
**Teknik çözüm:** Kayakçı ve kar sistemi hazır; sadece kamera takibi ve
yoğunluk parametresi.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Oltu Stone
`city_erzurum_oltu_workbench` · craft · 📿 black Oltu beads

**Öğrenme fikri:** Oltu taşı sürtülünce kâğıdı kendine çeker — mıknatıs gibi.

**Zaman Penceresi:** Kamera tezgâha iner. Tezgâhın üstündeki bir tespih tanesi
hafifçe kalkar, iki kez ileri geri sürtülür (görünmez bir bez gibi), sonra
etrafındaki küçük kâğıt parçaları ona doğru sürüklenip yapışır. Taş hafif
parlar.

**Kamera:** E1 — tezgâha yakın, üstten hafif eğik.
**Görsel olay:** E7 sürtünme hareketi + küçük kâğıt parçacıklarının çekilmesi
(E8'in tersi: parçacıklar bir noktaya doğru) + E10 hafif parlama.
**Ses:** sürtünme hışırtısı, sonra çok kısa bir "çıt".
**Ekran cümlesi:** "Oltu taşını sürtersen kâğıt kırpıntılarını kendine çeker."
**Collectible:** 📿 — değişmiyor.
**Teknik çözüm:** Parçacık sistemi tersine çekim modunda; 10–15 küçük beyaz
düzlem. **Bu, fizik değil, hedefe doğru lerp.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

---

### VAN · 3 durak · Doğu Anadolu · Nasreddin Hoca

#### 1. The Swimming Van Cat
`city_van_odd_eyed_cat` · nature · 🐱 a Van cat plush

**Öğrenme fikri:** Van kedisi suya girer — kediler suyu sevmez, bu sever.

**Zaman Penceresi:** Kamera kediye yaklaşır; gözlerine yakın plan — biri mavi,
biri kehribar, kısa bir an için her iki göz de parlar. Sonra kedi dönüp göle
doğru koşar ve suya girer; su halkaları yayılır, kedi birkaç saniye yüzer.

**Kamera:** E1 — göz hizasına inip sonra geri çekilerek kediyi takip.
**Görsel olay:** E10 göz parlaması + E11 kedi rotası suya uzatılır + su halkası.
**Ses:** `playMeow` **zaten var** + su şıpırtısı.
**Ekran cümlesi:** "Dünyada suya kendi isteğiyle giren tek kedi cinsi."
**Collectible:** 🐱 — değişmiyor.
**Teknik çözüm:** Mevcut `catRoutes` rotası suya uzatılır; su halkası genişleyen
bir halka düzlemi.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Akdamar Island
`city_van_akdamar_jetty` · nature · ⛵ an Akdamar boat ticket

**Öğrenme fikri:** Adadaki kilisenin duvarları taştan bir resimli kitap.

**Zaman Penceresi:** Kamera iskeleden adaya döner ve yaklaşır. Kilisenin
duvarındaki kabartmalardan üç tanesi sırayla altın renginde parlar —
bir aslan, bir üzüm salkımı, bir balık — her biri bir saniye. Sonra hepsi
söner, kamera geri çekilir.

**Kamera:** E1 — iskeleden ada boyunca yavaş zoom.
**Görsel olay:** E10 — üç kabartma sırayla emissive parlar.
**Ses:** uzak bir su sesi, her parlamada tek bir arp notası.
**Ekran cümlesi:** "1.100 yıllık duvarlarda aslanlar, üzümler, balıklar — taştan bir resimli kitap."
**Collectible:** ⛵ — değişmiyor.
**Teknik çözüm:** Üç küçük emissive düzlem ada modelinin yüzeyine hizalanır.
Kabartmaların yeri modelden ölçülmeli.
**Yeni asset:** Hayır (parlama düzlemleri, doku gerekmez).
**Zorluk:** Orta.

#### 3. The World-Famous Van Breakfast
`city_van_breakfast_table` · food · 🍳 a breakfast plate

**Öğrenme fikri:** O kadar çok tabak var ki masaya sığmıyor.

**Zaman Penceresi:** Kamera masaya yukarıdan bakar. Tabaklar birer birer, hızlı
bir ritimle masaya "iner" (her biri küçük bir zıplamayla) — sekiz, on, on beş…
Masa dolar ve son tabaklar kenara, masanın dışına taşmak zorunda kalır.

**Kamera:** E1 — masaya tepeden bakış, sabit.
**Görsel olay:** E5 tersine — tabaklar yukarıdan iner, scale + position tween,
kademeli gecikmeyle.
**Ses:** her inişte kısa bir porselen "tink", ritmik.
**Ekran cümlesi:** "Van kahvaltısında tabaklar masaya sığmaz — yanına ek masa kurarlar."
**Collectible:** 🍳 — değişmiyor.
**Teknik çözüm:** Masanın üstündeki tabaklar **tek model içinde** olduğundan,
modelin tamamı aşağıdan yukarı "açılır" gibi ölçeklenir ve yanına birkaç basit
daire düzlemi tabak olarak eklenir.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### TRABZON · 3 durak · Karadeniz · Nasreddin Hoca

#### 1. Sümela Monastery
`city_trabzon_sumela_fresco_door` · history · 🧗 a cliff-monastery photo

**Öğrenme fikri:** Bu manastır ormanın 300 metre üstünde, kayanın içine yapılmış.

**Zaman Penceresi:** Kamera fresk kapısından yukarı, uçuruma doğru kayar ve
manastırı gösterir — yükselirken sis bantları arasından geçer. En tepede bir
an durur, aşağıdaki orman çok küçük görünür. Sonra geri iner.

**Kamera:** E1 — dikey, aşağıdan yukarı uzun bir pan. **Projedeki tek dikey
kamera hareketi**, çünkü bu durağın tek bilgisi yükseklik.
**Görsel olay:** E9 mevcut `mistBands` kamera yükselirken yoğunlaşır.
**Ses:** rüzgâr, uzaktan tek bir çan.
**Ekran cümlesi:** "Ormanın 300 metre üstünde, kayanın içine oyulmuş. 1.600 yıl önce."
**Collectible:** 🧗 — değişmiyor.
**Teknik çözüm:** Sadece kamera + mevcut sis. **Yeni hiçbir şey yok.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Horon & the Kemençe
`city_trabzon_kemence_stand` · craft · 💃 a horon dance ribbon

**Öğrenme fikri:** Horon hızlanır, hızlanır, hızlanır.

**Zaman Penceresi:** Kamera kemençe tezgâhına döner. Yakındaki NPC'ler el ele
tutuşup bir halka oluşturur ve dönmeye başlar — önce yavaş, sonra giderek
hızlanır. Müzik de aynı oranda hızlanır. Zirvede bir an donar, sonra çözülür.

**Kamera:** E1 — halkanın etrafında yavaş yörünge (tek dairesel kamera).
**Görsel olay:** E7 — NPC'ler bir merkez etrafında artan hızla döner.
**Ses:** kemençe temposu hızlanır (sentez: tek nota dizisi, artan BPM).
**Ekran cümlesi:** "Horon başlar, hızlanır, daha da hızlanır — durmak yok."
**Collectible:** 💃 — değişmiyor.
**Teknik çözüm:** Mevcut üç NPC bir daire üzerinde konumlandırılıp `rotationY`
ile döndürülür. Kol kola tutuşma: aralarına ince bir şerit düzlemi.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 3. Hamsi & Stretchy Kuymak
`city_trabzon_hamsi_stall` · food · 🐟 a lucky hamsi

**Öğrenme fikri:** Kuymak kaşıkla kaldırınca kolun kadar uzar.

**Zaman Penceresi:** Kamera tezgâha iner. Tezgâhın üstünde bir kaşık yavaşça
yukarı kalkar ve arkasından uzayan, incelen sarı bir peynir teli gelir — kol
boyu kadar. Tam kopacakken durur. Yanda birkaç hamsi tavada zıplar.

**Kamera:** E1 — tezgâha yakın, yandan.
**Görsel olay:** Uzayan silindir (scale.y tween) + E5 hamsilerin kısa zıplaması.
**Ses:** cızırtı, tek bir "hop".
**Ekran cümlesi:** "Kaşığı kaldır — kuymak kolun kadar uzar."
**Collectible:** 🐟 — değişmiyor.
**Teknik çözüm:** Peynir teli = ince, hafif eğik bir silindir, scale.y
animasyonu. Kaşık = küçük bir düzlem.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### ORDU · 3 durak · Karadeniz · Keloğlan

#### 1. Hazelnut Champion of the World
`city_ordu_hazelnut_stall` · food · 🍫 a hazelnut-chocolate jar

**Öğrenme fikri:** Dünyadaki fındığın çoğu bu tepelerden çıkıyor.

**Zaman Penceresi:** Kamera tezgâhtan yukarı kalkıp arkadaki fındık bahçesini
gösterir. Bahçenin üstünde bir dünya haritası silüeti belirmez — bunun yerine
tezgâhın önüne fındıklar yağmaya başlar, bir tepe oluşturacak kadar; tepe
büyür, sonra üstünde bir çikolata kavanozu belirir.

**Kamera:** E1 — tezgâhtan bahçeye geniş açı, sonra tezgâha geri.
**Görsel olay:** E8 — fındık parçacıkları yağar ve birikir.
**Ses:** çok sayıda küçük sert tanenin dökülme sesi.
**Ekran cümlesi:** "Kahvaltıdaki çikolatanın fındığı büyük ihtimalle bu tepelerden geldi."
**Collectible:** 🍫 — değişmiyor.
**Teknik çözüm:** Parçacık = küçük kahverengi küreler, basit yerçekimi,
zeminde durur. Kavanoz zaten ödül ikonografisinde var; küçük bir silindir yeter.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Cable Car to Boztepe
`city_ordu_cable_car` · nature · 🚠 a cable car ticket

**Öğrenme fikri:** Teleferik seni denizin üstünden tepeye çıkarır.

**Zaman Penceresi:** Kamera teleferik kabinine binmiş gibi onunla birlikte
yükselir — deniz aşağıda kalır, şehir küçülür. Tepe noktasında durur, kamera
bir an manzaraya bakar, sonra geri iner.

**Kamera:** E1 + E11 — kamera `cableCarLine` üzerindeki kabine kilitlenir.
**Projedeki tek "araca binen" kamera.**
**Görsel olay:** Mevcut teleferik hattı tetiklenir.
**Ses:** kablo uğultusu, rüzgâr, martı.
**Ekran cümlesi:** "Ayaklarının altında Karadeniz, yukarıda Boztepe."
**Collectible:** 🚠 — değişmiyor.
**Teknik çözüm:** Kamera hedefi mevcut kabin objesine bağlanır. **Hat zaten var.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Blue-Flag Beaches
`city_ordu_beach_front` · nature · 🌅 an orange sunset photo

**Öğrenme fikri:** Karadeniz'in de kumsalı var, ve gün batımı denizi turuncu yapar.

**Zaman Penceresi:** Kamera sahile döner. Gökyüzü ve ışık renk değiştirmeye
başlar — mavi, turuncu, kızıl — denizin rengi de döner. Mavi bayrak direkte
dalgalanır. Yaklaşık altı saniyede tam gün batımı, sonra yavaşça normale döner.

**Kamera:** E1 — ufka doğru, hafif alçalarak.
**Görsel olay:** E10 geniş ölçekte — gökyüzü ve su renk tweenlemesi + bayrak
dalgalanması (mevcut `WindProp`).
**Ses:** dalga, uzak martı.
**Ekran cümlesi:** "Akşam olunca Karadeniz turuncuya döner."
**Collectible:** 🌅 — değişmiyor.
**Teknik çözüm:** `sky.top`, `sky.horizon`, `water.color` ve ışık renginin
tweenlenmesi. **Bu, projede renk değiştiren tek Zaman Penceresi** — tekrar
etmemeli.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### BOLU · 3 durak · Karadeniz · Keloğlan

#### 1. Yedigöller — the Seven Lakes
`city_bolu_yedigoller_jetty` · nature · 🍁 a golden autumn leaf

**Öğrenme fikri:** Yedi göl birbirine bağlı, ve sonbaharda ayna gibi olurlar.

**Zaman Penceresi:** Kamera iskeleden suya iner, su yüzeyine çok yakın bir
açıya geçer. Üstteki ağaçlar suda yansır. Birkaç yaprak düşer ve suya değince
halka halka yayılır — yansıma bozulur, sonra düzelir.

**Kamera:** E1 — suya çok yakın, neredeyse su hizasında.
**Görsel olay:** E8 mevcut `kit_bolu_leaf_fall` + su halkaları.
**Ses:** tek bir damla, orman sessizliği.
**Ekran cümlesi:** "Sonbaharda yedi göl birer aynaya dönüşür."
**Collectible:** 🍁 — değişmiyor.
**Teknik çözüm:** Yaprak varlığı var. Halka = genişleyen torus düzlemi.
Yansıma gerçek değil — su malzemesinin `metalness` değeri kısa süre artırılır.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Mengen — Town of Master Chefs
`city_bolu_mengen_kitchen` · food · 👨‍🍳 a tiny chef's hat

**Öğrenme fikri:** Bu küçük kasaba Türkiye'nin aşçılarını yetiştirir.

**Zaman Penceresi:** Kamera mutfağa yaklaşır. Ocaktan buhar yükselir, tencere
kapağı birkaç kez tıngırdar. Sonra mutfağın üstünde sırayla üç aşçı külahı
belirip yukarı süzülür — biri, sonra üçü, sonra bir sürü; küçük bir külah
bulutu oluşur ve dağılır.

**Kamera:** E1 — mutfağa yakın plan, sonra yukarı.
**Görsel olay:** E9 buhar + E5 külahların yükselişi.
**Ses:** fokurdama, kapak tıngırtısı.
**Ekran cümlesi:** "Küçücük Mengen, Türkiye'nin en ünlü aşçılarını yetiştirdi."
**Collectible:** 👨‍🍳 — değişmiyor.
**Teknik çözüm:** Külah = basit beyaz silindir+küre, 12 kopya, yukarı tween.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Kartalkaya Ski Resort
`city_bolu_ski_lift_station` · nature · 🏂 a snowboard sticker

**Öğrenme fikri:** Adı "Kartal Kayası" ve kışın her yeri kar.

**Zaman Penceresi:** Kamera lift istasyonundan yukarı, dağa döner. Yeşil/turuncu
sonbahar ormanı birkaç saniyede beyaza döner — kar yağmaya başlar ve zemin
beyazlaşır. Üstte bir kartal süzülerek geçer. Sonra manzara sonbahara döner.

**Kamera:** E1 — dağa doğru yavaş pan.
**Görsel olay:** E8 kar + zemin renginin beyaza tweenlenmesi + E4 kartal uçuşu.
**Ses:** rüzgâr, tek bir kartal çığlığı.
**Ekran cümlesi:** "Kartalkaya — 'kartal kayası'. Kış gelince her yeri beyaz olur."
**Collectible:** 🏂 — değişmiyor.
**Teknik çözüm:** Kar sistemi ve `groundColor` tween'i var. Kartal =
`kit_gull` modeli büyütülüp koyulaştırılır — **yeni model değil, mevcut
martının ölçek ve renk varyantı.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

---

### MARDİN · 3 durak · Güneydoğu Anadolu · Keloğlan

#### 1. The Stone Fairy-Tale City
`city_mardin_stone_doorway` · history · 🌇 a golden city photo

**Öğrenme fikri:** Akşam olunca bütün şehir altın rengine döner.

**Zaman Penceresi:** Kamera taş kapıdan geri çekilip teraslı evleri ve ovayı
gösterir. Işık yavaşça alçalır ve sararır; taş evler altın gibi parlamaya
başlar. Pencerelerde birer birer ışıklar yanar — alttan üste doğru, şehir
bir taç gibi aydınlanır.

**Kamera:** E1 — kapıdan geniş manzaraya geri çekilme.
**Görsel olay:** Işık rengi + E10 pencere ışıklarının sırayla yanması.
**Ses:** uzaktan ezan ve çan sesi karışık, çok kısık.
**Ekran cümlesi:** "Akşam olunca Mardin bir altın taç gibi yanar."
**Collectible:** 🌇 — değişmiyor.
**Teknik çözüm:** Pencere ışıkları = ev modelinin üstüne hizalanmış küçük
emissive düzlemler, kademeli gecikmeyle açılır.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Telkâri — Silver Lace
`city_mardin_telkari_bench` · craft · 🦋 a silver filigree butterfly

**Öğrenme fikri:** Gümüş tel spagettiden ince — ondan dantel gibi şekil yapılıyor.

**Zaman Penceresi:** Kamera tezgâha çok yakınlaşır. Bir gümüş tel havada
kendiliğinden kıvrılmaya başlar — çizgi çizer gibi — ve birkaç saniyede bir
kelebek şekli tamamlar. Kelebek bir an parlar, kanat çırpar ve uçup gider.

**Kamera:** E1 — tezgâha makro yakınlık.
**Görsel olay:** Çizgi büyümesi (line dash offset animasyonu) + E3 kelebeğin
belirip uçması.
**Ses:** çok ince metal tınısı, sonra kanat sesi.
**Ekran cümlesi:** "Spagettiden ince gümüş telden kelebek yapılır."
**Collectible:** 🦋 — değişmiyor.
**Teknik çözüm:** Kelebek konturu bir SVG yolundan türetilmiş `Line` geometrisi;
`drawRange` ile kademeli çizdirilir. **Bu projedeki en zarif ve en ucuz efekt
olabilir.**
**Yeni asset:** Hayır (yol verisi koddadır).
**Zorluk:** Orta.

#### 3. City of Many Faiths
`city_mardin_minaret_courtyard` · history · 🕊️ a peace dove

**Öğrenme fikri:** Aynı gökyüzünün altında cami, kilise ve manastır yan yana.

**Zaman Penceresi:** Kamera avludan yukarı bakar. Minare, çan kulesi ve manastır
sırayla kısa birer sesle "konuşur" — her biri konuşurken üstünde hafif bir ışık
halkası belirir. Üçü de sustuktan sonra güvercinler havalanıp hepsinin üstünden
birlikte geçer.

**Kamera:** E1 — avludan yukarı, üç yapı arasında yavaş yatay pan.
**Görsel olay:** E10 sıralı ışık + E6 mevcut `kit_mardin_dove_flight` sürüsü.
**Ses:** çok kısık ezan, çan, ilahi — üçü sırayla, hiçbiri baskın değil.
**Ekran cümlesi:** "Cami, kilise, manastır — yüzyıllardır aynı gökyüzünün altında."
**Collectible:** 🕊️ — değişmiyor.
**Teknik çözüm:** Güvercin sistemi hazır. Ses üçlüsü dikkatli ve eşit seviyede
olmalı.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### GAZİANTEP · 3 durak · Güneydoğu Anadolu · Keloğlan

#### 1. Zeugma & the Gypsy Girl
`city_gaziantep_zeugma_mosaic_panel` · history · 👀 the Gypsy Girl's gaze

**Öğrenme fikri:** Nereye gidersen git, o gözler seni takip ediyor gibi.

**Zaman Penceresi:** Kamera mozaiğe yaklaşır, sonra **yavaşça yana kayar** —
sola, sonra sağa. Mozaikteki gözler kameranın hareketini takip eder: baş
dönmez, sadece bakış kayar. Çevre karanlıktır, sadece mozaik aydınlıktır.

**Kamera:** E1 — mozaiğin önünde yatay kaydırma (dolly).
**Görsel olay:** E2 + gözbebeği düzleminin kameraya göre küçük kayması.
**Ses:** müzik durur, salon sessizliği; sadece ayak sesi yankısı.
**Ekran cümlesi:** "Nereye gidersen git — Çingene Kızı'nın gözleri seni bırakmaz."
**Collectible:** 👀 — değişmiyor.
**Teknik çözüm:** İki küçük koyu düzlem (gözbebeği) mozaik yüzeyine hizalanır
ve kameranın yatay konumuna göre ±birkaç santim kaydırılır. **Çok ucuz, çok
etkili — bu durağın tamamı bu numaraya dayanıyor.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Baklava Heaven
`city_gaziantep_baklava_counter` · food · 🥧 a crunchy baklava square

**Öğrenme fikri:** Kırk kat yufka, ve çıtırtı duyulmalı.

**Zaman Penceresi:** Kamera tezgâha iner. Baklava tepsisinin üstünde yufka
katları birer birer, hızla üst üste binerek sayılır — her katta minik bir
sayaç artar: 1, 2, 3… 40. Son katta şerbet dökülür ve üstüne yeşil fıstık
serpilir. Sonra bir kare kesilir ve **çıtırtı** duyulur.

**Kamera:** E1 — tepsiye tepeden yakın plan.
**Görsel olay:** Katmanların yığılması (ince düzlemler, kademeli) + E8 fıstık
serpilmesi.
**Ses:** şerbet dökülme sesi, sonunda net bir çıtırtı. **Bu durağın tek ve en
önemli sesi odur.**
**Ekran cümlesi:** "Kırk kat yufka. Ustalar der ki: çıtırtısı duyulmalı."
**Collectible:** 🥧 — değişmiyor.
**Teknik çözüm:** Kırk ince düzlem pahalı değil (80 üçgen). Sayaç ekran
üstünde küçük bir rakam.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. The Coppersmiths' Bazaar
`city_gaziantep_coppersmith_workbench` · craft · 🥣 a tiny copper pot

**Öğrenme fikri:** Çarşının sesi çekiç sesidir — şehrin kalp atışı.

**Zaman Penceresi:** Kamera tezgâha yaklaşır. Çekiç bakır tasa inmeye başlar —
ritmik: tin… tin… tin. Her vuruşta tastan kıvılcım gibi küçük parıltılar
sıçrar ve tas biraz daha parlar. Ritim hızlanır, sonra son bir vuruşla biter.

**Kamera:** E1 — tezgâha yakın, çekicin hizasında.
**Görsel olay:** E7 çekiç hareketi + kıvılcım parçacıkları + E10 tasın
parlaklığının artması.
**Ses:** metalik "tin" ritmi — sentezle kolay, ve bu durağın kalbi.
**Ekran cümlesi:** "Tin-tin-tin… Çarşının sesi, şehrin kalp atışı."
**Collectible:** 🥣 — değişmiyor.
**Teknik çözüm:** Çekiç = küçük silindir, position tween. Kıvılcım = 5–6 küçük
turuncu nokta.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### DİYARBAKIR · 3 durak · Güneydoğu Anadolu · Nasreddin Hoca · **[şehir henüz yok]**

#### 1. The Great Black Walls
`graybox_kale` · history · 🖤 a black basalt chip

**Öğrenme fikri:** Bu siyah surlar 6 km uzunluğunda — dünyanın en uzunlarından.

**Zaman Penceresi:** Kamera surun dibinden yukarı bakar, sonra geri çekilerek
yükselir ve sur duvarı kadrajın içinde **uzayıp gider** — sonu görünmez. Taşın
siyahlığı vurgulanır: güneş ışığı duvara vurur ama duvar yutar.

**Kamera:** E1 — dipten yukarı, sonra yana doğru uzun bir kaydırma.
**Görsel olay:** Sadece kamera; duvar modelinin tekrarı zaten uzunluğu verir.
**Ses:** rüzgâr, uzak bir kuş.
**Ekran cümlesi:** "Altı kilometre siyah bazalt. 1.500 yıldır şehrin etrafında."
**Collectible:** 🖤 — değişmiyor.
**Teknik çözüm:** Tamamen kamera. **Şehrin varlıkları geldiğinde bedava.**
**Yeni asset:** Hayır (şehrin kendi sur varlığı dışında).
**Zorluk:** Kolay.

#### 2. The Ten-Eyed Bridge
`graybox_kopru` · history · 🌉 a ten-eyed sunset

**Öğrenme fikri:** Köprünün on kemeri var ve gün batımında onların içinden
güneş görünür.

**Zaman Penceresi:** Kamera köprüye yandan bakar. Güneş alçalır ve tam
kemerlerin hizasına gelir; kemerlerin içinden turuncu ışık geçer, suya on ayrı
yansıma düşer. Kamera yavaşça kayarken yansımalar birer birer parlar.

**Kamera:** E1 — köprüye paralel yatay kaydırma.
**Görsel olay:** Işık rengi + sudaki yansıma düzlemleri.
**Ses:** su, akşam kuşları.
**Ekran cümlesi:** "On göz, on yansıma — Diyarbakır'ın en sevdiği fotoğraf."
**Collectible:** 🌉 — değişmiyor.
**Teknik çözüm:** Yansımalar = su üstünde on küçük turuncu düzlem.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Giant Watermelons
`graybox_fruit` · food · 🍉 a giant watermelon slice

**Öğrenme fikri:** Bir karpuz yedi yaşında bir çocuk kadar ağır olabiliyor.

**Zaman Penceresi:** Kamera karpuza iner. Karpuzun yanında Keloğlan boyunda
yarı saydam bir çocuk silüeti belirir — karpuz neredeyse onun kadardır. Sonra
karpuz ikiye ayrılır, içindeki kırmızı görünür, birkaç çekirdek fırlar.

**Kamera:** E1 — karpuza yakın, yandan.
**Görsel olay:** E3 boy karşılaştırma silüeti + modelin ikiye ayrılması
(iki yarım, position tween).
**Ses:** net bir "çat" kırılma sesi.
**Ekran cümlesi:** "Bir Diyarbakır karpuzu, yedi yaşında bir çocuk kadar ağır olabilir."
**Collectible:** 🍉 — değişmiyor.
**Teknik çözüm:** Karpuz modeli iki yarım olarak teslim edilmeli (brief'e not).
**Yeni asset:** Hayır (şehrin kendi karpuz varlığı iki parça istenecek).
**Zorluk:** Orta.

---

### İSTANBUL · 5 durak · Marmara · Nasreddin Hoca

#### 1. Hagia Sophia & the Blue Mosque
`city_istanbul_iznik_tile_panel` · history · 💠 a blue İznik tile

**Öğrenme fikri:** İçeride yirmi binden fazla mavi çini var — adı oradan geliyor.

**Zaman Penceresi:** Kamera çini panosuna yaklaşır. Pano üzerindeki tek bir
çini parlar, sonra ondan çoğalarak maviler yayılır — pano dolar, sonra mavi
kareler havaya kalkıp kameranın etrafını kısa süre sarar, bir çini bulutu
gibi. Sonra hepsi panoya geri iner.

**Kamera:** E1 — panoya yakın plan, mavi yükselirken hafif geri çekilme.
**Görsel olay:** E8 tersine + E10 — çoğalan mavi kareler.
**Ses:** tek bir çan/cam tınısı, yankılı.
**Ekran cümlesi:** "Yirmi bin mavi çini. Adını onlardan aldı."
**Collectible:** 💠 — değişmiyor.
**Teknik çözüm:** 60–80 küçük mavi düzlem, instanced, tek tween.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Galata Tower — *kullanıcının örneği*
`city_istanbul_galata_tower` · history · 🪁 a pair of legend wings

**Öğrenme fikri:** Rivayete göre buradan kanatla uçmuş bir adam var.

**Zaman Penceresi:** Kamera kulenin tepesine yönelir. Çevre hafifçe kararır,
odak kuleye geçer. Kuleden kanatlı yarı saydam bir silüet ayrılır ve Boğaz'ın
karşısına doğru süzülür — alçalarak, rüzgârla. Kadrajdan çıkarken söner.
Sahne normale döner.

**Kamera:** E1 — kulenin tepesine pan, sonra uçuşu takip.
**Görsel olay:** E3 + E4 — kanatlı silüet, kuleden suyun karşısına eğri yörünge.
**Ses:** rüzgâr, kanat çırpışı.
**Ekran cümlesi:** "1632 — rivayete göre Hezarfen Ahmed Çelebi buradan taktığı kanatlarla Boğaz'ın karşısına uçtu."
**Collectible:** 🪁 a pair of legend wings — değişmiyor. (Kullanıcının
önerdiği 🪽 ile aynı fikir; mevcut ödül zaten "efsane kanatları".)
**Teknik çözüm:** Silüet = tek bir billboard sprite (kanatlı insan silüeti),
`kit_gull`'un uçuş eğrisi matematiği yeniden kullanılır.
**Yeni asset:** **Evet** — tek PNG: kanatlı figür silüeti (~25 KB).
**Zorluk:** Orta.

#### 3. The Grand Bazaar
`city_istanbul_grand_bazaar` · craft · 🪔 a mosaic lamp

**Öğrenme fikri:** Tek çatı altında dört bin dükkân var.

**Zaman Penceresi:** Kamera çarşının kapısından içeri doğru girer. İçerisi
karanlıktır; sonra mozaik lambalar sırayla yanmaya başlar — önce yakındakiler,
sonra uzaktakiler, derinlemesine; ışık koridorun sonuna kadar gider ve
görünenden çok daha derin olduğu anlaşılır.

**Kamera:** E1 — kapıdan içeri doğru ilerleyen kamera.
**Görsel olay:** E10 — sıralı lamba yanışı, renkli ışıklar.
**Ses:** uğultu, uzaktan pazarlık sesleri.
**Ekran cümlesi:** "Tek çatının altında dört bin dükkân. Kaybolmak serbest."
**Collectible:** 🪔 — değişmiyor.
**Teknik çözüm:** 20–30 küçük renkli nokta ışığı/emissive düzlem, kademeli.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 4. The Simit Cart
`city_istanbul_simit_cart` · food · 🥨 a warm simit

**Öğrenme fikri:** Simidi martılarla paylaşmak İstanbul'un âdetidir.

**Zaman Penceresi:** Kamera arabaya yaklaşır. Bir simit havaya atılır; mevcut
martılar aniden ona doğru süzülür, biri havada kapar, hepsi dağılır.

**Kamera:** E1 — arabadan yukarı, martıları takip.
**Görsel olay:** E6 — mevcut `kit_gull` sürüsü yemlemeye yönelir.
**Ses:** martı çığlıkları (sentez), kanat sesi.
**Ekran cümlesi:** "Bir simit al, yarısını martılara ver — İstanbul'da âdet böyle."
**Collectible:** 🥨 — değişmiyor.
**Teknik çözüm:** Martılar zaten var ve yörüngeleri parametrik — tek yapılacak
yörünge merkezini kısa süre simide çekmek. **Bu durak neredeyse bedava.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 5. Ferry on the Bosphorus
`city_istanbul_kadikoy_pier` · nature · 🐬 a dolphin sticker

**Öğrenme fikri:** Burası dünyada iki kıtaya birden kurulmuş tek şehir.

**Zaman Penceresi:** Kamera iskeleden suya döner ve geniş açıya geçer. Vapur
geçer; suda iki yunus peş peşe zıplar. Kamera yükselirken suyun iki yakası da
kadraja girer ve üstlerinde kısa bir an iki kelime belirir: **Avrupa** ve
**Asya**.

**Kamera:** E1 — iskeleden yükselerek iki yakayı birden gösteren geniş açı.
**Görsel olay:** E11 mevcut `ferryLine` + yunus zıplayışı (yay şeklinde tween).
**Ses:** `playFerryHorn` **zaten var** + su.
**Ekran cümlesi:** "İki kıtaya birden kurulmuş tek şehir: bir yakası Avrupa, bir yakası Asya."
**Collectible:** 🐬 — değişmiyor.
**Teknik çözüm:** Yunus = küçük gri eğri gövde; iki yakanın etiketlenmesi
ekran üstü metin.
**Yeni asset:** **Evet** — küçük yunus GLB (~60 KB) veya billboard sprite.
**Zorluk:** Orta.

---

### BURSA · 3 durak · Marmara · Nasreddin Hoca · **[şehir henüz yok]**

#### 1. The Green City of Sultans
`graybox_cami` · history · 🏔️ a snowy Uludağ magnet

**Öğrenme fikri:** Bursa Osmanlı'nın ilk başkenti ve arkasında Uludağ var.

**Zaman Penceresi:** Kamera Yeşil Türbe'nin yeşil çinilerinden yukarı kalkar ve
arkadaki Uludağ'ı gösterir. Dağın zirvesi karlı, etekleri yeşildir — kamera
yükseldikçe ikisi aynı kadraja girer: yeşil şehir, beyaz dağ.

**Kamera:** E1 — türbeden dağa dikey açılma.
**Görsel olay:** Sadece kamera + hafif bir bulut geçişi (E9).
**Ses:** kuş, uzak şehir uğultusu.
**Ekran cümlesi:** "Aşağısı yemyeşil, yukarısı bembeyaz. Osmanlı'nın ilk başkenti."
**Collectible:** 🏔️ — değişmiyor.
**Teknik çözüm:** Kamera.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Karagöz & Hacivat Shadow Play
`graybox_karagoz` · craft · 🎭 a shadow puppet

**Öğrenme fikri:** Deve derisinden kuklalar ışıklı perdenin arkasında oynar.

**Zaman Penceresi:** Çevre kararır. Önde aydınlık bir perde belirir. Perdenin
arkasında iki kukla silüeti görünür — biri kısa ve yuvarlak, biri uzun ve
sarıklı. Birbirlerine doğru yaklaşıp kısa bir "tartışma" yapar (zıplayarak,
el kol hareketiyle), sonra ikisi birden perdeden kayıp gider.

**Kamera:** E1 — perdeye tam karşıdan, sabit. **Projedeki tek "tiyatro"
kamerası: hiç hareket etmez.**
**Görsel olay:** E2 + E3 — iki silüetin perde arkasındaki oyunu.
**Ses:** def sesi, iki kısa kahkaha.
**Ekran cümlesi:** "Karagöz ile Hacivat — perdenin arkasından yüzlerce yıldır güldürüyorlar."
**Collectible:** 🎭 — değişmiyor.
**Teknik çözüm:** Perde = aydınlık düzlem; kuklalar = iki koyu silüet sprite,
perdenin arkasında hareket. **Çok ucuz ve çok özgün.**
**Yeni asset:** **Evet** — iki PNG silüet (Karagöz, Hacivat; ~40 KB toplam).
**Zorluk:** Orta.

#### 3. İskender Kebab
`graybox_stall` · food · 🌰 a candied chestnut

**Öğrenme fikri:** İskender burada icat edildi; üstüne tereyağı dökülür.

**Zaman Penceresi:** Kamera tabağa iner. Üstüne yukarıdan erimiş tereyağı
dökülür — ince, parlak bir akış — ve değdiği yerde cızırtı ve küçük bir buhar
çıkar. Tabak parlar.

**Kamera:** E1 — tabağa tepeden yakın.
**Görsel olay:** Akış = ince silindir, scale.y; E9 buhar.
**Ses:** cızırtı. **Tek ses, çok etkili.**
**Ekran cümlesi:** "İskender burada icat edildi. Üstüne kızgın tereyağı dökülünce cızırdar."
**Collectible:** 🌰 — değişmiyor.
**Teknik çözüm:** Akış ve buhar hazır ilkeller.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### BALIKESİR · 3 durak · Marmara · Keloğlan

#### 1. Mount Ida (Kaz Dağları)
`city_balikesir_mossy_cascade` · nature · 🌲 a pine cone

**Öğrenme fikri:** Burası dünyanın en çok oksijenli yerlerinden biri.

**Zaman Penceresi:** Kamera şelaleden yukarı, ormana döner. Hava "görünür"
olur: ağaçların arasından ince, parlak ışık huzmeleri iner ve içinde çok
sayıda küçük parıltı süzülür. Birkaç saniye nefes alınan bir an.

**Kamera:** E1 — şelaleden ormana yavaş yükselme.
**Görsel olay:** Işık huzmeleri (yarı saydam koniler) + E8 yavaş yükselen
parıltılar.
**Ses:** su, yoğun kuş sesi, derin bir nefes.
**Ekran cümlesi:** "Dünyanın en temiz havalarından biri burada. İnsanlar sırf nefes almak için geliyor."
**Collectible:** 🌲 — değişmiyor.
**Teknik çözüm:** Huzme = düşük opaklıklı koni geometrisi, 4–5 adet.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Ayvalık Olive Groves
`city_balikesir_olive_press` · food · 🫒 a bottle of olive oil

**Öğrenme fikri:** Bu zeytin ağaçlarının bazısı yüzlerce yaşında.

**Zaman Penceresi:** Kamera zeytin presine yaklaşır. Taş döner, altından yağ
akmaya başlar — koyu altın rengi, ince bir akış. Akarken arkadaki zeytinlikte
bir ağaç öne çıkar ve gövdesi kalınlaşır (yaşlanma gösterimi), sonra normale
döner.

**Kamera:** E1 — presten zeytinliğe.
**Görsel olay:** E7 pres taşının dönüşü + yağ akışı + bir ağacın scale tween'i.
**Ses:** taş gıcırtısı, damla.
**Ekran cümlesi:** "Bu ağaçların bazısı dedenin dedesinden de yaşlı."
**Collectible:** 🫒 — değişmiyor.
**Teknik çözüm:** Mevcut `kit_balikesir_olive_tree` ölçeklenir.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Höşmerim Dessert
`city_balikesir_hosmerim_counter` · food · 🧀 a höşmerim cup

**Öğrenme fikri:** Peynirden tatlı yapılıyor.

**Zaman Penceresi:** Kamera tezgâha iner. Bir kâse peynir yavaşça kıvama gelir
— renk beyazdan altına döner, yüzeyi parlar — ve üstüne toz şeker serpilir.
Buhar çıkar: sıcaktır.

**Kamera:** E1 — kâseye yakın plan.
**Görsel olay:** Renk tween + E8 şeker serpimi + E9 buhar.
**Ses:** karıştırma, serpme.
**Ekran cümlesi:** "Peynirden tatlı olur mu? Balıkesir'de olur."
**Collectible:** 🧀 — değişmiyor.
**Teknik çözüm:** Malzeme rengi tween'i.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### İZMİR · 5 durak · Ege · Keloğlan

#### 1. Ephesus — the Celsus Library
`city_izmir_celsus_facade` · history · 📜 an ancient scroll

**Öğrenme fikri:** Burada on iki bin rulo kitap vardı.

**Zaman Penceresi:** Kamera cepheye yaklaşır. Sütunların arasındaki boşluklarda
yarı saydam raflar ve rulolar belirir — kütüphane bir an için "dolar". Birkaç
rulo havada süzülür. Sonra hepsi solar ve geriye yine boş taş kalır.

**Kamera:** E1 — cepheye yavaş zoom, ortalanmış.
**Görsel olay:** E3 — yarı saydam raf/rulo dizileri belirip söner.
**Ses:** kâğıt hışırtısı, uzak yankı.
**Ekran cümlesi:** "Bu rafların üstünde on iki bin rulo vardı. Şimdi sadece taş."
**Collectible:** 📜 — değişmiyor.
**Teknik çözüm:** Rulolar = küçük silindirler, düşük opaklık, instanced.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. The Great Theatre of Ephesus
`city_izmir_theatre_seats` · history · 🎭 a theatre mask

**Öğrenme fikri:** Sahnedeki bir fısıltı en üst sıradan duyuluyor.

**Zaman Penceresi:** Kamera sahnenin ortasına iner. Bir fısıltı duyulur ve
sahneden yukarı doğru halka halka görünür bir ses dalgası yayılır — basamakları
tek tek geçer, en üst sıraya varınca orada küçük bir parıltı olur. Fısıltı o
anda bir kez daha, net duyulur.

**Kamera:** E1 — sahneden en üst sıraya doğru yükselen pan, dalgayı takip eder.
**Görsel olay:** Genişleyen halka düzlemleri (3–4 adet, kademeli).
**Ses:** fısıltı → sessizlik → aynı fısıltı net.
**Ekran cümlesi:** "Sahnedeki bir fısıltı, en üst sıradan duyulur. İki bin yıl önce böyle hesaplamışlar."
**Collectible:** 🎭 — değişmiyor.
**Teknik çözüm:** Halkalar = genişleyen torus, opaklık azalarak.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. The Clock Tower of Konak Square
`city_izmir_clock_tower_base` · history · 🕊️ a pigeon feather

**Öğrenme fikri:** Saat çalar, güvercinler havalanır — meydanın ritmi budur.

**Zaman Penceresi:** Kamera saat kulesine bakar. Saat çalar. İlk vuruşta
meydandaki bütün güvercinler aynı anda havalanır ve kulenin etrafında döner.
Üç vuruştan sonra yavaşça geri konarlar.

**Kamera:** E1 — kuleye bakış, güvercinler havalanınca hafif yukarı.
**Görsel olay:** E6 — mevcut `kit_izmir_pigeon_walking` sürüsü havalanır
(`kit_izmir_doves_ruin` uçuş pozu olarak).
**Ses:** çan, kanat patırtısı.
**Ekran cümlesi:** "Saat çalar, güvercinler havalanır. İzmir'in saati böyle işler."
**Collectible:** 🕊️ — değişmiyor.
**Teknik çözüm:** Her iki güvercin varlığı da mevcut; yürüyenler gizlenip
uçanlar gösterilir. **Kullanıcının kendi örneği — ve gerçekten en ucuz olanı.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 4. Nazarköy — the Evil Eye Village
`city_izmir_nazar_tree` · craft · 🧿 an evil eye bead

**Öğrenme fikri:** Nazar boncuğu ateşte eritilen camdan yapılıyor.

**Zaman Penceresi:** Kamera nazar ağacına yaklaşır. Dalda asılı boncuklardan
biri önce turuncu-kızıl yanar (erimiş cam gibi), sonra soğuyarak maviye döner
ve parlar. Hemen ardından ağaçtaki bütün boncuklar sırayla mavi parlar — ağaç
bir an için ışıldar.

**Kamera:** E1 — tek boncuğa makro yakınlık, sonra ağacın tamamına geri çekilme.
**Görsel olay:** E10 — renk geçişi (turuncu→mavi) ve sıralı parlama.
**Ses:** ocak uğultusu, cam tınısı.
**Ekran cümlesi:** "Ateşte erir, soğuyunca maviye döner. Nazar boncuğu böyle doğar."
**Collectible:** 🧿 — değişmiyor.
**Teknik çözüm:** Emissive renk tween'i; boncuk konumları ağaç modelinden
ölçülmeli.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 5. Boyoz Bakery on the Kordon
`city_izmir_boyoz_cart` · food · 🥐 a warm boyoz

**Öğrenme fikri:** Boyoz katları açılan, kıvrımlı bir hamur işi.

**Zaman Penceresi:** Kamera tezgâha iner. Bir boyoz hamuru dönerek açılır —
spiral katları görünür hale gelir — ve buhar çıkar. Arkada Kordon'da bisikletli
bir figür geçer, deniz parlar.

**Kamera:** E1 — tezgâhtan Kordon'a hafif kaydırma.
**Görsel olay:** E7 spiral açılma + E9 buhar + arka planda geçen figür.
**Ses:** deniz, bisiklet zili.
**Ekran cümlesi:** "İzmir'de gün, denizin kenarında sıcak bir boyozla başlar."
**Collectible:** 🥐 — değişmiyor.
**Teknik çözüm:** Mevcut sörfçü/yaya figürlerinden biri bisikletli olarak
yeniden kullanılır veya basitçe yürüyen bir NPC geçer.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### MUĞLA · 3 durak · Ege · Nasreddin Hoca · **[şehir henüz yok]**

#### 1. Bodrum Castle
`graybox_kale` · history · ⚓ a shipwreck treasure coin

**Öğrenme fikri:** Kalenin içinde denizin dibinden çıkarılmış batıklar var.

**Zaman Penceresi:** Kamera kaleden limana, sonra suyun altına iner — yüzeyin
altına geçer. Birkaç saniye su altı: batık bir gemi iskeleti, etrafında balıklar,
dipte parlayan bir sikke. Sonra kamera yüzeye çıkar.

**Kamera:** E1 — su yüzeyini geçen tek kamera. **Projedeki tek su altı anı.**
**Görsel olay:** Su altı rengi (mavi filtre) + balık sürüsü + E10 sikke parıltısı.
**Ses:** su altı boğukluğu, baloncuk.
**Ekran cümlesi:** "Kalenin içindeki müze, denizin dibinden çıkarıldı."
**Collectible:** ⚓ — değişmiyor.
**Teknik çözüm:** Su altı = kamera suyun altına inince tüm sahneye mavi sis
(`fog`) uygulanır. Balıklar = `kit_gull` yörünge sistemi, balık sprite'ıyla.
**Yeni asset:** **Evet** — basit batık gemi iskeleti GLB (~150 KB) + balık sprite.
**Zorluk:** Zor.

#### 2. Ölüdeniz Blue Lagoon
`graybox_sahil` · nature · 🪂 a paraglider pin

**Öğrenme fikri:** İnsanlar dağdan atlayıp kumsala iniyor.

**Zaman Penceresi:** Kamera lagünden yukarı, Babadağ'a döner. Tepeden renkli bir
yamaç paraşütü ayrılır ve uzun bir yay çizerek kumsala iner. Kamera onu takip
eder; iniş anında kum kalkar.

**Kamera:** E1 — dağdan kumsala, paraşütü takip.
**Görsel olay:** E4 — mevcut `paragliders` sistemi (Ordu'da var) burada iniş
yaparak kullanılır.
**Ses:** rüzgâr, kumaş çırpınması.
**Ekran cümlesi:** "Babadağ'dan atlayıp kumsala inerler — yaklaşık yirmi dakika havada."
**Collectible:** 🪂 — değişmiyor.
**Teknik çözüm:** Ordu'nun paraşüt varlığı ve sistemi aynen kullanılır, sadece
yörüngenin sonu yere iner. **Şehirler arası tek paylaşılan hareketli varlık.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Caretta Turtles of Dalyan
`graybox_hayvan` · nature · 🐢 a baby turtle sticker

**Öğrenme fikri:** Kaplumbağalar milyonlarca yıldır aynı kumsala geliyor.

**Zaman Penceresi:** Gece olur (ışık hızla düşer, ay çıkar). Kumda küçük bir
yuvadan yavru kaplumbağalar çıkar ve hep birlikte denize doğru yürür —
yavaş, kararlı, hepsi aynı yöne. Suya girince kamera durur.

**Kamera:** E1 — kuma çok yakın, kaplumbağa hizasında, denize doğru.
**Görsel olay:** Gece geçişi (ışık+gökyüzü rengi) + 8–10 küçük figürün
senkron yürüyüşü.
**Ses:** dalga, kumda hafif hışırtı.
**Ekran cümlesi:** "Milyonlarca yıldır aynı kumsala gelip yumurtluyorlar. Gece doğup geceye yürüyorlar."
**Collectible:** 🐢 — değişmiyor.
**Teknik çözüm:** Yavrular = çok küçük basit modeller veya sprite; yürüyüş
rota sistemiyle (mevcut `catRoutes` mantığı).
**Yeni asset:** **Evet** — tek küçük yavru kaplumbağa GLB (~80 KB), 10 kopya.
**Zorluk:** Orta.

---

### ÇANAKKALE · 3 durak · Marmara · Nasreddin Hoca · **[şehir henüz yok]**

#### 1. The Trojan Horse
`graybox_truva` · history · 🐴 a wooden horse toy

**Öğrenme fikri:** Askerler tahta atın içine saklanıp şehre girdi.

**Zaman Penceresi:** Kamera tahta atın önünde durur. Atın yan kapağı açılır ve
içeriden birer birer yarı saydam asker silüetleri iner — üç, beş, sekiz tane —
ve karanlığa dağılır. Kapak kapanır.

**Kamera:** E1 — ata yakın, kapağın hizasında, sabit.
**Görsel olay:** E3 — silüetlerin inişi (mevcut `npc_featured_soldier` yarı
saydam olarak).
**Ses:** tahta gıcırtısı, çok kısık ayak sesleri.
**Ekran cümlesi:** "Anlatıya göre askerler bu atın içinde saklanıp şehre böyle girdi."
**Collectible:** 🐴 — değişmiyor.
**Teknik çözüm:** Asker NPC'si **zaten var** (`npc_featured_soldier`), yarı
saydam kopyaları kullanılır.
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Gallipoli & the Sea Castles
`graybox_kale` · history · 🎖️ a hero's medal

**Öğrenme fikri:** Burası 1915'te çok önemli şeylerin yaşandığı yer.

**Zaman Penceresi:** Kamera kaleden boğaza döner. Su sakindir. Karşı kıyıdan
başlayarak su üzerine birer birer kırmızı karanfiller düşer ve akıntıyla
süzülür — on, yirmi tane. Kamera onları izler. Sessizlik.

**Kamera:** E1 — kaleden suya, yavaş ve alçak.
**Görsel olay:** E8 — karanfiller suya düşer ve akar.
**Ses:** **sadece su ve rüzgâr.** Müzik kesilir. Bu durakta ses efekti yok.
**Ekran cümlesi:** "1915'te burada çok şey yaşandı. Her yıl denize çiçek bırakılır."
**Collectible:** 🎖️ — değişmiyor.
**Teknik çözüm:** Karanfil = küçük kırmızı düzlemler, su üstünde akış.
**Not:** Bu durak dikkat ister — çocuk yaş grubuna uygun, sakin ve soyut
tutulmalı. Savaş görüntüsü yok, sadece anma.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Cheese Halva
`graybox_tatli` · food · 🍮 warm cheese halva

**Öğrenme fikri:** Peynirden yapılan sıcak bir tatlı.

**Zaman Penceresi:** Kamera tabağa iner. Kaşık tatlıya girer ve kaldırılınca
tatlı uzar (kuymak gibi ama kısa). Buhar çıkar, üstüne toz şeker düşer.

**Kamera:** E1 — tabağa yakın.
**Görsel olay:** Uzama + E9 buhar + E8 şeker.
**Ses:** kaşık sesi.
**Ekran cümlesi:** "Peynirden yapılan sıcak bir tatlı — ilk duyan şaşırır."
**Collectible:** 🍮 — değişmiyor.
**Teknik çözüm:** Trabzon kuymağının aynı ilkeli, daha kısa.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### NEVŞEHİR (Kapadokya) · 5 durak · İç Anadolu · Keloğlan

#### 1. The Fairy Chimneys
`city_nevsehir_fairy_chimney_cluster` · nature · 🪨 a fairy chimney magnet

**Öğrenme fikri:** Bunları kimse yapmadı — rüzgâr ve yağmur oydu.

**Zaman Penceresi:** Kamera peribacalarına bakar. Bacalar bir an için
**kalınlaşır** — etrafları dolu kayaymış gibi. Sonra rüzgâr eser ve toz
halinde kaya aşınarak uçar; bacalar yavaş yavaş bugünkü ince hâline döner.
Milyonlarca yıl birkaç saniyede geçer.

**Kamera:** E1 — bacalara sabit bakış, hafif geri çekilme.
**Görsel olay:** Scale tween (kalın→ince) + E8 toz parçacıklarının yanlara
savrulması.
**Ses:** rüzgâr, kum hışırtısı.
**Ekran cümlesi:** "Kimse yapmadı. Rüzgâr ve yağmur milyonlarca yılda oydu."
**Collectible:** 🪨 — değişmiyor.
**Teknik çözüm:** Modelin x/z ölçeği 1.6'dan 1.0'a tweenlenir. **Tek satırlık
fikir, çok güçlü anlatım.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Hot Air Balloon Ride
`kit_hot_air_balloon` · nature · 🎈 a mini balloon

**Öğrenme fikri:** Her sabah gün doğarken yüzlerce balon havalanır.

**Zaman Penceresi:** Gökyüzü gün doğumu rengine döner. Tek tek balonlar
yükselmeye başlar — önce bir, sonra beş, sonra vadinin her yerinden onlarca.
Brülörler kısa kısa yanar. Kamera yükselen balonlarla birlikte yukarı bakar.

**Kamera:** E1 — vadiden yukarı, balonları takip.
**Görsel olay:** E5 mevcut `balloons` sistemi — sayı ve kalkış zamanlaması
kademelendirilir + `BalloonBurner` alev.
**Ses:** brülör "fuuuş" sesi, sabah sessizliği.
**Ekran cümlesi:** "Her sabah gün doğarken yüzlerce balon aynı anda havalanır."
**Collectible:** 🎈 — değişmiyor.
**Teknik çözüm:** Balon sistemi ve brülör **zaten var**; sadece kalkış
koreografisi. **Neredeyse bedava.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Derinkuyu Underground City
`city_nevsehir_underground_stone_door` · history · 🕯️ an explorer's lantern

**Öğrenme fikri:** Yerin altında sekiz katlı bir şehir var.

**Zaman Penceresi:** Kamera taş kapıya yaklaşır. Kapı yuvarlanarak açılır ve
arkasındaki karanlık görünür. Kamera karanlığa doğru iner; inerken yanlarda
sırayla sekiz kat ışığı belirir — her katta bir fener yanar, aşağı indikçe.
En altta durur.

**Kamera:** E1 — kapıdan içeri ve **aşağı** inen kamera. Sümela'nın tersi.
**Görsel olay:** Kapının yuvarlanması (rotation) + E10 sıralı kat ışıkları.
**Ses:** taşın yuvarlanma gürültüsü, yankı, damla.
**Ekran cümlesi:** "Sekiz kat aşağı. Binlerce kişi burada saklanabilirdi."
**Collectible:** 🕯️ — değişmiyor.
**Teknik çözüm:** Kat ışıkları = dikey dizilmiş 8 emissive nokta; gerçek bir
yeraltı geometrisi gerekmez, karanlık + ışıklar yeter. **Bu numara önemli:
mekânı modellemeden mekân hissi verir.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 4. Pottery Workshop in Avanos
`city_nevsehir_pottery_wheel` · craft · 🏺 a tiny clay pot

**Öğrenme fikri:** Dönen çarkta bir topak kil vazoya dönüşür.

**Zaman Penceresi:** Kamera çarka iner. Çark dönmeye başlar; üstündeki kil
topağı yükselir, incelir, boyun verir ve bir testi şeklini alır. Dönüş yavaşlar,
testi durur.

**Kamera:** E1 — çarka yakın, hafif üstten.
**Görsel olay:** E7 dönüş + modelin şekil değiştirmesi.
**Ses:** çarkın ritmik dönüşü, ıslak kil sesi.
**Ekran cümlesi:** "Bir topak kil, dönen çarkta testiye dönüşür."
**Collectible:** 🏺 — değişmiyor.
**Teknik çözüm:** Şekil değiştirme gerçek deformasyon değil — **iki ayrı
basit silindir/küre birleşiminin scale tween'i** yeterli okunur. Veya modelde
iki ayrı mesh (topak ve testi) arası geçiş.
**Yeni asset:** Hayır (model iki durumlu teslim edilirse daha iyi).
**Zorluk:** Orta.

#### 5. Turkish Carpet Weavers
`city_nevsehir_carpet_loom` · craft · 🧶 a ball of rainbow wool

**Öğrenme fikri:** Halı düğüm düğüm dokunur, bazısı bir yıl sürer.

**Zaman Penceresi:** Kamera tezgâha yaklaşır. Halının üstünde desen **aşağıdan
yukarı doğru dolmaya** başlar — satır satır, hızlı. Dolarken yanda küçük bir
sayaç döner: düğüm sayısı artar. Halı tamamlanınca sayaç durur.

**Kamera:** E1 — tezgâha karşıdan, sabit.
**Görsel olay:** Desen dokusunun kademeli açılması (`map` üzerinde clip/scale).
**Ses:** düğüm atma sesi, ritmik ve hızlanan.
**Ekran cümlesi:** "Düğüm düğüm dokunur. Bir halı bazen bir yıl sürer."
**Collectible:** 🧶 — değişmiyor.
**Teknik çözüm:** Halı yüzeyini kaplayan bir düzlemin `scale.y` tween'i,
alttan üste. Sayaç ekran üstünde.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### ANKARA · 3 durak · İç Anadolu · Nasreddin Hoca · **[şehir henüz yok]**

#### 1. Anıtkabir
`graybox_anitkabir` · history · 🇹🇷 a memorial flag

**Öğrenme fikri:** Nöbetçiler hiç kıpırdamadan durur, sonra tören başlar.

**Zaman Penceresi:** Kamera uzun aslanlı yoldan anıta doğru ilerler. İki
nöbetçi tamamen hareketsizdir. Sonra tek bir davul vuruşu olur; nöbetçiler
aynı anda, tam senkron bir adım atar ve yeniden donar. Bayrak hafif dalgalanır.

**Kamera:** E1 — aslanlı yolda düz, yavaş ilerleyiş. **Projedeki tek "tören"
kamerası: tamamen simetrik ve sabit hızlı.**
**Görsel olay:** İki NPC'nin senkron tek hareketi + E8 yok, sade.
**Ses:** tek davul vuruşu, sonra sessizlik.
**Ekran cümlesi:** "Nöbetçiler saatlerce kıpırdamaz. Sonra hep birlikte tek adım atarlar."
**Collectible:** 🇹🇷 — değişmiyor.
**Teknik çözüm:** Mevcut `npc_featured_soldier` iki kopya; tek pozisyon tween.
Bayrak `kit_turkish_flag` + `WindProp` **zaten var.**
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 2. Museum of Anatolian Civilizations
`graybox_muze` · history · ☀️ a Hittite sun disc

**Öğrenme fikri:** Bu topraklardan dokuz bin yıllık oyuncaklar çıktı.

**Zaman Penceresi:** Çevre kararır, tek bir vitrin aydınlanır: Hitit güneş
kursu. Kurs yavaşça kendi etrafında döner ve altın parlar. Sonra yanında iki
vitrin daha aydınlanır — küçük bir pişmiş toprak oyuncak ve bir tablet. Üçü
birlikte durur.

**Kamera:** E1 — vitrine yakın, sonra yana açılarak üçünü birden gösterir.
**Görsel olay:** E2 + E7 dönüş + E10 sıralı vitrin aydınlanması.
**Ses:** müze sessizliği, her aydınlanmada tek bir ton.
**Ekran cümlesi:** "Dokuz bin yıl önce burada yaşayan bir çocuğun oyuncağı."
**Collectible:** ☀️ — değişmiyor.
**Teknik çözüm:** Üç küçük obje + nokta ışıkları.
**Yeni asset:** **Evet** — güneş kursu küçük GLB (~80 KB). Diğer ikisi basit
şekillerle temsil edilebilir.
**Zorluk:** Orta.

#### 3. The Angora Goat & Cat
`graybox_hayvan` · nature · 🐐 a ball of mohair

**Öğrenme fikri:** İkisi de şehrin adını taşıyor: Angora.

**Zaman Penceresi:** Kamera keçiye yaklaşır. Keçinin uzun ipeksi tüyleri
rüzgârda dalgalanır. Yanında beyaz, mavi gözlü Ankara kedisi belirir ve
keçinin yanına oturur. İkisi birlikte kameraya bakar — kedinin gözleri parlar.

**Kamera:** E1 — ikisini birden alan yakın plan.
**Görsel olay:** Tüy dalgalanması (`WindProp`) + kedinin yürüyüp oturması +
E10 göz parıltısı.
**Ses:** keçi melemesi, kedi mırıltısı (`playMeow` **var**).
**Ekran cümlesi:** "Ankara keçisi ve Ankara kedisi — ikisi de adını bu şehirden alıyor."
**Collectible:** 🐐 — değişmiyor.
**Teknik çözüm:** Kedi için `kit_van_cat` **yeniden kullanılamaz** (Van kedisi
tek gözü mavi tek gözü kehribar — ayırt edici). Beyaz, mavi gözlü varyant için
mevcut `kit_street_cat` malzeme değişimiyle yeterli olabilir.
**Yeni asset:** **Evet** — Ankara keçisi GLB (~150 KB). Kedi mevcut varlıktan
türetilir.
**Zorluk:** Orta.

---

### ANTALYA · 3 durak · Akdeniz · Keloğlan

#### 1. Aspendos Theatre
`graybox_theatre` (varlık bekleniyor) · history · 🎶 a concert ticket

**Öğrenme fikri:** İki bin yıllık tiyatroda hâlâ konser veriliyor.

**Zaman Penceresi:** Kamera boş basamaklara bakar. Basamaklarda yarı saydam
seyirci silüetleri belirir — sıra sıra, aşağıdan yukarı dolar; on beş bin
kişilik bir kalabalık hissi. Sahnede tek bir müzik notası çalar, kalabalık
alkışlar, sonra hepsi solar — ama alkış bir saniye daha devam eder.

**Kamera:** E1 — sahneden basamaklara doğru yavaş geri çekilme.
**Görsel olay:** E3 — kademeli beliren seyirci silüetleri (instanced, çok
düşük opaklık).
**Ses:** tek enstrüman notası, sonra alkış.
**Ekran cümlesi:** "İki bin yıl sonra hâlâ dolup taşıyor — burada bugün de konser var."
**Collectible:** 🎶 — değişmiyor.
**Teknik çözüm:** Silüetler = tek bir basit insan düzlemi, 200+ instanced
kopya, çok düşük opaklık. **Kalabalık hissi için model gerekmez.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. Düden Waterfalls
`graybox_selale` (varlık bekleniyor) · nature · 🌈 a rainbow in the spray

**Öğrenme fikri:** Şelale doğrudan denize dökülüyor, ve serpintide gökkuşağı
oluyor.

**Zaman Penceresi:** Kamera seyir terasından şelalenin dibine, sonra denize
doğru kayar — suyun karaya hiç değmeden denize düştüğü görülür. Güneş açılır,
serpintinin içinde bir gökkuşağı belirir ve birkaç saniye durur.

**Kamera:** E1 — teras → şelale → deniz, tek sürekli hareket.
**Görsel olay:** E9 serpinti + gökkuşağı (yarı saydam renkli yay düzlemi).
**Ses:** şelale gürültüsü, martı.
**Ekran cümlesi:** "Bu şelale karaya değmeden doğrudan denize dökülür. Güneş vurunca serpintide gökkuşağı çıkar."
**Collectible:** 🌈 — değişmiyor.
**Teknik çözüm:** Gökkuşağı = yarı saydam, degrade dokulu yay düzlemi.
**Yeni asset:** Hayır (gökkuşağı degrade kodla üretilir).
**Zorluk:** Orta.

#### 3. Orange Groves
`graybox_agac` (varlık bekleniyor) · food · 🍊 a golden orange

**Öğrenme fikri:** Antalya'nın ödülü bile portakal: "Altın Portakal".

**Zaman Penceresi:** Kamera ağaca yaklaşır. Bir portakal dalından kopup düşer
ve yere değdiği anda **altın rengine döner** ve parlar. Ardından ağaçtaki
diğer portakallar da sırayla altın parlar. Hafif bir çiçek yağmuru başlar.

**Kamera:** E1 — ağaca yakın, düşen portakalı takip.
**Görsel olay:** E8 düşüş + E10 altına dönüş + çiçek parçacıkları.
**Ses:** dal hışırtısı, yere düşen tok ses, tek bir ışıltı tınısı.
**Ekran cümlesi:** "Antalya'nın film ödülünün adı bile portakal: Altın Portakal."
**Collectible:** 🍊 — değişmiyor.
**Teknik çözüm:** Renk + emissive tween.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

### ADANA · 3 durak · Akdeniz · Keloğlan · **[şehir henüz yok]**

#### 1. Taşköprü — the Stone Bridge
`graybox_kopru` · history · 🌉 a bridge stone

**Öğrenme fikri:** 1.800 yıldır insanlar bu köprüden geçiyor — bugün de.

**Zaman Penceresi:** Kamera köprüye yandan bakar. Köprünün üstünden yarı
saydam figürler geçmeye başlar — önce antik kıyafetli, sonra Osmanlı, sonra
bugünkü; hepsi aynı yönde, hiç durmadan. Hız artar, sonra yavaşlar ve geriye
sadece bugünün yayaları kalır.

**Kamera:** E1 — köprüye paralel, sabit.
**Görsel olay:** E3 — farklı dönemleri temsil eden yarı saydam figür akışı.
**Ses:** ayak sesleri, dönemler değişirken ton değişir.
**Ekran cümlesi:** "1.800 yıldır insanlar bu köprüden geçiyor. Bugün de geçiyorlar."
**Collectible:** 🌉 — değişmiyor.
**Teknik çözüm:** Mevcut üç NPC varlığı farklı opaklık ve renk tonlarıyla
dönem hissi verir. **Yeni kostüm modeli gerekmez — silüet yeter.**
**Yeni asset:** Hayır.
**Zorluk:** Orta.

#### 2. The Legendary Adana Kebab
`graybox_stall` · food · 🍢 a mini kebab skewer

**Öğrenme fikri:** Geniş şişte, kömür ateşinde pişer.

**Zaman Penceresi:** Kamera mangala iner. Közler kırmızı parlar, üstlerinden
duman kalkar. Şişler elle çevrilir — iki kez — ve her çevrilişte közden
kıvılcımlar fırlar. Yanda bir bardak mor şalgam suyu belirir.

**Kamera:** E1 — mangala yakın, közlerin hizasında.
**Görsel olay:** E10 köz parlaması (nabız) + E9 duman + kıvılcım parçacıkları.
**Ses:** cızırtı, kömür çıtırtısı, yelpaze.
**Ekran cümlesi:** "Geniş şiş, kömür ateşi ve yanında mor şalgam. Adana usulü böyle."
**Collectible:** 🍢 — değişmiyor.
**Teknik çözüm:** Köz = emissive düzlemler, nabız tween'i.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

#### 3. Orange Blossom Carnival
`graybox_flower` · nature · 🎉 carnival confetti

**Öğrenme fikri:** Her nisan bütün şehir portakal çiçeği kokar ve sokağa çıkar.

**Zaman Penceresi:** Kamera sokağa geniş açıyla bakar. Havadan portakal çiçeği
ve konfeti yağmaya başlar — yoğun ve renkli. Sokaktaki NPC'ler aynı anda
dans etmeye başlar (basit, ritmik bir yukarı-aşağı). Müzik yükselir.

**Kamera:** E1 — sokağa geniş açı, hafif yukarı.
**Görsel olay:** E8 — iki ayrı parçacık (beyaz çiçek + renkli konfeti) +
NPC'lerin ritmik hareketi.
**Ses:** davul-zurna temposu, kalabalık.
**Ekran cümlesi:** "Her nisan Adana portakal çiçeği kokar ve bütün şehir sokağa çıkar."
**Collectible:** 🎉 — değişmiyor.
**Teknik çözüm:** Kar sisteminin renk ve şekil parametreli hâli.
**Yeni asset:** Hayır.
**Zorluk:** Kolay.

---

## 4. Teknik mimari

### 4.1 Veri şekli

Zaman Penceresi tanımları **kanonik içeriğin yanına, ayrı bir dosyaya** gider.
Bu kritik: kanonik metin `index-html-canonical` otoritesine bağlı ve SHA ile
doğrulanıyor (D-205 ailesi). Zaman Penceresi türetilmiş içeriktir ve
kanonik dosyalara karışmamalıdır.

```
content/
  canonical/        ← dokunulmaz
  scenes/           ← üretilmiş
  timewindows/      ← YENİ
    istanbul.json
    kars.json
    ...
```

Kullanıcının önerdiği şekle yakın, ama ilkel adları sabit bir birlik tipiyle:

```jsonc
{
  "cityId": "istanbul",
  "windows": [
    {
      "stopId": "istanbul-stop-02",
      "duration": 9.0,
      "camera": { "kind": "pan", "target": "hotspot:2", "offset": [0, 14, 0], "ease": "inOutCubic" },
      "events": [
        { "at": 0.0, "do": "dim",     "to": 0.45 },
        { "at": 0.6, "do": "sound",   "cue": "wind" },
        { "at": 1.2, "do": "spawn",   "id": "hezarfen", "sprite": "wings", "at3d": "hotspot:2+top" },
        { "at": 1.4, "do": "move",    "id": "hezarfen", "curve": "arc", "to": [60, 6, -150], "seconds": 5 },
        { "at": 3.0, "do": "caption", "text": { "tr": "1632 — rivayete göre…", "en": "…" } },
        { "at": 7.5, "do": "despawn", "id": "hezarfen" },
        { "at": 8.0, "do": "dim",     "to": 0 }
      ],
      "reward": "collectible_istanbul_legend_wings"
    }
  ]
}
```

`do` alanı **kapalı bir birlik** olmalı (`zod` ile), çünkü açık bırakılırsa
63 durak 63 farklı ad üretir ve sistem tekrar kullanılabilir olmaktan çıkar.
Önerilen tam liste: `dim`, `sound`, `spawn`, `despawn`, `move`, `rotate`,
`scale`, `glow`, `particles`, `color`, `caption`, `trigger`.

### 4.2 Kod yerleşimi

| Dosya | İş |
|---|---|
| `src/content/schemas/timewindow.ts` | zod şeması, `do` birliği |
| `src/content/loaders/loadTimeWindows.ts` | şehir başına yükleme, sahne yüklemesiyle aynı desen |
| `src/engine/timewindow/clock.ts` | saf zamanlayıcı: `(elapsed, events) => aktif efektler`. **Saf fonksiyon, testlenebilir.** |
| `src/engine/timewindow/effects.ts` | her `do` için bir uygulayıcı |
| `src/components/three/TimeWindow.tsx` | `useFrame` ile saati ilerletir, efektleri sahneye uygular |
| `src/components/game-ui/CaptionOverlay.tsx` | ekran cümlesi |

### 4.3 Etkileşim makinesiyle ilişkisi

Mevcut `src/engine/interactions/machine.ts` durağa girince `FactCard` açıyor.
Yeni akış:

```
halkaya gir → 'timewindow' durumu → (kontroller kilitli, HUD gizli)
            → pencere biter → ödül verilir → 'idle'
```

`FactCard` **silinmez**. İki sebeple: Zaman Penceresi tanımı olmayan durak ona
düşer (63 durağın hepsi bir günde yazılmaz), ve "hareketi azalt" ayarı açık
olan çocuk için sinematik yerine kart gösterilmelidir. Bu, erişilebilirlik
gereği değil, mevcut `reducedMotion` ayarının zaten taşıdığı bir söz.

### 4.4 Test edilebilirlik

Bu projenin alışkanlığı, ekranda görülemeyen şeyi aritmetikle tutmaktır. Zaman
Penceresi için tutulacaklar:

- her pencerenin süresi 8–12 sn aralığında;
- son olay `duration`dan önce biter (sarkan efekt yok);
- `caption` en az 2.5 sn ekranda kalır ve en fazla 120 karakterdir;
- her `spawn` için bir `despawn` vardır;
- her pencerenin `reward`'ı o durağın kanonik ödülüyle aynıdır;
- kamera hedefi o sahnede gerçekten var olan bir nesnedir.

Sonuncusu en önemlisi: "kamera var olmayan bir şeye bakıyor" hatası ekran
görüntüsünde boş gökyüzü olarak çıkar ve sebebi anlaşılmaz.

---

## 5. Gereken yeni varlıkların toplu listesi

63 durağın **55'i yeni varlık istemiyor.** İstenen sekiz tanesi:

| # | Varlık | Tip | Durak | Tahmini boyut |
|---|---|---|---|---|
| 1 | Çift başlı kartal silüeti | PNG sprite | Erzurum 1 | ~20 KB |
| 2 | Kanatlı figür (Hezarfen) silüeti | PNG sprite | İstanbul 2 | ~25 KB |
| 3 | Yunus | küçük GLB veya sprite | İstanbul 5 | ~60 KB |
| 4 | Karagöz + Hacivat silüetleri | 2 PNG sprite | Bursa 2 | ~40 KB |
| 5 | Yavru caretta | küçük GLB | Muğla 3 | ~80 KB |
| 6 | Batık gemi iskeleti + balık sprite | GLB + PNG | Muğla 1 | ~150 KB |
| 7 | Hitit güneş kursu | küçük GLB | Ankara 2 | ~80 KB |
| 8 | Ankara keçisi | küçük GLB | Ankara 3 | ~150 KB |

Toplam **~605 KB**, ve beşi henüz kurulmamış şehirlerde (Bursa, Muğla ×2,
Ankara ×2) — yani bugün açık olan 13 şehir için gereken yeni varlık **sadece
üç tanedir ve toplamı ~105 KB**: iki silüet PNG'si ve bir yunus.

---

## 6. Sayısal üretim özeti

Aşağıdaki sayılar §7'deki tablodan sayılarak üretilmiştir, elle yazılmamıştır.

| Ölçü | Sayı |
|---|---|
| **Toplam durak** | **63** |
| Hiç yeni varlık gerekmeyen | **55** |
| Sprite/particle yeterli olan | 3 |
| Küçük GLB gerekenler | 5 |
| **Kolay** | **35** |
| **Orta** | **27** |
| **Zor** | **1** |

Tek "zor" Muğla 1'dir: kameranın su yüzeyinin altına inmesi, projenin ilk su
altı anı ve tek yeni kamera kipi. Diğer her şey mevcut sistemlerin
parametrelenmesidir.

**Bugün açık olan 13 şehir için** — 45 durak:

| Ölçü | Sayı |
|---|---|
| Durak | 45 |
| Hiç yeni varlık gerekmeyen | **42** |
| Sprite | 2 |
| Küçük GLB | 1 |
| Kolay / Orta / Zor | **25 / 20 / 0** |

Yani bugün elimizdeki şehirlerin tamamı için gereken yeni varlık **üç tanedir
(~105 KB) ve hiçbiri zor değildir.** Zorluk, henüz kurulmamış altı şehirde
toplanıyor ve o şehirler zaten sıfırdan yapılacak.

---

## 7. Özet tablo

| Şehir | Durak | Zaman Penceresi ana fikri | Yeni asset | Zorluk |
|---|---|---|---|---|
| Kars | Ani | hayalet kalabalık belirip söner | — | Orta |
| Kars | Doğu Ekspresi | tren karın içinden geçer | — | Kolay |
| Kars | Gravyer | tekerlek döner, boy kıyaslaması | — | Kolay |
| Erzurum | Çifte Minareli | taştaki kartal parlar | sprite | Orta |
| Erzurum | Palandöken | kayakçı zirveden iner, kar yoğunlaşır | — | Kolay |
| Erzurum | Oltu taşı | sürtülen taş kâğıdı çeker | — | Orta |
| Van | Van kedisi | gözler parlar, kedi suya girer | — | Orta |
| Van | Akdamar | duvardaki üç kabartma sırayla parlar | — | Orta |
| Van | Kahvaltı | tabaklar iner, masaya sığmaz | — | Kolay |
| Trabzon | Sümela | kamera sisin içinden uçuruma çıkar | — | Kolay |
| Trabzon | Horon | halka döner, tempo hızlanır | — | Orta |
| Trabzon | Kuymak | kaşık kalkar, peynir uzar | — | Kolay |
| Ordu | Fındık | fındık yağar, tepe olur | — | Kolay |
| Ordu | Teleferik | kamera kabinle birlikte yükselir | — | Kolay |
| Ordu | Sahil | gün batar, deniz turuncuya döner | — | Kolay |
| Bolu | Yedigöller | yaprak suya düşer, yansıma bozulur | — | Orta |
| Bolu | Mengen | buhar, aşçı külahları yükselir | — | Kolay |
| Bolu | Kartalkaya | sonbahar bir anda kışa döner | — | Orta |
| Mardin | Taş şehir | akşam olur, pencereler yanar | — | Orta |
| Mardin | Telkâri | gümüş tel kelebek çizer, uçar | — | Orta |
| Mardin | Çok inançlı şehir | üç yapı sırayla seslenir, güvercinler geçer | — | Kolay |
| Gaziantep | Zeugma | gözler kamerayı takip eder | — | Orta |
| Gaziantep | Baklava | kırk kat sayılır, çıtırtı | — | Kolay |
| Gaziantep | Bakırcılar | çekiç ritmi, kıvılcım | — | Kolay |
| Diyarbakır | Surlar | kamera boyunca uzayan siyah duvar | — | Kolay |
| Diyarbakır | On Gözlü | güneş kemerlerden geçer, on yansıma | — | Kolay |
| Diyarbakır | Karpuz | boy kıyaslaması, karpuz ikiye ayrılır | — | Orta |
| İstanbul | Ayasofya & Sultanahmet | çiniler çoğalıp havaya kalkar | — | Kolay |
| İstanbul | Galata | kanatlı silüet Boğaz'a uçar | sprite | Orta |
| İstanbul | Kapalıçarşı | lambalar derinlemesine yanar | — | Orta |
| İstanbul | Simitçi | martılar simide üşüşür | — | Kolay |
| İstanbul | Vapur | yunus zıplar, iki kıta kadrajda | GLB | Orta |
| Bursa | Yeşil Bursa | çiniden Uludağ'a açılma | — | Kolay |
| Bursa | Karagöz | perde arkasında iki kukla | 2 sprite | Orta |
| Bursa | İskender | tereyağı dökülür, cızırdar | — | Kolay |
| Balıkesir | Kaz Dağları | ışık huzmeleri, görünür temiz hava | — | Kolay |
| Balıkesir | Zeytin | pres döner, yağ akar, ağaç yaşlanır | — | Kolay |
| Balıkesir | Höşmerim | peynir tatlıya döner, buhar | — | Kolay |
| İzmir | Celsus | raflar ve rulolar bir an belirir | — | Orta |
| İzmir | Tiyatro | fısıltı dalgası en üste çıkar | — | Kolay |
| İzmir | Saat Kulesi | saat çalar, güvercinler havalanır | — | Kolay |
| İzmir | Nazarköy | boncuk turuncudan maviye döner | — | Orta |
| İzmir | Boyoz | hamur spiral açılır, Kordon geçer | — | Kolay |
| Muğla | Bodrum Kalesi | kamera suya dalar, batık görünür | GLB+sprite | **Zor** |
| Muğla | Ölüdeniz | paraşüt dağdan kumsala iner | — | Kolay |
| Muğla | Caretta | gece olur, yavrular denize yürür | GLB | Orta |
| Çanakkale | Truva Atı | atın içinden silüetler iner | — | Orta |
| Çanakkale | Gelibolu | denize karanfiller bırakılır, sessizlik | — | Kolay |
| Çanakkale | Peynir helvası | kaşık kalkar, buhar | — | Kolay |
| Nevşehir | Peribacaları | kaya aşınır, bacalar incelir | — | Kolay |
| Nevşehir | Balon | yüzlerce balon sırayla kalkar | — | Kolay |
| Nevşehir | Derinkuyu | kapı yuvarlanır, sekiz kat ışığı iner | — | Orta |
| Nevşehir | Çömlek | kil topağı testiye döner | — | Orta |
| Nevşehir | Halı | desen aşağıdan yukarı dolar | — | Kolay |
| Ankara | Anıtkabir | nöbetçiler tek senkron adım atar | — | Kolay |
| Ankara | Müze | vitrinler sırayla aydınlanır, kurs döner | GLB | Orta |
| Ankara | Angora | keçi ve kedi yan yana, gözler parlar | GLB | Orta |
| Antalya | Aspendos | boş basamaklar seyirciyle dolar | — | Orta |
| Antalya | Düden | su denize düşer, serpintide gökkuşağı | — | Orta |
| Antalya | Portakal | portakal düşer, altına döner | — | Kolay |
| Adana | Taşköprü | dönemler boyunca insanlar geçer | — | Orta |
| Adana | Kebap | köz parlar, kıvılcım, duman | — | Kolay |
| Adana | Karnaval | çiçek ve konfeti yağar, herkes dans eder | — | Kolay |

---

## 8. Üretim sırası önerisi

1. **Önce sistem, sonra içerik.** Şema + saat + beş ilkel (`focus`, `caption`,
   `sound`, `glow`, `particles`) ile İzmir Saat Kulesi yapılır. O durak
   bitince sistem kanıtlanmış olur ve geri kalanı veri girişidir.
2. **Sonra bedavalar.** Mevcut hareket sistemlerini tetikleyen sekiz durak:
   Kars/tren, Ordu/teleferik, Nevşehir/balon, İstanbul/simitçi,
   İzmir/saat, Mardin/güvercin, Trabzon/Sümela, Erzurum/Palandöken.
   **Sekiz durak, neredeyse sıfır yeni kod.**
3. **Sonra tek numaraya dayanan güçlüler:** Gaziantep/Zeugma gözleri,
   Nevşehir/peribacaları, Mardin/telkâri, Antalya/Aspendos.
4. **En son yeni varlık isteyenler** ve yapılmamış altı şehir.
