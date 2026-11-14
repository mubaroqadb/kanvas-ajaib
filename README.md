# Kanvas Ajaib

Game menggambar petualangan untuk anak 8 sampai 11 tahun. Anak menggambar di lima pulau, memecahkan teka-teki
nalar matematis lewat gambar, dan setiap gambar yang berhasil menjadi hidup.

**Main sekarang:** https://mubaroqadb.github.io/kanvas-ajaib/

## Isi

- 55 arena di 5 pulau: level gambar (Tiru, Titik, Langkah, Kilat, Cermin), Tantangan Nalar, dan Duel Hantu.
- Tantangan Nalar: sifat bangun datar, simetri lipat dan putar, pola bilangan dan bentuk, koordinat,
  transformasi, pecahan, luas, dan keliling. Setiap teka-teki punya tiga set soal.
- Tantangan Harian, Buku Mewarnai, Kanvas Bebas, Galeri, dan Dinding Keluarga.
- Profil keluarga (sampai 4 anak) dan laporan untuk orang tua atau guru, dengan ekspor CSV.

## Menjalankan

Buka `index.html` langsung di browser, atau sajikan folder ini lewat server statis apa pun. Lewat http/https,
game bisa dipasang sebagai aplikasi (PWA) dan berjalan offline.

Tanpa dependensi, tanpa akun, tanpa iklan. Semua data tersimpan di perangkat.

## Uji

```
npm test
```

Menjalankan empat paket uji Node (skor gambar, seni dan audio, penilai Nalar, konten). Uji yang sama berjalan
otomatis di GitHub Actions.

## Berkontribusi

Masukan dan perbaikan sangat diterima, baik dari guru dan orang tua maupun pemrogram. Laporkan bug atau usulkan
level dan teka-teki lewat [isu](../../issues), atau kirim pull request. Baca [CONTRIBUTING.md](CONTRIBUTING.md)
dan [dokumen desain](docs/GAME-DESIGN.md) lebih dulu.

## Lisensi

Kode dilisensikan di bawah [MIT](LICENSE). Dokumentasi di `docs/` dilisensikan di bawah
[CC BY 4.0](docs/LICENSE.md).
