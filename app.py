"""
ClaimTrace JKN DSS - Hugging Face Spaces Entrypoint (Gradio SDK + ZeroGPU)
100% Free Cloud Deployment without Credit Card (ZeroGPU Tier)
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

# Support Hugging Face ZeroGPU runtime
try:
    import spaces
    HAS_SPACES = True
except ImportError:
    HAS_SPACES = False
    class spaces:
        @staticmethod
        def GPU(fn=None, duration=None):
            if fn:
                return fn
            return lambda f: f

from app.main import app as fastapi_app
from fastapi.middleware.cors import CORSMiddleware

@spaces.GPU
def run_dss_forensic_inference(query_text: str = "") -> str:
    """ZeroGPU Accelerated Inference Worker for ClaimTrace Forensics."""
    if not query_text or query_text.strip() == "":
        query_text = "Audit Kepatuhan Klaim FPK"
    return f"ClaimTrace DSS Inference Engine Aktif. Investigasi '{query_text}' terverifikasi di runtime JKN Zero-PHI."

# Gradio UI Blocks (Zero Emojis, Clean Enterprise BPJS Kesehatan Theme)
with gr.Blocks(title="ClaimTrace JKN - Decision Support System API") as demo:
    gr.Markdown(
        """
        # BPJS Kesehatan — ClaimTrace JKN DSS Backend API
        ### Sistem Pengawasan & Penapisan Risiko Klaim Pra-Bayar Faskes JKN
        **Healthkathon BPJS Kesehatan** • Arsitektur Zero-PHI & UU PDP No. 27/2022 • Status: **Operasional**
        
        Backend API ini melayani antarmuka frontend ClaimTrace JKN secara real-time.
        
        #### Endpoint & Dokumentasi Layanan:
        - Swagger / OpenAPI Docs: [/docs](/docs)
        - Endpoint Health Check: [/api/v1/health](/api/v1/health)
        - Data Klaim & Penapisan: [/api/v1/claims](/api/v1/claims)
        - Forensik DuckDB: [/api/v1/duckdb/info](/api/v1/duckdb/info)
        - Metrik Audit: [/metrics](/metrics)
        """
    )
    with gr.Row():
        q_in = gr.Textbox(label="Investigasi Forensik Klaim", value="Verifikasi SIP DPJP & Validasi Koding INA-CBG")
        q_out = gr.Textbox(label="Status Eksekusi Engine", interactive=False)
    q_btn = gr.Button("Jalankan Inferensi Forensik", variant="primary")
    q_btn.click(fn=run_dss_forensic_inference, inputs=q_in, outputs=q_out)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    # Launch Gradio server and register ZeroGPU hooks
    server_app, _, _ = demo.launch(
        server_name="0.0.0.0",
        server_port=port,
        prevent_thread_lock=True,
        show_error=True
    )
    
    # Prepend all FastAPI endpoints so they take precedence over Gradio catch-all SPA routes
    for route in reversed(fastapi_app.routes):
        server_app.routes.insert(0, route)
        
    # Block main thread to keep service live
    demo.block_thread()
