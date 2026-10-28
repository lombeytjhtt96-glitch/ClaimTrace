import os
import re

base_dir = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/src/components'

def enhance_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Replace heavy shadows: shadow-2xl -> shadow-xs, shadow-xl -> shadow-xs, shadow-lg -> shadow-xs, shadow-md -> shadow-xs
    # Only replace in className or class attributes
    def replace_shadow(match):
        val = match.group(0)
        # We replace shadow-xl, shadow-2xl, shadow-lg, shadow-md with shadow-xs
        # But if it's already shadow-xs or shadow-2xs or shadow-sm, keep it
        return val.replace('shadow-2xl', 'shadow-xs').replace('shadow-xl', 'shadow-xs').replace('shadow-lg', 'shadow-xs').replace('shadow-md', 'shadow-xs')

    content = re.sub(r'className=["\'][^"\']*shadow-(?:2xl|xl|lg|md)[^"\']*["\']', replace_shadow, content)

    # 2. Add aria-label to inputs that lack aria-label, id, or name
    # e.g., <input type="text" placeholder="Cari..." ... />
    def enhance_input(match):
        tag = match.group(0)
        if 'aria-label' in tag or 'id=' in tag or 'name=' in tag:
            return tag
        # Find placeholder
        ph_match = re.search(r'placeholder=["\']([^"\']+)["\']', tag)
        if ph_match:
            placeholder = ph_match.group(1)
            # Insert aria-label right after <input
            return tag[:6] + f' aria-label="{placeholder}"' + tag[6:]
        # If type="range"
        if 'type="range"' in tag or 'type=\'range\'' in tag:
            return tag[:6] + ' aria-label="Penggeser parameter simulasi"' + tag[6:]
        # If type="checkbox"
        if 'type="checkbox"' in tag or 'type=\'checkbox\'' in tag:
            return tag[:6] + ' aria-label="Kotak centang opsi"' + tag[6:]
        # If type="search"
        if 'type="search"' in tag or 'type=\'search\'' in tag:
            return tag[:6] + ' aria-label="Kolom pencarian"' + tag[6:]
        # Default
        return tag[:6] + ' aria-label="Bidang input data"' + tag[6:]

    content = re.sub(r'<input\b[^>]*>', enhance_input, content)

    # 3. Add type="button" to <button> tags that don't specify type
    def enhance_button(match):
        tag = match.group(0)
        if 'type=' in tag:
            return tag
        return tag[:7] + ' type="button"' + tag[7:]

    content = re.sub(r'<button\b[^>]*>', enhance_button, content)

    # 4. Add aria-label to icon-only buttons
    # Pattern for <button ...><Icon .../></button> or <button ...><Icon .../> </button>
    def enhance_icon_button(match):
        full = match.group(0)
        btn_open = match.group(1)
        btn_inner = match.group(2)
        btn_close = match.group(3)
        
        # If already has aria-label, skip
        if 'aria-label' in btn_open or 'aria-labelledby' in btn_open:
            return full

        # Check if inner content is just an icon tag like <ChevronLeft className="w-5 h-5" /> or <X ... />
        stripped_inner = btn_inner.strip()
        # If inner contains text (not starting with < and ending with >)
        text_parts = [t.strip() for t in re.split(r'<[^>]+>', stripped_inner) if t.strip()]
        if len(text_parts) == 0:
            # It's icon only! Find icon name
            icon_match = re.search(r'<([A-Z][a-zA-Z0-9]+)\b', stripped_inner)
            if icon_match:
                icon_name = icon_match.group(1)
                label_map = {
                    'ChevronLeft': 'Kembali ke halaman sebelumnya',
                    'ChevronRight': 'Halaman berikutnya',
                    'X': 'Tutup jendela',
                    'Close': 'Tutup jendela',
                    'RefreshCw': 'Segarkan data',
                    'RotateCcw': 'Reset ulang',
                    'Search': 'Cari data',
                    'Filter': 'Saring data',
                    'Download': 'Unduh berkas',
                    'Printer': 'Cetak dokumen',
                    'Copy': 'Salin tautan atau kode',
                    'Eye': 'Tampilkan rincian',
                    'EyeOff': 'Sembunyikan rincian',
                    'Plus': 'Tambah baru',
                    'Send': 'Kirim pesan',
                    'Trash': 'Hapus data',
                    'Edit': 'Ubah data',
                    'Edit3': 'Ubah profil',
                    'Save': 'Simpan perubahan',
                    'Check': 'Konfirmasi tindakan',
                    'AlertCircle': 'Peringatan sistem',
                    'Sliders': 'Pengaturan parameter',
                    'Bell': 'Pemberitahuan notifikasi',
                    'Maximize2': 'Tampilan layar penuh',
                    'ExternalLink': 'Buka tautan eksternal'
                }
                label = label_map.get(icon_name, f'Tombol aksi {icon_name}')
                # Add aria-label
                enhanced_open = btn_open[:7] + f' aria-label="{label}"' + btn_open[7:]
                return f'{enhanced_open}{btn_inner}{btn_close}'
        return full

    content = re.sub(r'(<button\b[^>]*>)(.*?)(</button>)', enhance_icon_button, content, flags=re.DOTALL)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count_modified = 0
for root, _, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.jsx'):
            p = os.path.join(root, f)
            if enhance_file(p):
                print(f'Enhanced: {f}')
                count_modified += 1

print(f'Total files modified: {count_modified}')
