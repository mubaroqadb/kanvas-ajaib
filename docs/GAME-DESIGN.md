# Kanvas Ajaib v3: Desain Game

Kanvas Ajaib adalah game menggambar petualangan untuk anak **8 sampai 11 tahun**, berbasis HTML5
Canvas, berjalan offline penuh tanpa dependensi. Anak tidak sekadar menjiplak. Ia naik tangga
keterampilan menggambar, memecahkan teka-teki nalar matematis lewat gambar, dan setiap gambar
yang berhasil **menjadi hidup**.

---

## 1. Ringkasan

| Aspek | Keterangan |
|---|---|
| **Nama** | Kanvas Ajaib |
| **Target** | Anak 8 sampai 11 tahun (kelas 3 sampai 5 SD); orang tua dan guru sebagai pembaca laporan |
| **Platform** | Web / PWA (bisa dipasang, offline), juga jalan saat `index.html` dibuka langsung |
| **Genre** | Edukasi kreatif dan nalar, petualangan kasual |
| **Monetisasi** | Tidak ada. Gratis, tanpa iklan, tanpa akun online, data tetap di perangkat |

**Pitch.** Noko, si kuas ajaib, mengajak pemain berlayar ke lima pulau. Di setiap pulau
ada gambar yang tertidur dan teka-teki yang terkunci. Anak menggambar untuk membangunkan gambar
itu (ikan berenang, roket meluncur, matahari berputar) dan bernalar untuk membuka teka-tekinya.
Di ujung pulau, Hantu Skor menantang adu gambar.

---

## 2. Pilar Desain

1. **Garis-ku terlihat.** Setiap goresan direspons seketika: kilau, nada, getar halus, ekspresi Noko.
2. **Gagal tidak pernah membuat buntu.** Selalu ada jalan maju (Mode Bantu, petunjuk bertahap,
   hantu yang melemah), tanpa hukuman dan tanpa tekanan waktu yang dipaksakan.
3. **Karya adalah pemenangnya.** Gambar anak otomatis masuk Galeri, bisa diwarnai, dihidupkan,
   dipajang di Dinding Keluarga, dan diekspor.
4. **Skor yang jujur.** Skor hanya naik bila gambar memang mendekati bentuknya, dan teka-teki hanya
   lulus bila jawabannya benar. Coretan asal tidak boleh mendapat bintang.
5. **Umpan balik yang mengajar.** Anak melihat bagian mana yang terlewat dan mengapa jawabannya
   belum tepat, tidak hanya angka.
6. **Nalar lewat gambar.** Matematika hadir sebagai aksi menggambar dan mewarnai, tanpa kuis
   pilihan ganda yang terpisah dari permainan.
7. **Paham dalam 10 detik.** Ikon besar, suara, animasi, dan kalimat Noko 2 sampai 5 kata
   menggantikan paragraf instruksi.

---

## 3. Tangga Keterampilan (mode bermain)

Menjiplak menjadi anak tangga pertama. Anak 8 sampai 11 tahun berkembang lewat konstruksi bentuk,
ingatan visual, simetri, penalaran spasial dan bilangan, serta kreasi bebas.

| Mode | Yang dilihat anak | Keterampilan | Toleransi |
|---|---|---|---|
| **Tiru** | Template putus-putus utuh | Kontrol motorik halus | dasar |
| **Titik** | Hanya titik-titik di sepanjang bentuk | Menyambung arah, memperkirakan garis | dasar |
| **Langkah** | Bagian gambar muncul satu per satu; bagian berikutnya terbuka setelah bagian kini cukup tergambar | Konstruksi dari bentuk dasar, urutan menggambar | x1,1 |
| **Kilat** | Template tampil 3 detik lalu hilang | Ingatan visual | x1,35 |
| **Cermin** | Separuh kiri template dan garis sumbu; goresan otomatis dicerminkan | Simetri | dasar |
| **Nalar** | Teka-teki dari Noko yang dijawab dengan menggambar atau mewarnai (lihat bagian 6) | Penalaran spasial dan bilangan | per teka-teki |
| **Duel Hantu** | Template dan hantu menggambar bersamaan, bilah kemajuan keduanya | Presisi di bawah tantangan ringan | dasar |
| **Kanvas Bebas** | Kertas kosong dan kartu ide ("Gambar hewan kesukaanmu") | Kreasi | tanpa skor |

Aturan mode:
- Mode Cermin hanya dipakai pada template yang simetris kiri dan kanan (diuji otomatis).
- Mode ditetapkan per level di data level, tidak dari posisi urut.
- Tombol **Bantu aku** (template terang 4 detik, sekali per percobaan) tersedia di Tiru, Titik,
  Langkah, dan Cermin. Kilat memakai Lampu Noko; Duel tidak punya bantuan; Nalar memakai petunjuk
  bertahap.

---

## 4. Struktur Dunia: 5 Pulau x (10 level + Boss)

Setiap pulau berisi 8 level gambar, 2 level Nalar (posisi 4 dan 8), dan 1 boss, sehingga ada 55
arena. Pulau terbuka berurutan setelah boss pulau sebelumnya kalah. Di dalam pulau, level terbuka
bila level sebelumnya mendapat minimal 1 bintang. Setiap pulau punya kertas, warna aksen, dan lagu
sendiri.

| Pos | Kota Bentuk (kertas blueprint) | Hewan Sahabat (kertas rumput) | Rongsokan (kertas kraft) | Langit Ajaib (langit malam) |
|---|---|---|---|---|
| 1 | Bintang, Tiru, berkelip | Ikan, Tiru, berenang | Mobil, Tiru, melaju | Pelangi, Tiru, berkelip |
| 2 | Hati, Tiru, berdetak | Kucing, Langkah, bergoyang | Roket, Cermin, meluncur | Lentera, Cermin, melayang |
| 3 | Rumah, Langkah, meletup | Kepiting, Cermin, bergeser | Sepeda, Langkah, melaju | Unicorn, Langkah, melompat |
| 4 | **Nalar: Bangun Rahasia** | **Nalar: Hitung Loncat** | **Nalar: Peta Koordinat** | **Nalar: Pecahan Warna** |
| 5 | Matahari, Cermin, berputar | Burung, Titik, mengepak | Balon Udara, Cermin, melayang | Medali, Titik, berputar |
| 6 | Jendela, Titik, meletup | Siput, Tiru, merayap | Kapal, Titik, bergoyang | Komet, Kilat, terbang |
| 7 | Pesawat Kertas, Kilat, terbang | Kupu-kupu, Cermin, mengepak | Kereta, Kilat, melaju | Mahkota, Cermin, berkelip |
| 8 | **Nalar: Lipat Cermin** | **Nalar: Pola Berulang** | **Nalar: Geser dan Putar** | **Nalar: Luas Kotak** |
| 9 | Jembatan, Langkah, bergoyang | Landak, Kilat, merayap | Truk, Langkah, melaju | Kastel Awan, Langkah, melayang |
| 10 | Menara, Cermin, bergoyang | Penguin, Langkah, bergoyang | Helikopter, Kilat, terbang | Pegasus, Kilat, mengepak |
| Boss | Kastel | Naga | Robot Raksasa | Phoenix |

Pulau 5, **Dasar Laut** (kertas laut gelap bergelembung, terbuka setelah Phoenix kalah): Bintang Laut (Tiru,
berputar), Ubur-ubur (Cermin, melayang), Kuda Laut (Langkah, bergoyang), **Nalar: Simetri Putar**, Kerang (Cermin,
meletup), Penyu (Titik, merayap), Kapal Selam (Kilat, melaju), **Nalar: Keliling Pagar**, Paus (Langkah,
berenang), Mercusuar (Kilat, berkelip), dan boss Raja Gurita (target hantu 890).

Toleransi dasar menyempit pelan per pulau dan per level (pulau 1 paling longgar).

---

## 5. Sistem Skor Gambar

### 5a. Empat sub-skor yang ditampilkan

| Sub-skor | Arti bagi anak | Cara ukur |
|---|---|---|
| **Ketepatan** | "Tintaku ada di garis" | Proporsi tinta yang berada dalam toleransi dari garis template dan searah dengan garis itu |
| **Kelengkapan** | "Semua garis sudah kugambar" | Cakupan tiap bagian template (kuadrat cakupan per bagian, berbobot panjang); tinta hanya menutup bagian template yang terdekat |
| **Kerapian** | "Tidak bolak-balik menebalkan" | Rasio panjang tinta terhadap panjang template; bebas sampai 1,6 kali, lalu turun |
| **Kelancaran** | "Garisku mulus" | Getaran goresan (simpangan titik dari rata-rata tetangganya) |

Waktu tidak masuk skor. Lama menggambar tetap dicatat untuk laporan. Penghitung waktu disembunyikan
secara bawaan dan bisa dinyalakan di Pengaturan.

### 5b. Rumus

- **Inti** adalah rata-rata harmonik Ketepatan dan Kelengkapan, jadi keduanya harus tinggi.
  Mencoret seluruh kanvas (kelengkapan tinggi, ketepatan rendah) dan menggambar separuh saja
  (ketepatan tinggi, kelengkapan rendah) sama-sama gagal.
- **Skor (0 sampai 1000)** = Inti pangkat 1,5 x (0,75 + 0,125 Kerapian + 0,125 Kelancaran) x 1000.
- **Zona Sempurna:** minimal 50% tinta sangat dekat garis (setengah toleransi) dan Ketepatan minimal
  85%. Hadiahnya kilau emas dan bonus koin; skor tidak melewati 1000.
- **Grade:** S mulai 950, A mulai 850, B mulai 700, C mulai 550, D di bawahnya.
- **Bintang:** 1 bintang mulai 550, 2 bintang mulai 750, 3 bintang mulai 900.

### 5c. Peta Ketepatan

Layar hasil menampilkan template yang diwarnai per titik: hijau (tepat), kuning (dekat), merah
(terlewat), dengan goresan anak samar di atasnya. Noko menyebut jumlah bagian yang belum lengkap
("2 bagian masih merah!").

### 5d. Streak goresan

Goresan yang minimal 60% tintanya tepat menaikkan pengali dari x1,0 sampai x2,0 (untuk perayaan dan
lencana). Goresan liar mereset dengan suara lembut.

---

## 6. Tantangan Nalar

Sepuluh teka-teki, dua per pulau, dengan topik yang naik bertahap. Setiap teka-teki punya **tiga set
soal** yang dipakai bergiliran: percobaan ke-n memakai set ke-(n mod 3), sehingga mengulang teka-teki selalu
memberi soal baru dengan topik yang sama. Jawaban selalu diberikan lewat
menggambar atau mewarnai, lalu diperiksa oleh penilai matematis. Banyak teka-teki menerima lebih dari
satu jawaban benar.

| Pulau | Teka-teki | Yang dilakukan anak | Yang diperiksa |
|---|---|---|---|
| Kota Bentuk | **Bangun Rahasia** (sifat bangun datar) | Noko memberi tiga teka-teki berurutan di kertas berkisi: "3 sisi, 3 sudut", "4 sisi sama panjang, semua sudut siku", "4 sisi, sepasang-sepasang sejajar, tidak ada sudut siku" | Bangun tertutup, jumlah sisi, panjang sisi, sudut siku, kesejajaran |
| Kota Bentuk | **Lipat Cermin** (simetri lipat) | Separuh gambar dan sumbu tampil; anak menggambar separuh lainnya sendiri tanpa cermin otomatis. Soal kedua bersumbu mendatar | Ketepatan terhadap separuh yang hilang |
| Hewan Sahabat | **Hitung Loncat** (pola bilangan) | Titik-titik bernomor, termasuk pengecoh. Anak menghubungkan kelipatan 2 berurutan, lalu kelipatan 3; hewan muncul bila urutannya benar | Urutan titik yang disinggahi, pengecoh tidak tersentuh |
| Hewan Sahabat | **Pola Berulang** (pola bentuk) | Barisan bentuk (lingkaran, segitiga, persegi, ...) dengan dua kotak kosong di ujung; anak menggambar bentuk yang benar di tiap kotak | Jenis bentuk yang digambar di tiap kotak |
| Rongsokan | **Peta Koordinat** | Kertas berkisi bersumbu 0 sampai 10 dan kartu pasangan koordinat berurutan; anak menghubungkannya dan kendaraan muncul | Titik yang disinggahi (simpangan maksimal 0,4 kotak) dan urutannya |
| Rongsokan | **Geser dan Putar** (transformasi) | Bentuk contoh dan perintah "geser 3 kotak ke kanan" lalu "putar seperempat putaran searah jarum jam"; anak menggambar hasilnya | Ketepatan terhadap template hasil transformasi |
| Langit Ajaib | **Pecahan Warna** | Lingkaran terbagi 4 juring dan persegi panjang terbagi 6 petak; perintah "warnai 3/4" lalu "warnai 2/3" dengan ember cat | Luas yang terwarnai (toleransi 5%), kombinasi bagian mana pun diterima |
| Dasar Laut | **Simetri Putar** | Bentuk berlengan (kincir, bintang laut, baling-baling, bunga, kepingan salju) tampil dengan satu atau dua lengan hilang; anak menggambar lengan yang hilang | Ketepatan terhadap lengan hasil putaran 360/n derajat |
| Dasar Laut | **Keliling Pagar** | "Gambar persegi panjang yang kelilingnya 14 kotak" di kertas berkisi; setelah benar Noko bertanya "Ada cara lain?" | Bangun persegi panjang dan kelilingnya; jawaban kedua harus berbeda ukuran |
| Langit Ajaib | **Luas Kotak** | "Gambar persegi panjang yang luasnya 12 kotak" di kertas berkisi; setelah benar Noko bertanya "Ada cara lain?" | Bangun persegi panjang dan luasnya; jawaban kedua harus berbeda ukuran |

### 6a. Bintang Nalar

- **1 bintang:** jawaban benar, dengan atau tanpa petunjuk.
- **2 bintang:** benar tanpa petunjuk.
- **3 bintang:** benar tanpa petunjuk dan gambarnya rapi (Inti skor gambar minimal 0,85 untuk
  teka-teki bergambar), atau menemukan jawaban kedua pada Luas Kotak.

Level Nalar tidak bisa lulus dengan coretan. Jawaban salah tidak pernah lulus, serapi apa pun
gambarnya.

### 6b. Umpan balik dan petunjuk

- Jawaban salah dijawab Noko dengan alasan yang spesifik dari penilai: "Sisinya ada 5, coba hitung
  lagi", "Nomor 8 terlewat", "Baru 2/4 yang berwarna".
- Petunjuk bertahap tiga tingkat: (1) kalimat Noko, (2) bantuan visual (sorot titik berikutnya,
  tampilkan sumbu, sorot kotak satuan), (3) sebagian jawaban ditunjukkan. Memakai petunjuk membatasi
  hasil maksimal 1 bintang.
- Tiga jawaban salah pada satu langkah mengakhiri percobaan tanpa bintang; gambar dan alasan tetap
  terlihat sampai anak mencoba lagi. Langkah opsional (jawaban kedua Luas Kotak) cukup dilewati.
- Mode Bantu (setelah 2 percobaan gagal) langsung mengaktifkan petunjuk tingkat 2.

### 6c. Penilai matematis

- Goresan yang bersambung digabung, disederhanakan menjadi poligon, dan bila kertasnya berkisi titik
  sudutnya ditempelkan ke titik kisi terdekat.
- Dari poligon dihitung: tertutup atau tidak, jumlah sisi dan sudut, panjang sisi dalam satuan
  kotak, sudut siku (toleransi 12 derajat), sisi sejajar, dan luas.
- Pengenal bentuk dasar untuk Pola Berulang: lingkaran (tertutup, tanpa sudut, bulat), segitiga,
  persegi, dan persegi panjang.
- Luas isian ember cat dihitung dari piksel area terisi dibanding luas bangunnya.
- Template Geser dan Putar dibuat dengan mentransformasikan template asal.

---

Set soal tambahan per topik: Bangun Rahasia (segitiga siku-siku, persegi panjang bukan persegi, trapesium;
belah ketupat, segi lima, segi enam), Lipat Cermin (roket dan panah; mahkota dan daun), Hitung Loncat
(kelipatan 4 dan 5; mulai dari 10 dan kelipatan 10), Pola Berulang (pola AB dan ABB; AAB dan ABC), Peta
Koordinat (rumah dan ikan; layang-layang dan pohon), Geser dan Putar (geser ke bawah dan putar berlawanan arah;
geser ke kiri dan setengah putaran), Pecahan Warna (5/8 dan 3/4; 1/2 dan 2/3 dari 9 petak), Luas Kotak (16 dan
18 kotak), Keliling Pagar (16 dan 12 kotak), Simetri Putar (3 dan 6 lengan; 4 dan 6 lengan).

## 7. Tantangan Harian

- Setiap hari ada satu level gambar yang sudah terbuka, dimainkan dengan pelintiran: **Dari Ingatan** (mode
  Kilat), **Sambung Titik** (mode Titik), **Cermin** (hanya untuk template simetris), atau **Sempurna** (mode
  asal, target 3 bintang). Pelintiran tidak pernah sama dengan mode asal level.
- Pilihan ditentukan dari tanggal lalu dibekukan di profil saat pertama dibuka hari itu, sehingga tidak berubah
  ketika level baru terbuka di tengah hari.
- Target 2 bintang (Sempurna: 3 bintang). Hadiah sekali per hari: 40 koin + 5 per hari beruntun (maksimal +30).
  Hari beruntun bertambah bila kemarin juga tuntas, dan kembali ke 1 bila ada hari yang bolong.
- Hasil harian tidak mengubah rekor atau bintang level asal; karyanya tetap masuk Galeri.
- Kartu Tantangan Harian tampil di beranda (level, pelintiran, target, status, hari beruntun).

## 8. Gagal Tidak Membuat Buntu

- **Mode Bantu.** Setelah 2 percobaan beruntun tanpa bintang di level yang sama, layar hasil
  menawarkan Mode Bantu. Untuk level gambar: template tetap terang, toleransi x1,5, dan percobaan
  yang jujur (Inti minimal 0,6) dijamin 1 bintang, dengan hasil maksimal 2 bintang supaya tetap ada
  alasan mencoba versi biasa. Untuk Nalar: petunjuk tingkat 2 langsung aktif.
- **Hantu melemah.** Setiap kekalahan beruntun di boss menurunkan target skor hantu 40 poin (batas
  bawah 680). Noko: "Hantunya mulai lelah!"
- Tombol **Lanjut** terbuka begitu level mendapat 1 bintang, dari mode apa pun.

---

## 9. Duel Hantu (boss)

- Setelah hitung mundur, hantu dan pemain menggambar bersamaan. Jejak hantu ungu tampil di bawah
  template, dan dua bilah kemajuan (Hantu dan Kamu) mengukur kelengkapan secara langsung.
- Hantu awal disintesis dari template dengan getaran manusiawi yang deterministik per level. Skor
  hantu adalah skor sebenarnya dari goresan hantu itu, dikalibrasi ke target per pulau: 760, 800,
  840, 870.
- Setelah boss dikalahkan, hantu tantangan ulang adalah rekaman percobaan terbaik pemain sendiri
  (titik dan waktu).
- Menang bila skor pemain menyamai atau melampaui skor hantu. Selesai sebelum hantu selesai
  menggambar memberi bonus **Secepat Hantu** (koin dan lencana). Kura-kura Waktu memperlambat hantu
  15% sehingga bonus ini lebih mudah didapat; skor hantu tidak berubah.
- Tidak ada batas waktu paksa.

---

## 10. Gambar yang Hidup

Setelah lulus (minimal 1 bintang atau menang duel), kanvas menampilkan sihir sekitar 2,4 detik:
goresan anak sendiri bergerak sesuai jenis gambar (berkelip, berdetak, berenang, terbang, melaju,
mengepak, berputar, bergoyang, merayap, melayang, meletup, melompat), disertai kilau dan nada ajaib.
Teka-teki Nalar yang terjawab juga menghidupkan gambar hasilnya (hewan dari Hitung Loncat,
kendaraan dari Peta Koordinat). Di Galeri, mengetuk karya memutar animasinya lagi. Pengguna dengan
pengaturan kurangi gerak hanya mendapat kilau tanpa gerak.

---

## 11. Warnai, Buku Mewarnai, Stiker, Kanvas Bebas, Galeri

- **Warnai.** Dari layar hasil atau dari Galeri: ember cat (isi area tertutup) dengan palet pastel,
  stiker (bila dimiliki), dan urungkan. Isian disimpan sebagai titik benih sehingga karya bisa
  dirender ulang di ukuran apa pun.
- **Buku Mewarnai.** Setiap level gambar yang sudah lulus membuka satu halaman mewarnai berisi garis template
  level itu. Halaman diwarnai dengan ember cat dan stiker, lalu disimpan ke Galeri sebagai karya Mewarnai.
- **Kanvas Bebas.** Kertas kosong (atau kertas dari toko), kartu ide acak, semua pensil dan stiker
  yang dimiliki, dan ember cat. Tanpa skor.
- **Galeri.** Setiap level gambar yang lulus otomatis tersimpan (skor, bintang, efek pensil, isian, stiker),
  maksimal 30 karya per profil; karya yang dipajang tidak ikut terhapus otomatis. Aksi: putar
  animasi, warnai, pajang ke Dinding, unduh PNG, hapus (dengan konfirmasi).
- **Dinding Keluarga.** Sampai 6 karya pilihan tampil di beranda.

---

## 12. Ekonomi Koin

### 12a. Pemasukan

| Sumber | Koin |
|---|---|
| Level pertama kali lulus | skor dibagi 10 (Nalar: 30 per bintang) |
| Percobaan tanpa bintang | 5 (koin semangat) |
| Ulang dan memecahkan rekor pribadi | 10 + selisih rekor dibagi 5 |
| Ulang tanpa rekor baru | 2 |
| Zona Sempurna | +10 |
| Menang boss / Secepat Hantu | +50 / +20 |
| Bonus harian (pertama membuka game hari itu, di beranda) | +50 |
| Tantangan Harian tuntas (sekali per hari) | 40 + 5 x (hari beruntun - 1), maksimal 70 |
| Jalan Bintang (30 tingkat, tiap 3 bintang) | 15 + 5 x tingkat |

### 12b. Toko Noko dengan slot pakai terpisah

Barang dibagi per slot, sehingga membeli satu barang tidak pernah melepas barang di slot lain.
Barang bantuan bersifat pasif dan aktif bila dimiliki.

| Slot | Barang (harga koin) |
|---|---|
| Pensil | Andalan (0), Neon 120, Kuas Tebal 150, Pelangi 250, Kilau 400 |
| Topi Noko | Topi Pelaut 200, Kacamata 250, Syal 300, Topi Penyihir 500, Mahkota 600 |
| Kertas (Kanvas Bebas) | Blueprint 150, Rumput 150, Langit Malam 200 |
| Stiker | Bintang dan Hati 200, Alam 350, Langit 450 |
| Musik | Kotak Musik: Lagu Ombak 300, Lagu Hutan 300, Lagu Bintang 300 |
| Bantuan (pasif) | Lampu Noko 300 (Kilat: 1 kedipan ekstra), Kura-kura Waktu 350 (hantu 15% lebih lambat) |

Total isi toko sekitar 5.800 koin, sebanding dengan pemasukan satu kali tamat (sekitar 6.500),
sehingga koin tetap bermakna sampai Pulau 4. Tidak ada barang yang menaikkan skor atau menjawab
teka-teki.

---

## 13. Progres Jangka Panjang

- **Jalan Bintang:** 30 tingkat, bilahnya selalu tampil di beranda.
- **Lencana (22)** dalam empat cabang. Lencana hanya dihitung dari percobaan yang mendapat minimal 1
  bintang, dan lencana boss dihitung per pulau (tidak dari jumlah kemenangan).
  - Presisi: Goresan Pertama, Penakluk Garis (3 level berbintang), Tangan Steady (streak x2),
    Perfectionis (grade S), Maestro Kanvas (2 bintang di semua level gambar).
  - Petualang: Pelaut Berani (boss 1), Sang Naga (boss 2), Pemburu Robot (boss 3), Legenda Langit
    (boss 4), Penguasa Laut (boss 5), Secepat Hantu, Bintang 90, Rajin Harian (Tantangan Harian 5 hari
    beruntun).
  - Kreatif: Kolektor Warna (6 warna dalam 1 gambar), Arsitek Cermin (5 level Cermin berbintang),
    Ilmuwan Ingatan (5 level Kilat berbintang), Pewarna (mewarnai 5 karya), Pelukis Bebas (3 karya
    bebas), Kurator (10 karya), Dermawan (memajang 1 karya di Dinding).
  - Nalar: Pemikir Cilik (8 teka-teki Nalar berbintang), Tanpa Petunjuk (5 teka-teki Nalar dengan
    minimal 2 bintang).
- Setiap lencana baru selalu diumumkan, dari mana pun asalnya.

---

## 14. Profil Keluarga dan Laporan

- **Profil:** sampai 4 profil lokal (nama dan warna Noko). Progres, koin, toko, galeri, dan catatan
  percobaan terpisah per profil. Pengaturan (suara, getar, gerak) berlaku per perangkat.
- **Papan Keluarga:** bintang dan jumlah grade S/A per pulau untuk tiap profil, tanpa peringkat
  waktu.
- **Laporan Orang Tua dan Guru:** dibuka lewat gerbang dewasa (soal perkalian). Isinya waktu
  bermain, jumlah percobaan, level tuntas, tren skor, rata-rata keempat sub-skor (10 percobaan awal
  dibanding 10 terakhir), ingatan visual (Kelengkapan di Kilat), simetri (skor Cermin), kelancaran
  goresan, dan **Penalaran** per topik Nalar (benar pada percobaan pertama, petunjuk yang dipakai,
  jumlah percobaan).
- **Ekspor:** CSV catatan percobaan untuk guru atau peneliti, dan cadangan JSON profil (bisa
  dipulihkan). Data tidak pernah dikirim ke mana pun.

Catatan per percobaan berisi waktu, level, mode, dibantu atau tidak, durasi, skor, bintang, keempat
sub-skor, jumlah goresan, rasio tinta, dan untuk Nalar: benar atau salah, tingkat petunjuk, serta
alasan salah dari penilai. Disimpan 300 percobaan terakhir per profil. Bila dipakai untuk
penelitian, pengumpulan data memerlukan persetujuan orang tua dan izin etik lembaga; game ini hanya
menyediakan ekspor lokal.

---

## 15. Karakter, Visual, Audio

- **Noko:** kuas bermata besar dengan 3 ekspresi (senang, wow, oops) dan gelembung kalimat 2 sampai
  5 kata. Muncul di beranda, pojok kanvas, layar hasil, dan kartu pembuka pulau (sekali per pulau).
  Memakai topi dari toko. Di level Nalar, Noko yang membacakan teka-teki.
- **Kanvas:** selalu di tengah, dengan kertas sesuai pulau (kertas berkisi untuk teka-teki yang
  membutuhkan satuan kotak). Goresan dihaluskan, tajam di layar retina, dan sentuhan telapak tangan
  ditolak saat sedang menggambar.
- **Pena:** 3 ukuran yang cukup tipis untuk detail kecil (mata, jendela).
- **Hapus semua:** butuh ketukan kedua untuk konfirmasi; ikonnya tempat sampah.
- **Audio:** WebAudio sintetis yang dijadwalkan pada jam audio agar tidak tersendat. Ada lagu per
  pulau (5 lagu) dan Kotak Musik, serta SFX pena, kilau, bagian selesai, sihir hidup, ember cat, stiker,
  bintang, jawaban benar, dan fanfare.
- **Aksesibilitas:** target sentuh minimal 44 px, label pembaca layar pada warna dan tombol ikon,
  kontras AA, pengaturan kurangi gerak (mengikuti sistem atau manual), getar opsional, toast yang
  membungkus teks di layar sempit, dan font bulat bawaan sistem tanpa unduhan.
- **Tanpa emoji** di antarmuka; semua penanda visual memakai ikon SVG garis.

---

## 16. Arsitektur Teknis

```
(akar repo)
  index.html            shell, layar, modal
  manifest.webmanifest  PWA
  sw.js                 cache offline (aktif bila disajikan lewat http/https)
  icon.svg
  css/style.css         tema per pulau lewat custom properties
  js/
    storage.js          v4: profil, pengaturan, migrasi v2/v3 ke v4
    audio.js            penjadwal musik dan SFX
    fx.js               partikel, konfeti
    icons.js            ikon SVG, Noko, stiker
    levels.js           data arena, mode, animasi, geometri turunan
    scoring.js          evaluasi gambar (murni) dan cakupan langsung
    reason.js           penilai Nalar: poligon, sifat bangun, pengenal bentuk, koordinat, pecahan, luas
    puzzles.js          data dan alur 10 teka-teki Nalar, masing-masing 3 set soal
    economy.js          toko berslot, koin, lencana, Jalan Bintang
    art.js              render karya, ember cat, ekspor PNG
    engine.js           kanvas berlapis, pointer, mode, hantu
    screens.js          beranda, toko, galeri, lencana, profil, laporan, pengaturan
    main.js             alur level, hasil, warnai, bebas, boot
  tests/                uji penerimaan (node tests/run.js)
```

- Vanilla JS dengan skrip klasik dan namespace `KA` (tidak memakai ES module) supaya game tetap jalan
  saat `index.html` dibuka langsung dari berkas.
- `engine` tidak memanggil UI langsung; ia memberi kabar lewat callback.
- `scoring` dan `reason` murni (tanpa DOM) sehingga bisa diuji di Node.
- Save ber-versi (`kanvasAjaib.v4`) dengan migrasi; progres lama dipetakan ke urutan level baru
  berdasarkan nama level.


---

## 17. Kriteria Penerimaan (`node tests/run.js`)

Gambar:
1. Coretan yang menutupi kanvas (zigzag, spiral, lingkaran konsentris, kisi, jalan acak) mendapat
   0 bintang di semua level gambar.
2. Jiplakan sempurna mendapat 3 bintang di semua level gambar, pada setiap mode.
3. Jiplakan dengan getaran tangan sedang mendapat minimal 2 bintang di setiap level gambar.
4. Menggambar separuh panjang template menghasilkan maksimal 1 bintang.
5. Menebalkan garis bolak-balik (tinta 4 kali panjang template) menurunkan Kerapian di bawah 50.
6. Setiap level Cermin simetris; menjiplak separuh kiri saja (dicerminkan) menghasilkan 3 bintang;
   template separuh tidak mengandung titik potong palsu.
7. Duel: skor hantu sintetis berada dalam 40 poin dari target pulaunya dan deterministik.

Progres dan data:
8. Tab Pulau 2 terbuka setelah boss Pulau 1 kalah; menang boss Pulau 1 empat kali hanya memberi satu
   lencana boss.
9. Membeli Lampu Noko tidak melepas pensil yang sedang dipakai.
10. Migrasi save v3 ke v4 mempertahankan koin, barang, dan bintang (dipetakan ke level yang sama
    namanya).
11. Mode Bantu menjamin 1 bintang untuk percobaan jujur dan membatasi hasil maksimal 2 bintang.
12. Ember cat berhenti di batas goresan dan tidak bocor bila bentuknya tertutup.

Nalar:
13. Penilai sifat bangun: segitiga gambaran tangan dengan getaran sedang dikenali bersisi 3; persegi
    4 x 4 kotak dikenali sebagai persegi; jajargenjang dikenali tidak bersudut siku; segi lima
    ditolak untuk teka-teki segi empat.
14. Luas Kotak: persegi panjang 3 x 4 dan 2 x 6 diterima, 3 x 3 dan 2 x 5 ditolak; jawaban kedua
    yang sama ukurannya dengan jawaban pertama tidak dihitung.
15. Hitung Loncat dan Peta Koordinat: urutan benar lulus; melompati titik atau menyinggahi pengecoh
    tidak lulus dan alasan salahnya menyebut nomor atau koordinat yang bermasalah.
16. Pecahan Warna: 3 dari 4 juring dengan kombinasi mana pun diterima; 2 dari 4 ditolak.
17. Geser dan Putar: jiplakan sempurna template hasil transformasi lulus; gambar di posisi awal
    (tanpa digeser atau diputar) tidak lulus.
18. Pola Berulang: lingkaran, segitiga, dan persegi gambaran tangan dikenali dengan benar; coretan
    tidak dikenali sebagai bentuk apa pun.
19. Coretan di level Nalar mana pun tidak pernah lulus.

Konten v3.2 (`node tests/run-content.js`):
20. Semua set soal (10 teka-teki x 3 set): jawaban acuan dan jawaban bergetar lulus, coretan ditolak.
21. Pulau 5 berisi 11 arena; hantu Raja Gurita dalam 40 poin dari 890; pulau terkunci sebelum boss 4 kalah.
22. Tantangan Harian deterministik per tanggal, dibekukan sepanjang hari, pelintirannya valid, dan jiplakan
    sempurna selalu 3 bintang (diuji 120 hari).
23. Hadiah harian hanya sekali per hari dan hanya bila target tercapai; hari beruntun bertambah dan kembali ke 1
    setelah hari bolong; 5 hari beruntun memberi lencana Rajin Harian.
