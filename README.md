# Dokumentasi Integrasi API LK21 (Client-Side)

Dokumen ini berisi panduan cara memanggil endpoint API, struktur respon, dan cara mengintegrasikan **Slot Iklan** serta **Logic Download** di sisi Frontend.

## 🔗 Base URL

Secara default (Localhost):
```
http://localhost:3000/api
```

---

## 📦 Struktur Standar Response

Setiap request sukses akan mengembalikan format JSON yang seragam. Frontend **wajib** membaca objek `ads` untuk menampilkan iklan dinamis.

```json
{
  "status": "success",
  "message": "Pesan sukses...",
  "ads": {
    "enabled": true,
    "banner": "<a href='...'><img src='...'></a>",
    "social_bar": "<script>...</script>",
    "smartlink": "https://direct-link.net/..."
  },
  "data": {
    // Data Film / Hasil Search ada di sini
  }
}
```

---

## 📡 Daftar Endpoint

### 1. Halaman Utama (Home)
Mengambil data slider, film terbaru, dan series terbaru.

* **URL:** `/home`
* **Method:** `GET`
* **Contoh Request:**
    ```http
    GET http://localhost:3000/api/home
    ```

### 2. Pencarian (Search)
Mencari film berdasarkan judul.

* **URL:** `/search`
* **Method:** `GET`
* **Parameter:** `q` (Kata kunci URL Encoded)
* **Contoh Request:**
    ```http
    GET http://localhost:3000/api/search?q=spider+man
    ```

### 3. Kategori & Arsip (Genre/Tahun/Negara)
Mengambil daftar film berdasarkan filter.

* **URL:** `/archive`
* **Method:** `GET`
* **Parameter:** `slug` (Path dari URL asli LK21, misal: `genre/action` atau `year/2024`)
* **Contoh Request:**
    ```http
    GET http://localhost:3000/api/archive?slug=genre/horror
    ```

### 4. Detail Film/Series
Mengambil info lengkap, sinopsis, player stream, dan info download.

* **URL:** `/detail`
* **Method:** `GET`
* **Parameter:** `url` (Link lengkap halaman film dari hasil home/search)
* **Contoh Request:**
    ```http
    GET http://localhost:3000/api/detail?url=https://tv7.lk21official.cc/judul-film
    ```

### 5. Generate Link Download (PENTING)
Mengambil URL redirect untuk download agar user melewati Cloudflare secara valid.

* **URL:** `/download`
* **Method:** `GET`
* **Parameter:** `url` (Link lengkap halaman film)
* **Contoh Response:**
    ```json
    {
      "status": "success",
      "ads": {
        "smartlink": "https://direct-link.net/..."
      },
      "redirect_url": "https://dl.lk21.party/get/..." 
    }
    ```

---

## 💻 Panduan Integrasi Frontend (JavaScript)

### A. Menampilkan Banner & Iklan
Data iklan dikirim dari backend agar Anda bisa mengubah kode iklan tanpa perlu deploy ulang frontend.

**HTML:**
```html
<div id="ad-banner-container" style="text-align: center; margin: 10px 0;"></div>
```

**JavaScript:**
```javascript
async function loadHome() {
  try {
    const response = await fetch('http://localhost:3000/api/home');
    const json = await response.json();

    // 1. Render Banner
    if (json.ads?.enabled && json.ads.banner) {
      document.getElementById('ad-banner-container').innerHTML = json.ads.banner;
    }

    // 2. Render Social Bar / Script Iklan (Teknik Range Fragment)
    // Script tag tidak akan jalan jika hanya pakai innerHTML biasa
    if (json.ads?.enabled && json.ads.social_bar) {
      const range = document.createRange();
      // Jadikan string script menjadi elemen DOM yang bisa dieksekusi
      const fragment = range.createContextualFragment(json.ads.social_bar);
      document.body.appendChild(fragment);
    }

    // 3. Render Data Film (Contoh)
    renderMovies(json.data.latest_movies);

  } catch (error) {
    console.error("Gagal load home:", error);
  }
}
```

### B. Logic Tombol Download (Redirect)
Gunakan logika ini agar **user asli** yang membuka link download (bukan bot server), sehingga Cloudflare di situs asli memberikan akses.

**JavaScript:**
```javascript
// Fungsi dipanggil saat tombol "Download" diklik
async function handleDownload(movieDetailUrl) {
  // Tampilkan loading...

  try {
    const apiUrl = `http://localhost:3000/api/download?url=${encodeURIComponent(movieDetailUrl)}`;
    const response = await fetch(apiUrl);
    const json = await response.json();

    if (json.status === 'success') {
      const realLink = json.redirect_url;
      const adLink = json.ads?.smartlink;

      // --- STRATEGI MONETISASI ---

      // Opsi 1 (Sopan): Langsung buka link download di tab baru
      window.open(realLink, '_blank');

      // Opsi 2 (Cuan Maksimal):
      // Tab sekarang redirect ke Iklan (Smartlink), Tab baru buka Download
      /*
      window.open(realLink, '_blank'); // Buka file di tab baru
      if (adLink) window.location.href = adLink; // Tab ini jadi iklan
      */

    } else {
      alert("Maaf, link download belum tersedia.");
    }
  } catch (error) {
    console.error("Error download:", error);
    alert("Terjadi kesalahan koneksi.");
  }
}
```

---

## ⚠️ Catatan Penting

1. **Cross-Origin (CORS):** Backend sudah mengaktifkan CORS. Pastikan frontend Anda bisa mengakses `localhost:3000`.
2. **Iklan Script:** Beberapa browser dengan AdBlock mungkin memblokir script iklan yang dikirim backend. Pastikan kode iklan Anda "bersih" atau minta user matikan AdBlock.
3. **Redirect Download:** Jangan mencoba melakukan `fetch(json.redirect_url)` di background (AJAX) karena akan terkena blokir CORS/Cloudflare dari situs target. Wajib menggunakan `window.open`.
