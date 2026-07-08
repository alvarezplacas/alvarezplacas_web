#!/usr/bin/env python3
"""
pdf_indexer.py
Script de utilidad para procesar PDFs de catalogos tecnicos, fragmentarlos
y registrarlos en la base de datos vectorial del Nodo 3 mediante la API HTTP.
"""

import os
import sys
import argparse
import requests
from typing import List, Dict, Any

# Intentar importar librerias para lectura de PDFs
try:
    import pypdf
    PDF_READER = "pypdf"
except ImportError:
    try:
        import PyPDF2 as pypdf
        PDF_READER = "pypdf"
    except ImportError:
        try:
            import pdfplumber
            PDF_READER = "pdfplumber"
        except ImportError:
            print("[!] ERROR: Se requiere la libreria 'pypdf', 'PyPDF2' o 'pdfplumber' para leer archivos PDF.")
            print("Instalacion: pip install pypdf requests")
            sys.exit(1)


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 120) -> List[str]:
    """Divide un texto largo en fragmentos (chunks) mas pequeños con solapamiento."""
    if not text:
        return []
    
    words = text.split()
    chunks = []
    
    # Si hay pocas palabras, retornamos el texto completo
    if len(words) * 5 <= chunk_size:
        return [text]
        
    current_idx = 0
    total_words = len(words)
    
    # Convertir chunk_size y overlap aproximados de caracteres a palabras (aprox. 6 letras por palabra)
    words_per_chunk = max(10, int(chunk_size / 6))
    words_overlap = max(2, int(overlap / 6))
    
    while current_idx < total_words:
        end_idx = min(current_idx + words_per_chunk, total_words)
        chunk_words = words[current_idx:end_idx]
        
        # Unir y guardar fragmento
        chunks.append(" ".join(chunk_words))
        
        # Desplazar indice considerando el solapamiento
        current_idx += (words_per_chunk - words_overlap)
        
        # Evitar bucles infinitos
        if current_idx >= total_words or words_per_chunk <= words_overlap:
            break
            
    return chunks


def extract_pdf_content(file_path: str) -> List[Dict[str, Any]]:
    """Lee el PDF y retorna una lista de paginas con su texto."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"El archivo {file_path} no existe.")
        
    print(f"[*] Abriendo archivo PDF: {os.path.basename(file_path)}...")
    pages_data = []
    
    if PDF_READER == "pypdf":
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            num_pages = len(reader.pages)
            print(f"[*] (pypdf) Detectadas {num_pages} paginas en el documento.")
            
            for page_idx in range(num_pages):
                page = reader.pages[page_idx]
                text = page.extract_text()
                if text and text.strip():
                    pages_data.append({
                        "page_number": page_idx + 1,
                        "text": text.strip()
                    })
    elif PDF_READER == "pdfplumber":
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            num_pages = len(pdf.pages)
            print(f"[*] (pdfplumber) Detectadas {num_pages} paginas en el documento.")
            
            for page_idx in range(num_pages):
                page = pdf.pages[page_idx]
                text = page.extract_text()
                if text and text.strip():
                    pages_data.append({
                        "page_number": page_idx + 1,
                        "text": text.strip()
                    })
                
    return pages_data


def upload_chunks(pages: List[Dict[str, Any]], source_name: str, api_url: str) -> None:
    """Fragmenta el texto de cada pagina y lo envia a la API de indexacion."""
    print(f"[*] Iniciando indexacion hacia: {api_url}...")
    total_uploaded = 0
    
    for page in pages:
        page_num = page["page_number"]
        raw_text = page["text"]
        
        # Dividir el texto de la pagina en fragmentos logicos
        chunks = chunk_text(raw_text)
        
        for chunk_idx, chunk in enumerate(chunks):
            # Generar ID unico legible para cada fragmento
            doc_id = f"{source_name}_p{page_num}_c{chunk_idx}"
            
            payload = {
                "id": doc_id,
                "content": chunk,
                "source": source_name,
                "metadata": {
                    "page": page_num,
                    "chunk": chunk_idx,
                    "file_path": source_name
                }
            }
            
            try:
                response = requests.post(f"{api_url}/api/documents/index", json=payload, timeout=5)
                if response.status_code == 201:
                    total_uploaded += 1
                else:
                    print(f"[-] Fallo en indexador para {doc_id}: {response.text}")
            except Exception as e:
                print(f"[!] Error de conexion al subir {doc_id}: {e}")
                print("[-] Abortando proceso. Verifique si el servidor FastAPI en el Nodo 3 esta activo.")
                return
                
    print(f"[+] PROCESO EXITOSO: Se indexaron {total_uploaded} fragmentos del catalogo '{source_name}'.")


def main():
    parser = argparse.ArgumentParser(description="Indexador de PDFs tecnicos a la base vectorial local RAG")
    parser.add_argument("pdf_path", type=str, help="Ruta al archivo PDF comercial/tecnico")
    parser.add_argument("--api", type=str, default="http://100.115.10.3:8000", 
                        help="URL base de la API de FastAPI del Nodo 3 (ej: http://100.x.x.I7:8000)")
    
    args = parser.parse_args()
    
    try:
        # 1. Extraer paginas
        pages = extract_pdf_content(args.pdf_path)
        
        if not pages:
            print("[-] No se pudo extraer texto del PDF (¿es escaneado/imagen?).")
            sys.exit(1)
            
        # 2. Generar nombre de la fuente
        source_name = os.path.basename(args.pdf_path)
        
        # 3. Subir e indexar a la BD Vectorial
        upload_chunks(pages, source_name, args.api)
        
    except Exception as e:
        print(f"[-] Error en el proceso: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
