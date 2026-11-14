# Berkontribusi ke Kanvas Ajaib

Terima kasih sudah mau membantu. Masukan dari guru, orang tua, dan pemrogram sama berharganya.

## Tanpa menulis kode

Buka [isu baru](../../issues/new/choose) untuk melaporkan bug atau mengusulkan level gambar, teka-teki Nalar,
atau fitur. Ceritakan perangkat yang dipakai dan, bila bisa, sertakan tangkapan layar.

## Menjalankan dan menguji

Game ini tidak punya tahap build dan tidak memakai dependensi.

- Main: buka `index.html` di browser, atau sajikan folder ini dengan server statis
  (misalnya `python3 -m http.server`) agar mode PWA/offline aktif.
- Uji (Node 18 atau lebih baru):

  ```
  node tests/run.js
  node tests/run-art.js
  node tests/run-reason.js
  node tests/run-content.js
  ```

  atau `npm test`. Keempatnya dijalankan otomatis oleh GitHub Actions pada setiap pull request.

## Peta kode

| Berkas | Isi |
|---|---|
| `js/levels.js` | Data 55 arena: bentuk template, mode, animasi, toleransi |
| `js/scoring.js` | Penilaian gambar (murni, tanpa DOM) |
| `js/reason.js`, `js/puzzles.js` | Penilai matematis dan data Tantangan Nalar |
| `js/engine.js` | Kanvas berlapis, pointer, semua mode bermain, hantu duel |
| `js/main.js`, `js/screens.js` | Alur level dan semua layar |
| `js/storage.js`, `js/economy.js` | Simpanan, profil, koin, toko, lencana, Tantangan Harian |
| `js/art.js`, `js/audio.js`, `js/fx.js`, `js/icons.js` | Seni, ember cat, musik, efek, ikon dan Noko |
| `docs/GAME-DESIGN.md` | Dokumen desain: maksud setiap fitur dan kriteria penerimaan |

## Aturan

- Vanilla JS dengan skrip klasik dan namespace `KA` (tanpa ES module), supaya game tetap jalan saat
  `index.html` dibuka langsung dari berkas. Tanpa dependensi dan tanpa sumber daya dari luar.
- Teks antarmuka berbahasa Indonesia. Kalimat Noko 2 sampai 5 kata.
- Tanpa emoji di antarmuka; pakai ikon SVG dari `js/icons.js`.
- Skor harus jujur: coretan tidak boleh mendapat bintang. Bila mengubah `scoring.js` atau `reason.js`, pastikan
  uji coretan tetap lulus.
- Perilaku baru disertai uji di `tests/`.
- Naikkan `VERSION` di `sw.js` bila berkas aset berubah, supaya pemain mendapat versi baru.

## Menambah konten

- **Level gambar:** tambahkan entri di daftar pulau di `js/levels.js` (`name`, `mode`, `anim`, `paths` dalam
  koordinat 0 sampai 100). Uji otomatis memeriksa bahwa jiplakan sempurna mendapat 3 bintang, coretan 0 bintang,
  dan level Cermin benar-benar simetris.
- **Set soal Nalar:** tambahkan set baru di `sets` teka-teki terkait di `js/puzzles.js`. Setiap langkah butuh
  `answer`, tiga `hints`, dan `check`. `tests/run-content.js` memeriksa bahwa jawaban acuan dan jawaban bergetar
  lulus, dan coretan ditolak.

## Pull request

Satu perubahan per pull request, dengan penjelasan singkat apa dan mengapa. Isi daftar periksa di templat PR.

Dengan berkontribusi, Anda setuju kontribusi kode dilisensikan di bawah MIT dan kontribusi dokumentasi di bawah
CC BY 4.0.
