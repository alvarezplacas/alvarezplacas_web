import requests
import os
import re
import shutil
import unicodedata

BASE = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"
IMAGE_ROOT = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\public\images\catalog\Placas"
PROCESSED_ROOT = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\public\images\catalog\Processed"

def normalize(text):
    if not text: return ""
    text = str(text).lower()
    # Remove accents
    text = "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    # Remove non-alphanumeric
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    # Remove common filler words
    fillers = ['aglomerado', 'mdf', 'mm', 'placa', 'egger', 'faplac', 'sadepan']
    for f in fillers:
        text = text.replace(f, ' ')
    return " ".join(text.split())

def smart_rename():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    if not os.path.exists(PROCESSED_ROOT): os.makedirs(PROCESSED_ROOT)

    print("Fetching products...")
    prods = requests.get(f"{BASE}/items/Productos?limit=-1&fields=id,modelo,sku,marca.nombre", headers=headers).json()["data"]
    
    # Pre-calculate normalized models
    prod_data = []
    for p in prods:
        if p.get('modelo') and p.get('sku'):
            prod_data.append({
                'sku': p['sku'],
                'modelo': p['modelo'],
                'norm': normalize(p['modelo']),
                'marca': p['marca']['nombre'].lower() if p.get('marca') else ""
            })

    print(f"Loaded {len(prod_data)} products.")

    found_count = 0
    total_images = 0

    for root, dirs, files in os.walk(IMAGE_ROOT):
        # Infer brand from folder name if possible
        folder_brand = ""
        path_lower = root.lower()
        if 'egger' in path_lower: folder_brand = 'egger'
        elif 'faplac' in path_lower: folder_brand = 'faplac'
        elif 'sadepan' in path_lower: folder_brand = 'sadepan'

        for f in files:
            if f.lower().endswith(('.avif', '.jpg', '.png', '.webp')):
                total_images += 1
                basename = os.path.splitext(f)[0]
                f_norm = normalize(basename)
                
                best_match = None
                # Strategy 1: Check if all words in model are in filename
                for p in prod_data:
                    # Filter by brand if we are in a brand folder
                    if folder_brand and p['marca'] != folder_brand: continue
                    
                    p_words = set(p['norm'].split())
                    f_words = set(f_norm.split())
                    
                    if not p_words: continue
                    
                    # If model is a subset of filename words (e.g. "Roble Termo Negro" in "H1199 ST12 Roble Termo Negro")
                    if p_words.issubset(f_words):
                        best_match = p['sku']
                        break
                
                # Strategy 2: If not found, try if filename is a subset of model (e.g. "Blanco" in "Blanco Aglomerado")
                if not best_match:
                    for p in prod_data:
                        if folder_brand and p['marca'] != folder_brand: continue
                        f_words = set(f_norm.split())
                        p_words = set(p['norm'].split())
                        if f_words and f_words.issubset(p_words):
                            best_match = p['sku']
                            break

                if best_match:
                    ext = os.path.splitext(f)[1].lower()
                    dst = os.path.join(PROCESSED_ROOT, f"{best_match}{ext}")
                    shutil.copy2(os.path.join(root, f), dst)
                    found_count += 1
                    # print(f"MATCH: {f} -> {best_match}")

    print(f"DONE: Renamed {found_count} of {total_images} images.")

if __name__ == "__main__":
    smart_rename()
