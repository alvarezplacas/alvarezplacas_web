"""
main.py
Servidor API REST (FastAPI) para el Cerebro Cognitivo (Nodo 3).
Maneja las solicitudes de chat, consultas RAG y estados del nodo de IA.
"""

import os
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests

from rag_engine import RAGEngine

# Inicializar FastAPI
app = FastAPI(
    title="AlvarezPlacas AI Cognitive API",
    description="Servicios de Inteligencia Artificial y RAG de la red local (Nodo 3)",
    version="1.0.0"
)

# Configurar middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar en producción a orígenes específicos si es necesario
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar motor RAG de manera diferida o al arranque
try:
    rag = RAGEngine()
except Exception as e:
    print(f"[!] ADVERTENCIA: No se pudo inicializar RAGEngine en el arranque: {e}")
    rag = None


# --- Modelos de Datos Pydantic ---

class Message(BaseModel):
    role: str = Field(..., description="Rol del emisor: 'user' o 'assistant'")
    content: str = Field(..., description="Contenido de texto del mensaje")

class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Consulta o pregunta en lenguaje natural")
    history: Optional[List[Message]] = Field(default=None, description="Historial de mensajes previos")
    user_role: Optional[str] = Field(default="staff", description="Rol del usuario (ej: cliente o staff)")

class DocumentIndexRequest(BaseModel):
    id: str = Field(..., description="Identificador único del fragmento/documento")
    content: str = Field(..., description="Texto libre o ficha técnica a indexar")
    source: str = Field(..., description="Nombre del archivo original o procedencia")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadatos adicionales (ej: fecha, tags)")


# --- Endpoints de Inferencia ---

@app.post("/api/chat/query", status_code=status.HTTP_200_OK)
def query_chat(payload: ChatQueryRequest):
    """
    Realiza una consulta al motor de RAG para obtener una respuesta contextualizada.
    Apto para uso de clientes en la web y operarios del taller.
    """
    if not rag:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El motor RAG no está disponible. Verifique que Ollama y ChromaDB estén activos en el Nodo 3."
        )
        
    # Convertir el historial en formato aceptable por el motor RAG
    formatted_history = []
    if payload.history:
        for msg in payload.history:
            formatted_history.append({
                "role": msg.role,
                "content": msg.content
            })
            
    try:
        t_start = time.time()
        result = rag.ask(payload.query, formatted_history, payload.user_role)
        elapsed = time.time() - t_start
        
        return {
            "success": True,
            "query": result["query"],
            "answer": result["answer"],
            "sources": result["sources"],
            "time_taken_seconds": round(elapsed, 4)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la inferencia RAG: {str(e)}"
        )


@app.post("/api/documents/index", status_code=status.HTTP_201_CREATED)
def index_document(payload: DocumentIndexRequest):
    """
    Registra e indexa un nuevo fragmento de texto o especificación técnica en ChromaDB.
    """
    if not rag:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El motor RAG no está operativo."
        )
        
    meta = payload.metadata or {}
    meta["source"] = payload.source
    meta["timestamp"] = time.time()
    
    success = rag.index_document(payload.id, payload.content, meta)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fallo al persistir el documento en ChromaDB."
        )
        
    return {"success": True, "message": f"Documento '{payload.id}' indexado correctamente."}


# --- Endpoints de Estado e Integración ---

@app.get("/api/chat/status")
def get_status():
    """
    Retorna el estado de conectividad e infraestructura local del Nodo 3 y su enlace a Ollama.
    """
    status_ollama = "offline"
    ollama_version = None
    
    try:
        # Consultar la API local de Ollama
        r = requests.get(f"{rag.OLLAMA_HOST if rag else 'http://localhost:11434'}/api/tags", timeout=2)
        if r.status_code == 200:
            status_ollama = "online"
            ollama_version = "v1"
    except Exception:
        pass
        
    return {
        "status": "online" if rag else "degraded",
        "node": "cerebro_cognitivo_n3 (i7)",
        "database_vectorial": "ChromaDB (Local)",
        "ollama": {
            "status": status_ollama,
            "host": rag.OLLAMA_HOST if rag else "http://localhost:11434",
            "model_inferencia": rag.OLLAMA_MODEL if rag else "llama3",
            "model_embeddings": rag.OLLAMA_EMBED_MODEL if rag else "nomic-embed-text"
        },
        "timestamp": time.time()
    }


if __name__ == "__main__":
    import uvicorn
    # Iniciar servidor FastAPI local en puerto 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
