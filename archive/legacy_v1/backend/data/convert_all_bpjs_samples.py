"""
Converter: Full Official BPJS Kesehatan Sample Dataset (2015-2024) to High-Performance Parquet
Mengonversi seluruh 1.699.219 baris FKRTL, 2.590.751 baris Kepesertaan, dan 1.967.670 baris Diagnosis Sekunder
ke dalam format Parquet untuk DuckDB In-Memory OLAP Engine ClaimTrace.
"""

import os
import time
import duckdb
import pandas as pd

DATA_DIR = "/mnt/g/Data sampel 2015-2024"
OUT_DIR = "/mnt/c/Users/Asus/Downloads/ClaimTrace/backend/data/bpjs_sample_2025"
os.makedirs(OUT_DIR, exist_ok=True)

def convert_stata_to_parquet(dta_name, parquet_name, chunk_size=100000):
    dta_path = os.path.join(DATA_DIR, dta_name)
    parquet_path = os.path.join(OUT_DIR, parquet_name)
    
    print(f"\n=======================================================")
    print(f"Mengonversi: {dta_name} -> {parquet_name}")
    print(f"Path Asal: {dta_path}")
    print(f"Path Tujuan: {parquet_path}")
    print(f"=======================================================")
    
    start_time = time.time()
    con = duckdb.connect(":memory:")
    
    # Create temporary table
    first_chunk = True
    total_rows = 0
    
    for i, chunk in enumerate(pd.read_stata(dta_path, chunksize=chunk_size, convert_categoricals=False)):
        total_rows += len(chunk)
        con.register(f"chunk_{i}", chunk)
        if first_chunk:
            con.execute(f"CREATE TABLE staging_table AS SELECT * FROM chunk_{i};")
            first_chunk = False
        else:
            con.execute(f"INSERT INTO staging_table SELECT * FROM chunk_{i};")
        con.unregister(f"chunk_{i}")
        print(f"  [Progress] Chunk {i+1}: {len(chunk):,} baris dimuat (Total: {total_rows:,} baris)...")
    
    print(f"  [Exporting] Menulis ke file Parquet (ZSTD Compressed)...")
    con.execute(f"COPY staging_table TO '{parquet_path}' (FORMAT PARQUET, COMPRESSION ZSTD);")
    con.close()
    
    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(parquet_path) / (1024 * 1024)
    print(f"  [SELESAI] {total_rows:,} baris berhasil dikonversi dalam {elapsed:.2f} detik.")
    print(f"  Ukuran File Parquet: {file_size_mb:.2f} MB")
    return total_rows, file_size_mb

if __name__ == "__main__":
    print("Mulai konversi seluruh dataset sampel resmi BPJS Kesehatan...")
    
    # 1. Konversi Data Pelayanan FKRTL (1,7 Juta Baris)
    convert_stata_to_parquet("202403_fkrtl.dta", "fkrtl_full_2024.parquet", chunk_size=150000)
    
    # 2. Konversi Master Kepesertaan (2,6 Juta Baris)
    convert_stata_to_parquet("2015202401_kepesertaan.dta", "kepesertaan_full_2024.parquet", chunk_size=200000)
    
    # 3. Konversi Diagnosis Sekunder (1,97 Juta Baris)
    convert_stata_to_parquet("202405_diagnosissekunder.dta", "diagnosissekunder_full_2024.parquet", chunk_size=200000)
    
    print("\nSeluruh dataset BPJS Kesehatan (total ~6,3 Juta baris) berhasil siap di DuckDB!")
