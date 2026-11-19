@echo off
echo ==========================================================
echo   BPJS Kesehatan Data Sampel 2015-2024 Archive Restorer   
echo ==========================================================
echo Menggabungkan bagian arsip dari archive_parts...

copy /b archive_parts\data_sampel_2015_2024.zip.part_* "Data sampel 2015-2024.zip"

echo.
echo Penggabungan selesai. Menghitung hash SHA-256...
certutil -hashfile "Data sampel 2015-2024.zip" SHA256

echo.
echo Hash yang diharapkan: 300b56936c813fd911c984032a1fd80c79f1584efadfa03079f6e5d6c42bc4f3
echo.
pause
