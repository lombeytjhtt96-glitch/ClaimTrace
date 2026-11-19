#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  BPJS Kesehatan Data Sampel 2015-2024 Archive Restorer   "
echo "=========================================================="
echo "Menggabungkan bagian arsip dari archive_parts/..."

cat archive_parts/data_sampel_2015_2024.zip.part_* > "Data sampel 2015-2024.zip"

echo "Memverifikasi integritas hash SHA-256..."
EXPECTED="300b56936c813fd911c984032a1fd80c79f1584efadfa03079f6e5d6c42bc4f3"
ACTUAL=$(sha256sum "Data sampel 2015-2024.zip" | awk '{print $1}')

if [ "$ACTUAL" = "$EXPECTED" ]; then
    echo "✅ [SUKSES] Hash SHA-256 terverifikasi 100% cocok!"
    echo "Berkas: Data sampel 2015-2024.zip (701,180,980 bytes)"
    echo "Silakan ekstrak berkas dengan: unzip 'Data sampel 2015-2024.zip'"
else
    echo "❌ [GAGAL] Hash tidak cocok! Diharapkan: $EXPECTED, Dihasilkan: $ACTUAL"
    exit 1
fi
