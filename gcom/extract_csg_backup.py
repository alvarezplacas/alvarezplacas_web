# -*- coding: utf-8 -*-
"""
GECOM CSG Backup Extractor
===========================
Reverse-engineered format:

GLOBAL HEADER:
  SSeg(4) + version(4) + SHdr(4) + version(4) + hash(16) + Scan(4) + scan_data(varies)
  + source_path + SPIS(4) + metadata_entry + SPIS(4) + data_blob

DATA BLOB (after second SPIS):
  Contains N file entries, each with:
    [fnLen: 2B LE][timestamp: 4B][attr: 2B][orig_size: 4B LE][comp_size: 4B LE]
    [method: 1B][extra_field: 4B][padding: 4B]
    [filename: fnLen bytes]
    [compressed_data: comp_size bytes]
  
  Total sub-header = 25 bytes before filename.
  method=0x02 means LZH-compressed, method=0x00 may mean stored.
"""
import sys, io, os, struct, json, zlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CSG_PATH = r"\\SERVER-ALVAREZP\gecom\Backups\gestion_ap2526_20260602.csg"
CSG_PATH_OLD = r"\\SERVER-ALVAREZP\gecom\Backups\gestion_no entrar_20251114.csg"
OUTPUT_DIR = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\scratch\gcom_backup_extracted"

HEADER_SIZE = 25  # bytes before filename in each sub-entry

def parse_csg_entries(data):
    """Parse all file entries from a CSG data blob."""
    # Find the second SPIS marker (data blob starts after it)
    spis_positions = []
    pos = 0
    while True:
        idx = data.find(b'SPIS', pos)
        if idx < 0:
            break
        spis_positions.append(idx)
        pos = idx + 4
    
    if len(spis_positions) < 2:
        print(f"  Warning: only {len(spis_positions)} SPIS markers found")
        return []
    
    # The second SPIS is the data blob
    # After SPIS(4) + sep(1) + "LZH"(3) + total_comp_size(4) + field2(4) + padding(4) = 20 bytes
    # Then the first file entry sub-header starts
    data_start = spis_positions[1] + 4 + 1 + 3 + 4 + 4 + 4 + 1  # = spis2 + 21
    
    entries = []
    pos = data_start
    
    while pos + HEADER_SIZE < len(data):
        # Read sub-header
        fn_len = struct.unpack('<H', data[pos:pos+2])[0]
        
        # Sanity check
        if fn_len == 0 or fn_len > 200:
            # Try scanning forward for a valid entry
            break
        
        timestamp = struct.unpack('<I', data[pos+2:pos+6])[0]
        attr = struct.unpack('<H', data[pos+6:pos+8])[0]
        orig_size = struct.unpack('<I', data[pos+8:pos+12])[0]
        comp_size = struct.unpack('<I', data[pos+12:pos+16])[0]
        method = data[pos+16]
        extra = struct.unpack('<I', data[pos+17:pos+21])[0]
        # 4 bytes padding at pos+21..pos+24
        
        # Read filename
        fn_start = pos + HEADER_SIZE
        if fn_start + fn_len > len(data):
            break
        filename = data[fn_start:fn_start+fn_len].decode('latin-1', errors='replace')
        
        # Compressed data
        data_offset = fn_start + fn_len
        if data_offset + comp_size > len(data):
            # Last entry might be truncated
            comp_size = len(data) - data_offset
        
        entries.append({
            'filename': filename,
            'orig_size': orig_size,
            'comp_size': comp_size,
            'method': method,
            'data_offset': data_offset,
            'header_offset': pos,
            'timestamp': timestamp,
        })
        
        # Move to next entry
        pos = data_offset + comp_size
    
    return entries


def catalog_backup(path):
    """Parse and catalog a CSG backup file."""
    print(f"\n{'='*70}")
    print(f"Parsing: {os.path.basename(path)}")
    print(f"Size: {os.path.getsize(path):,} bytes")
    
    with open(path, 'rb') as f:
        data = f.read()
    
    entries = parse_csg_entries(data)
    print(f"File entries found: {len(entries)}")
    
    # Stats
    total_orig = sum(e['orig_size'] for e in entries)
    total_comp = sum(e['comp_size'] for e in entries)
    print(f"Total original: {total_orig:,} bytes ({total_orig/1024/1024:.1f} MB)")
    print(f"Total compressed: {total_comp:,} bytes ({total_comp/1024/1024:.1f} MB)")
    if total_orig > 0:
        print(f"Compression ratio: {total_comp/total_orig*100:.1f}%")
    
    # Group by extension
    by_ext = {}
    for e in entries:
        ext = os.path.splitext(e['filename'])[1].lower()
        if ext not in by_ext:
            by_ext[ext] = []
        by_ext[ext].append(e)
    
    print(f"\nBy extension:")
    for ext in sorted(by_ext.keys()):
        files = by_ext[ext]
        tot = sum(f['orig_size'] for f in files)
        print(f"  {ext}: {len(files)} files, {tot:,} bytes original")
    
    # Show largest files
    entries_sorted = sorted(entries, key=lambda x: -x['orig_size'])
    print(f"\nTop 15 largest files (by original size):")
    print(f"  {'Filename':<30} {'Original':>12} {'Compressed':>12} {'Ratio':>8} {'Method':>6}")
    print(f"  {'-'*72}")
    for e in entries_sorted[:15]:
        ratio = f"{e['comp_size']/e['orig_size']*100:.0f}%" if e['orig_size'] > 0 else "N/A"
        print(f"  {e['filename']:<30} {e['orig_size']:>12,} {e['comp_size']:>12,} {ratio:>8} {e['method']:>6}")
    
    # Key tables
    key_tables = ['stock.fac', 'stock.idx', 'persona.fac', 'artrubro.fac',
                  'pedidocabe.fac', 'pedidodeta.fac', 'stockdescri.fac',
                  'artcompra.fac', 'empresa.ini']
    
    print(f"\n=== KEY BUSINESS TABLES ===")
    for kt in key_tables:
        found = [e for e in entries if e['filename'] == kt]
        if found:
            e = found[0]
            ratio = f"{e['comp_size']/e['orig_size']*100:.0f}%" if e['orig_size'] > 0 else "-"
            print(f"  ✓ {kt:<25} orig={e['orig_size']:>10,}  comp={e['comp_size']:>10,}  ratio={ratio}")
        else:
            print(f"  ✗ {kt}")
    
    return entries, data


def extract_raw_file(data, entry, output_dir):
    """Extract raw compressed data for a single file entry."""
    os.makedirs(output_dir, exist_ok=True)
    
    comp_data = data[entry['data_offset']:entry['data_offset']+entry['comp_size']]
    
    # Save raw compressed data
    raw_path = os.path.join(output_dir, entry['filename'] + '.compressed')
    with open(raw_path, 'wb') as f:
        f.write(comp_data)
    
    # Try various decompression methods
    decompressed = None
    
    # Method 1: Raw deflate (zlib without header)
    try:
        decompressed = zlib.decompress(comp_data, -15)
        if len(decompressed) == entry['orig_size']:
            print(f"  ✓ Decompressed with raw deflate: {len(decompressed)} bytes")
        else:
            decompressed = None
    except:
        pass
    
    # Method 2: zlib with header
    if not decompressed:
        try:
            decompressed = zlib.decompress(comp_data)
            if len(decompressed) == entry['orig_size']:
                print(f"  ✓ Decompressed with zlib: {len(decompressed)} bytes")
            else:
                decompressed = None
        except:
            pass
    
    # Method 3: gzip
    if not decompressed:
        try:
            decompressed = zlib.decompress(comp_data, 31)
            if len(decompressed) == entry['orig_size']:
                print(f"  ✓ Decompressed with gzip: {len(decompressed)} bytes")
            else:
                decompressed = None
        except:
            pass
    
    # Method 4: If method=0, might be stored (uncompressed)
    if not decompressed and entry['method'] == 0:
        if entry['comp_size'] == entry['orig_size']:
            decompressed = comp_data
            print(f"  ✓ Stored (uncompressed): {len(decompressed)} bytes")
    
    if decompressed:
        out_path = os.path.join(output_dir, entry['filename'])
        with open(out_path, 'wb') as f:
            f.write(decompressed)
        return out_path
    else:
        print(f"  ✗ Could not decompress (method={entry['method']}, comp={entry['comp_size']}, orig={entry['orig_size']})")
        # Save raw data anyway for manual inspection
        return raw_path


# ============ MAIN ============
print("=== GECOM CSG Backup Analyzer & Extractor ===\n")

# Catalog both backups
entries_new, data_new = catalog_backup(CSG_PATH)
entries_old, data_old = catalog_backup(CSG_PATH_OLD)

# Compare
print(f"\n\n{'='*70}")
print("=== COMPARISON ===")
files_new = {e['filename'] for e in entries_new}
files_old = {e['filename'] for e in entries_old}
print(f"Backup 2026-06-02 (AP2526): {len(files_new)} files")
print(f"Backup 2025-11-14 (AP2425): {len(files_old)} files")
print(f"Common: {len(files_new & files_old)}")
print(f"Only in new: {len(files_new - files_old)}")
print(f"Only in old: {len(files_old - files_new)}")

new_only = sorted(files_new - files_old)
old_only = sorted(files_old - files_new)
if new_only:
    print(f"\nFiles only in NEW backup ({len(new_only)}):")
    for f in new_only[:30]:
        print(f"  + {f}")
if old_only:
    print(f"\nFiles only in OLD backup ({len(old_only)}):")
    for f in old_only[:30]:
        print(f"  - {f}")

# Size comparison for common files
print(f"\nSize changes for key tables:")
for fn in sorted(files_new & files_old):
    e_new = [e for e in entries_new if e['filename'] == fn][0]
    e_old = [e for e in entries_old if e['filename'] == fn][0]
    if e_new['orig_size'] != e_old['orig_size']:
        delta = e_new['orig_size'] - e_old['orig_size']
        sign = "+" if delta > 0 else ""
        print(f"  {fn:<30} {e_old['orig_size']:>10,} → {e_new['orig_size']:>10,} ({sign}{delta:,})")

# Try to extract stock.fac from both backups
print(f"\n\n{'='*70}")
print("=== ATTEMPTING EXTRACTION ===")

os.makedirs(OUTPUT_DIR, exist_ok=True)

for name, entries, raw_data, label in [
    ("stock.fac", entries_new, data_new, "new"),
    ("stock.fac", entries_old, data_old, "old"),
    ("stock.idx", entries_new, data_new, "new"),
    ("artrubro.fac", entries_new, data_new, "new"),
    ("persona.fac", entries_new, data_new, "new"),
]:
    found = [e for e in entries if e['filename'] == name]
    if found:
        e = found[0]
        print(f"\nExtracting {name} ({label}): {e['orig_size']:,} bytes (compressed: {e['comp_size']:,})")
        out_dir = os.path.join(OUTPUT_DIR, label)
        result = extract_raw_file(raw_data, e, out_dir)
        print(f"  Saved to: {result}")

# Save complete catalog as JSON
catalog = {
    'new_backup': {
        'path': CSG_PATH,
        'source': '\\\\server-alvarezp\\c\\gecom\\datos\\ap2526',
        'files': [{k: v for k, v in e.items() if k != 'data_offset'} for e in entries_new]
    },
    'old_backup': {
        'path': CSG_PATH_OLD,
        'source': '\\\\server-alvarezp\\c\\gecom\\datos\\ap2425',
        'files': [{k: v for k, v in e.items() if k != 'data_offset'} for e in entries_old]
    }
}
catalog_path = os.path.join(OUTPUT_DIR, 'backup_catalog.json')
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)
print(f"\nCatalog saved to: {catalog_path}")
