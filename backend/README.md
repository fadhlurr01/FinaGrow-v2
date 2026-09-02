# FINAGROW Backend API (Laravel + MySQL)

Sistem Backend RESTful API untuk FINAGROW Financial Management System.

---

## 🛠️ Persiapan Lingkungan Lokal (Laragon / HeidiSQL / MySQL)

### 1. Buat Database MySQL
1. Buka aplikasi **Laragon**, lalu klik **Start All** (memastikan service **MySQL** dan **Nginx/Apache** aktif).
2. Buka **Database** (HeidiSQL) atau phpMyAdmin bawaan Laragon.
3. Buat database baru bernama: `finagrow_db` (Collation: `utf8mb4_unicode_ci`).

### 2. Konfigurasi Environment (`.env`)
Pastikan file `.env` di folder `backend/` telah disesuaikan:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=finagrow_db
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Jalankan Migrasi dan Seeder (Demo Data)
Jalankan perintah berikut di terminal folder `backend`:
```bash
# Install dependencies jika baru pertama kali
composer install

# Generate application key
php artisan key:generate

# Jalankan migrasi tabel users, transactions, assets, subscriptions
php artisan migrate

# Jalankan Seeder untuk mengisi akun Demo dan 100+ data transaksi
php artisan db:seed
```

### 4. Menjalankan Server Backend
```bash
php artisan serve
```
Backend API akan berjalan di: `http://127.0.0.1:8000/api`

---

## 🌐 Endpoint API Utama

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/register` | Mendaftarkan akun baru (Bersih, 0 Transaksi, `is_pro: false`) | Publik |
| `POST` | `/api/login` | Login user terdaftar | Publik |
| `POST` | `/api/demo-login` | 1-Click Demo Login (Auto seed 100+ transaksi, `is_pro: true`) | Publik |
| `GET` | `/api/me` | Mengambil profil user aktif & status Pro | Bearer Token |
| `POST` | `/api/logout` | Revoke token autentikasi | Bearer Token |
| `GET` | `/api/transactions` | Mengambil daftar seluruh transaksi user | Bearer Token |
| `POST` | `/api/transactions` | Menambah transaksi baru (income / expense) | Bearer Token |
| `PUT` | `/api/transactions/{id}` | Mengubah data transaksi | Bearer Token |
| `DELETE` | `/api/transactions/{id}` | Menghapus data transaksi | Bearer Token |
| `GET` | `/api/transactions/summary` | Ringkasan metrik (Total Income, Expense, Net) | Bearer Token |
| `GET` | `/api/assets` | Mengambil daftar aset perusahaan | Bearer Token |
| `POST` | `/api/assets` | Menambah aset terdaftar baru | Bearer Token |
| `GET` | `/api/coa` | Mengambil daftar Chart of Accounts (COA) | Bearer Token |
| `POST` | `/api/coa` | Menambah akun COA baru | Bearer Token |
| `PUT` | `/api/coa/{id}` | Mengubah data akun COA | Bearer Token |
| `DELETE` | `/api/coa/{id}` | Menghapus akun COA | Bearer Token |
| `POST` | `/api/subscription/upgrade` | Upgrade akun ke status Pro | Bearer Token |

---

## 🚀 Panduan Upload ke Shared Hosting (InfinityFree / cPanel)

1. **Database InfinityFree**:
   - Masuk ke cPanel InfinityFree -> **MySQL Databases**.
   - Buat database baru (misal: `epiz_xxxxxx_finagrow`).
   - Import file export SQL atau jalankan migrasi via SSH/script.
   - Update `.env` dengan kredensial DB InfinityFree (`DB_HOST=sqlxxx.epizy.com`, `DB_USERNAME=epiz_...`, dll).

2. **File `.htaccess`**:
   - File `.htaccess` di root backend sudah disiapkan untuk mengarahkan otomatis traffic domain ke folder `public/` dengan proteksi file `.env`.
