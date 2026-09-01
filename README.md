# FINAGROW v2 - All-in-One Financial Management System (Fullstack)

Sistem Manajemen Keuangan Modern, Cerdas, dan Terintegrasi Penuh (**Frontend React TypeScript** + **Backend Laravel 11 RESTful API** + **Database MySQL** + **Google Gemini AI Assistant**).

---

## 🌟 Arsitektur & Teknologi

### 1. Frontend Layer
- **Framework**: React 19 + TypeScript + Vite 6
- **Routing**: React Router DOM v7
- **Data Visualization**: Recharts & Lucide Icons
- **State Management**: React Context (`FMSContext` + `LanguageContext` + `ThemeContext`)
- **AI Integration**: Google Gemini 2.5 Flash (`@google/genai`)

### 2. Backend Layer
- **Framework**: Laravel 11.x (PHP 8.2+)
- **API Architecture**: RESTful API Resource Controllers
- **Authentication**: Bearer Token Architecture (`auth.api.token` Middleware)
- **CORS**: Terkonfigurasi untuk integrasi Vite Frontend (`http://localhost:3000` & `http://localhost:5173`)

### 3. Database Layer
- **RDBMS**: MySQL 8.x / MariaDB (**Laragon** / HeidiSQL / phpMyAdmin)
- **Tabel Utama**:
  - `users` : Multi-role (`demo`, `user`, `admin`), status langganan (`is_pro`), token auth.
  - `transactions` : Jurnal Umum, Kas & Bank, Inflow & Outflow, COA mapping (Dr/Cr).
  - `assets` : Aset Tetap, Nilai Akuisisi, Akumulasi Amortisasi, Nilai Buku, Metode Penyusutan.
  - `subscriptions` : Manajemen paket Free & Pro, status langganan, masa berlaku.

---

## 🚀 Panduan Menjalankan Aplikasi (Local Development)

### 1. Persiapan Database MySQL (Laragon)
1. Buka aplikasi **Laragon** lalu klik **Start All** (memastikan service **MySQL** dan **Nginx/Apache** aktif).
2. Buka database tool bawaan Laragon (**Database / HeidiSQL**) atau phpMyAdmin, lalu buat database baru dengan nama:
   ```sql
   CREATE DATABASE finagrow_db;
   ```

### 2. Konfigurasi Backend (Laravel)
```bash
# Masuk ke folder backend
cd backend

# Salin file environment jika belum ada
copy .env.example .env

# Generate application key
php artisan key:generate

# Jalankan migrasi dan seeder data lengkap (Demo Admin & Demo User)
php artisan migrate:fresh --seed

# Jalankan server backend API
php artisan serve --host=127.0.0.1 --port=8000
```
*Backend API akan aktif di `http://127.0.0.1:8000/api`.*

### 3. Konfigurasi Frontend (React + Vite)
Buka terminal baru di folder root proyek:
```bash
# Install dependencies frontend
npm install

# Jalankan development server
npm run dev
```
*Frontend akan aktif di `http://localhost:3000` (atau `http://localhost:5173`).*

> 💡 **Cara Cepat (Windows One-Click)**:
> Anda juga dapat langsung menjalankan file **`start-fullstack.bat`** untuk menyalakan Backend & Frontend secara bersamaan.

---

## 🔐 Akun Uji Coba (Demo & Live Modes)

| Mode / Akun | Email | Password | Role | Kapasitas | Profil Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Demo Admin** | `demo_admin@fms.com` | `123456` | Admin | **Pro Plan** | Korporat (*PT Astra, AWS, IDR 1,96 Milyar*) |
| **Demo User** | `demo_user@fms.com` | `123456` | User | **Free Suite** | Retail UKM (*Toko Sembako Muklas, IDR 44,2 Juta*) |
| **Akun Baru (Sign Up)** | *Email Pendaftar* | *Password* | User | **Free Plan** | Bersih / Kosongan (*Rp 0, 0 Transaksi*) |

---

## 📡 Daftar RESTful API Endpoints

### Autentikasi (`/api/auth`)
- `POST /api/auth/register` : Mendaftarkan akun baru (Database MySQL)
- `POST /api/auth/login` : Login user & penerbitan token
- `POST /api/auth/demo` : Quick login mode demo (Admin / User)
- `GET  /api/auth/profile` : Mengambil data profile user aktif
- `POST /api/auth/logout` : Logout dan pencabutan token

### Transaksi & Jurnal (`/api/transactions`)
- `GET    /api/transactions` : Daftar transaksi terfilter per user
- `POST   /api/transactions` : Tambah transaksi / entri jurnal baru
- `GET    /api/transactions/{id}` : Detail transaksi
- `PUT    /api/transactions/{id}` : Update transaksi
- `DELETE /api/transactions/{id}` : Hapus transaksi

### Manajemen Aset Tetap (`/api/assets`)
- `GET    /api/assets` : Rekapitulasi aset & jadwal penyusutan
- `POST   /api/assets` : Daftarkan aset baru
- `GET    /api/assets/{id}` : Detail aset
- `PUT    /api/assets/{id}` : Edit data aset
- `DELETE /api/assets/{id}` : Hapus aset

### Langganan & Billing (`/api/subscriptions`)
- `GET  /api/subscriptions` : Status paket langganan aktif
- `POST /api/subscriptions/upgrade` : Upgrade ke paket Enterprise Pro

---

## 🤖 Fitur AI Financial Assistant
- Didukung oleh model **Google Gemini 2.5 Flash**.
- Mengolah data keuangan secara real-time untuk memberikan analisis tren arus kas, rekomendasi pemangkasan anggaran, evaluasi perpajakan, dan saran likuiditas bisnis.

---

## 🛡️ Keamanan & Git
- File rahasia `.env` (API Key Gemini dan Password DB) diabaikan secara otomatis oleh `.gitignore`.
- Template konfigurasi aman disediakan di `.env.example` dan `backend/.env.example`.
