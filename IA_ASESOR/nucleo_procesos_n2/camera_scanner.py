#!/usr/bin/env python3
"""
camera_scanner.py
Modulo de descubrimiento y escaneo de cámaras de seguridad (ONVIF/RTSP) en red local.
Diseñado para ejecutarse en el Servidor de Procesos i5 (Nodo 2).
"""

import os
import sys
import socket
import concurrent.futures
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import List, Dict, Any, Tuple

# Configuración de base de datos a través de variables de entorno o valores por defecto
DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")  # Dirección IP de Tailscale para el Nodo 2
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "alvarezplacas_procesos")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "postgres")

# Puertos objetivo para identificar cámaras IP
PORTS_TO_SCAN = {
    554: "RTSP",
    80: "HTTP/ONVIF",
    8800: "ONVIF (Alternativo)",
    5544: "RTSP (Alternativo)"
}

TIMEOUT_SEC = 1.0
MAX_THREADS = 50


def get_local_ip_subnet() -> str:
    """Intenta detectar la subred local actual de la interfaz activa."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # No se realiza una conexión real, solo sirve para obtener la IP de interfaz de salida
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        parts = local_ip.split('.')
        # Retorna el prefijo de la subred, ej: '192.168.1'
        return f"{parts[0]}.{parts[1]}.{parts[2]}"
    except Exception as e:
        print(f"[!] No se pudo autodetectar la subred local: {e}. Usando 192.168.1 como default.")
        return "192.168.1"


def check_port(ip: str, port: int) -> Tuple[str, int, bool]:
    """Comprueba si un puerto TCP está abierto en una dirección IP específica."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(TIMEOUT_SEC)
            result = s.connect_ex((ip, port))
            return ip, port, result == 0
    except Exception:
        return ip, port, False


def scan_subnet(subnet_prefix: str) -> List[Dict[str, Any]]:
    """Escanea la subred buscando puertos relacionados con cámaras en paralelo."""
    print(f"[*] Iniciando escaneo en la subred {subnet_prefix}.0/24...")
    discovered = {}  # IP -> {"ip": ip, "ports": []}
    
    ips = [f"{subnet_prefix}.{i}" for i in range(1, 255)]
    tasks = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        for ip in ips:
            for port in PORTS_TO_SCAN.keys():
                tasks.append(executor.submit(check_port, ip, port))
                
        for future in concurrent.futures.as_completed(tasks):
            ip, port, is_open = future.result()
            if is_open:
                if ip not in discovered:
                    discovered[ip] = {
                        "ip_address": ip,
                        "ports": [],
                        "fabricante": "Genérico",
                        "estado": "online"
                    }
                discovered[ip]["ports"].append(port)
                
    return list(discovered.values())


def upsert_camera(conn: psycopg2.extensions.connection, camera: Dict[str, Any]) -> None:
    """Inserta o actualiza una cámara descubierta en la base de datos."""
    try:
        with conn.cursor() as cur:
            ports = camera["ports"]
            ip = camera["ip_address"]
            
            # Asignación inteligente de puertos según lo detectado
            puerto_rtsp = 554 if 554 in ports or 5544 in ports else None
            puerto_onvif = 80 if 80 in ports else (8800 if 8800 in ports else None)
            
            query = """
                INSERT INTO dispositivos_video (
                    ip_address, nombre, puerto_rtsp, puerto_onvif, fabricante, estado, ultima_conexion
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (ip_address) 
                DO UPDATE SET
                    puerto_rtsp = EXCLUDED.puerto_rtsp,
                    puerto_onvif = EXCLUDED.puerto_onvif,
                    estado = 'online',
                    ultima_conexion = CURRENT_TIMESTAMP,
                    actualizado_el = CURRENT_TIMESTAMP;
            """
            
            nombre_cam = f"Cámara en {ip}"
            cur.execute(query, (
                ip, 
                nombre_cam, 
                puerto_rtsp, 
                puerto_onvif, 
                camera["fabricante"], 
                camera["estado"],
                datetime.now()
            ))
        conn.commit()
        print(f"[+] Cámara registrada/actualizada exitosamente: {ip} (Puertos abiertos: {ports})")
    except Exception as e:
        conn.rollback()
        print(f"[-] Error al guardar la cámara {ip} en base de datos: {e}")


def update_offline_cameras(conn: psycopg2.extensions.connection, active_ips: List[str]) -> None:
    """Marca como offline las cámaras que no fueron detectadas en el escaneo actual."""
    try:
        with conn.cursor() as cur:
            if active_ips:
                query = """
                    UPDATE dispositivos_video 
                    SET estado = 'offline' 
                    WHERE ip_address NOT IN %s AND estado = 'online';
                """
                cur.execute(query, (tuple(active_ips),))
            else:
                query = "UPDATE dispositivos_video SET estado = 'offline' WHERE estado = 'online';"
                cur.execute(query)
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[-] Error al actualizar estado de cámaras caídas: {e}")


def run_discovery() -> None:
    """Ejecuta el ciclo de descubrimiento completo."""
    subnet = get_local_ip_subnet()
    cameras = scan_subnet(subnet)
    
    print(f"[*] Escaneo completado. Se encontraron {len(cameras)} hosts con puertos de video abiertos.")
    
    # Conexión a PostgreSQL
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        print("[*] Conexión establecida con PostgreSQL local (Nodo 2).")
    except Exception as e:
        print(f"[!] Error crítico de conexión a PostgreSQL: {e}")
        print("[-] Deteniendo script de registro. Verifique configuración de red.")
        sys.exit(1)
        
    try:
        active_ips = []
        for cam in cameras:
            upsert_camera(conn, cam)
            active_ips.append(cam["ip_address"])
            
        update_offline_cameras(conn, active_ips)
    finally:
        conn.close()
        print("[*] Conexión de base de datos cerrada.")


if __name__ == "__main__":
    print(f"=== INICIANDO DESCUBRIMIENTO DE CÁMARAS LOCALES ===")
    print(f"Fecha/Hora: {datetime.now().isoformat()}")
    run_discovery()
    print(f"=== PROCESO FINALIZADO ===")
