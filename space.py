"""
ClaimTrace JKN DSS - Hugging Face Spaces Entrypoint (Gradio SDK)
100% Free Cloud Deployment without Credit Card (CPU Basic: 2 vCPU, 16 GB RAM)
Mounts the FastAPI Backend and serves both API endpoints and Gradio Status Dashboard.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app.main' resolves to backend/app
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import gradio as gr
from app.main import app as fastapi_app

# Create clean, professional Gradio status interface (Zero Emojis)
with gr.Blocks(title="ClaimTrace JKN - Decision Support System API") as demo:
    gr.Markdown(
        """
        # BPJS Kesehatan — ClaimTrace JKN DSS Backend API
        ### Sistem Pengawasan & Penapisan Risiko Klaim Pra-Bayar Faskes JKN
        **BPJS Kesehatan Healthkathon 2026** • Status Layanan: **Active & Operasional**
        
        ---
        
        #### Endpoint Layanan Backend:
        - **Swagger / OpenAPI Documentation**: [`/docs`](/docs)
        - **Health Check & Audit Chain**: [`/api/v1/health`](/api/v1/health)
        - **Daftar & Penapisan Klaim**: [`/api/v1/claims`](/api/v1/claims)
        - **ClaimTrace AI Engine**: [`/api/v1/claimtrace-ai/generate`](/docs#/default/generate_claimtrace_ai_api_v1_claimtrace_ai_generate_post)
        - **Forensik DuckDB**: [`/api/v1/duckdb/info`](/api/v1/duckdb/info)
        - **Metrik Prometheus**: [`/metrics`](/metrics)
        
        *Backend ini melayani frontend ClaimTrace JKN di Vercel secara aman dan real-time.*
        """
    )

# Mount Gradio onto the existing FastAPI application
# This serves the Gradio dashboard at root and all FastAPI routes at /api/v1/... intact!
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    import uvicorn
    uvicorn.run("space:app", host="0.0.0.0", port=port, reload=False)
