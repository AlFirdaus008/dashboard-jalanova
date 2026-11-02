@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" (
  echo Memasang dependensi dashboard...
  call npm.cmd ci
  if errorlevel 1 (
    echo Pemasangan dependensi gagal. Periksa koneksi internet dan instalasi Node.js.
    pause
    exit /b 1
  )
)
echo.
echo Jalanova AI - dashboard lokal
echo Buka alamat Local yang ditampilkan di bawah pada browser Anda.
echo Tekan Ctrl+C di jendela ini untuk menghentikan server.
echo.
call npm.cmd run dev -- --port 5173
if errorlevel 1 pause
