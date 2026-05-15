# BALI INK HUB

BALI INK HUB adalah prototype marketplace jasa tattoo artist khusus area Bali. Project ini dibuat sebagai static web app ringan dengan HTML, CSS, Vanilla JavaScript, dan JSON dummy database. Fokus utamanya adalah pengalaman marketplace: client dapat mencari jasa tattoo, melihat artist, masuk ke halaman studio artist, membandingkan service, dan booking service melalui platform.

## Tech Stack

- HTML5
- CSS custom
- Vanilla JavaScript ES6 Modules
- JSON dummy database
- Static hosting ready
- Tanpa React, Laravel, jQuery, Bootstrap, atau framework berat

## Struktur Project

```text
BALI INK HUB/
├── index.html
├── studio.html
├── README.md
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── images/
│   │   └── logo.png
│   └── js/
│       ├── assistant.js
│       ├── main.js
│       └── studio.js
└── data/
    └── marketplace.json
```

## Halaman

- `index.html`
  Homepage marketplace berisi hero search, kategori, featured services, popular services, artist list, cara kerja, reviews, dan CTA join artist.

- `studio.html?id=art-01`
  Halaman studio artist seperti store page pada marketplace jasa. Halaman ini membaca artist berdasarkan query parameter `id`.

## Fitur Utama

- Search tattoo service berdasarkan keyword, area, dan style
- Filter cepat dari popular search dan kategori
- Featured tattoo services
- Popular services dengan tab style
- Recommended dan featured artist
- Tombol `View Studio` pada card artist
- Artist studio page
- Marketplace booking modal
- Floating Devs AI assistant widget
- Reviews
- Availability preview
- Booking policies
- Responsive mobile layout

## Devs AI Assistant

Widget chat floating tersedia di `index.html` dan `studio.html` melalui:

```text
assets/js/assistant.js
```

Widget dapat dibuka dari icon floating kanan bawah atau tombol `AI Assistant`. Devs membaca dummy database internal untuk membantu menjawab rekomendasi artist, style, estimasi harga, booking service, payment flow, dan aftercare dasar.

## Artist Studio Page

Halaman studio artist memiliki:

- Studio profile hero
- Artist bio
- Rating dan completed bookings
- Area, style, experience, response time
- Service packages
- Portfolio gallery
- Availability preview
- Client reviews
- Booking policies
- Booking service melalui platform marketplace

Tidak ada CTA WhatsApp atau call langsung ke artist karena flow booking diarahkan sepenuhnya ke platform.

## Data Dummy

Semua data marketplace ada di:

```text
data/marketplace.json
```

Data berisi:

- `areas`
- `styles`
- `categories`
- `services`
- `artists`
- `reviews`

Service terhubung ke artist menggunakan field:

```json
"artistId": "art-01"
```

Studio page membaca artist dari URL:

```text
studio.html?id=art-01
```

## Cara Menjalankan Lokal

Karena project menggunakan `fetch()` untuk membaca JSON, jangan buka `index.html` langsung dengan double click. Jalankan melalui local server.

Contoh:

```bash
python -m http.server 3000
```

Lalu buka:

```text
http://localhost:3000/index.html
```

Contoh studio:

```text
http://localhost:3000/studio.html?id=art-01
```

## Deploy

Project ini siap dihosting di static hosting seperti:

- Hostinger static hosting
- Netlify
- Vercel static output
- GitHub Pages
- Cloudflare Pages

Upload semua file dan folder ke root hosting:

```text
index.html
studio.html
assets/
data/
README.md
```

## Catatan Pengembangan Lanjutan

Project ini sudah disiapkan agar mudah dikembangkan ke backend di masa depan:

- Replace `data/marketplace.json` dengan REST API
- Tambahkan auth client, artist, dan admin
- Tambahkan booking database
- Tambahkan payment/deposit flow
- Tambahkan artist dashboard
- Tambahkan admin verification system
- Tambahkan upload portfolio
- Tambahkan review submission

## Brand Style

Tema visual:

- Black base
- Dark brown ornament
- Luxury gold accent
- Marketplace jasa modern
- Premium tattoo studio feel

Logo utama berada di:

```text
assets/images/logo.png
```
