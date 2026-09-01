@echo off
title FINAGROW Fullstack Runner (FE + BE + DB)
color 0A

echo ========================================================
echo        FINAGROW V2 - FULLSTACK APPLICATION RUNNER       
echo ========================================================
echo.
echo [1/3] Memeriksa koneksi dan menjalankan Laravel Backend...
start "FINAGROW - Backend API (Port 8000)" powershell -NoExit -Command "cd backend; php artisan serve --host=127.0.0.1 --port=8000"

echo [2/3] Menjalankan Frontend React Vite...
start "FINAGROW - Frontend UI (Port 3000)" powershell -NoExit -Command "npm run dev"

echo.
echo ========================================================
echo  Backend API : http://127.0.0.1:8000/api
echo  Frontend UI : http://localhost:3000 (atau http://localhost:5173)
echo  Database    : MySQL (finagrow_db)
echo ========================================================
echo.
echo Kedua service sedang berjalan di jendela terpisah.
echo Anda dapat menutup jendela ini jika tidak diperlukan.
pause
