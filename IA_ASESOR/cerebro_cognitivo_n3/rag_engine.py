"""
rag_engine.py
Motor de generación aumentada por recuperación (RAG).
Diseñado para ejecutarse en el Servidor de Inteligencia i7 (Nodo 3).
"""

import os
import chromadb
import ollama
from typing import List, Dict, Any, Optional

# Configuración del entorno RAG
CHROMA_PATH = os.environ.get("CHROMA_PATH", "./chroma_db")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")
OLLAMA_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
COLLECTION_NAME = "alvarezplacas_conocimiento"


class RAGEngine:
    def __init__(self):
        # Configurar cliente de Ollama
        ollama.client.host = OLLAMA_HOST
        
        # Inicializar ChromaDB (Persistente localmente)
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        
        # Obtener o crear colección
        self.collection = self.chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "Fichas técnicas, catálogos y guías de Alvarez Placas"}
        )
        print(f"[*] RAG Engine inicializado. Colección: '{COLLECTION_NAME}' (Ruta: {CHROMA_PATH})")

    def _get_embedding(self, text: str) -> List[float]:
        """Obtiene el vector de embeddings del texto a través de Ollama."""
        try:
            response = ollama.embeddings(
                model=OLLAMA_EMBED_MODEL,
                prompt=text
            )
            return response["embedding"]
        except Exception as e:
            print(f"[!] Error obteniendo embedding con Ollama: {e}")
            # Si falla, lanzamos la excepción para manejo superior
            raise RuntimeError(f"Fallo en generación de embedding con Ollama: {e}")

    def index_document(self, doc_id: str, content: str, metadata: Dict[str, Any]) -> bool:
        """Fragmenta e indexa un documento en ChromaDB generando sus vectores con Ollama."""
        try:
            embedding = self._get_embedding(content)
            self.collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[content],
                metadatas=[metadata]
            )
            return True
        except Exception as e:
            print(f"[-] Error al indexar documento {doc_id}: {e}")
            return False

    def retrieve_context(self, query: str, limit: int = 4) -> List[Dict[str, Any]]:
        """Recupera los fragmentos de documentos más relevantes para una consulta."""
        try:
            query_embedding = self._get_embedding(query)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit
            )
            
            retrieved = []
            if results and results["documents"]:
                docs = results["documents"][0]
                metas = results["metadatas"][0]
                distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
                ids = results["ids"][0]
                
                for i in range(len(docs)):
                    retrieved.append({
                        "id": ids[i],
                        "content": docs[i],
                        "metadata": metas[i] if metas else {},
                        "distance": distances[i]
                    })
            return retrieved
        except Exception as e:
            print(f"[!] Error en recuperación RAG: {e}")
            return []

    def generate_response(self, query: str, context_list: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]] = None, user_role: str = "staff") -> str:
        """Genera una respuesta contextualizada utilizando Ollama (LLM)."""
        # Formatear el contexto recuperado
        formatted_context = ""
        for idx, ctx in enumerate(context_list, 1):
            source = ctx["metadata"].get("source", "Desconocido")
            formatted_context += f"--- Fragmento {idx} (Fuente: {source}) ---\n{ctx['content']}\n\n"
            
        if user_role == "cliente":
            system_prompt = (
                "Eres el Asesor Virtual de Alvarez Placas.\n"
                "Tu objetivo es sugerir productos y opciones. Si te preguntan por un producto, sugiere también productos encadenados o complementarios (ej: si compra melamina, sugiere tapacantos o pegamento).\n"
                "REGLA DE ORO: NO PUEDES VER NI HABLAR DE PRECIOS. NUNCA menciones dinero, costos, descuentos ni valores numéricos de dinero.\n"
                "Si el cliente menciona dinero, intenta comprar algo o pregunta precios, DEBES decirle exactamente: 'Para precios y cotizaciones exactas, por favor comunícate por WhatsApp con nuestros asesores comerciales: Ariel, Braian o Facundo. Ellos te armarán el presupuesto.'\n"
                "Responde usando únicamente la información proporcionada en el contexto a continuación, sin inventar productos que no existan allí.\n\n"
                f"=== CONTEXTO DE CONOCIMIENTO ===\n{formatted_context}==============================="
            )
        else:
            system_prompt = (
                "Eres el Asistente Experto IA de Alvarez Placas, una empresa líder en melaminas, placas y servicios de corte de madera.\n"
                "Tu objetivo es asistir de forma clara, técnica, profesional y precisa a operarios y jefes.\n"
                "Responde usando únicamente la información proporcionada en el contexto a continuación.\n"
                "Si no sabes la respuesta o no se encuentra en el contexto, indícalo amablemente diciendo que no dispones de esa información.\n\n"
                f"=== CONTEXTO DE CONOCIMIENTO ===\n{formatted_context}==============================="
            )
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Agregar historial conversacional si existe
        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
                
        # Agregar la pregunta actual
        messages.append({"role": "user", "content": query})
        
        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                options={"temperature": 0.3}  # Temperatura baja para evitar alucinaciones
            )
            return response["message"]["content"]
        except Exception as e:
            print(f"[!] Error generando respuesta con Ollama: {e}")
            return f"Lo siento, el motor de inferencia local del Nodo 3 experimentó una falla temporal al procesar la respuesta. (Detalle: {e})"
            
    def ask(self, query: str, history: Optional[List[Dict[str, str]]] = None, user_role: str = "staff") -> Dict[str, Any]:
        """Flujo completo: Recuperación (Retrieve) + Inferencia (Generate)."""
        # 1. Recuperar contexto
        context = self.retrieve_context(query)
        
        # 2. Generar respuesta
        answer = self.generate_response(query, context, history, user_role)
        
        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "id": c["id"],
                    "source": c["metadata"].get("source", "Sin Fuente"),
                    "score": round(1.0 - c["distance"], 4) if "distance" in c else 0.0
                } for c in context
            ]
        }
