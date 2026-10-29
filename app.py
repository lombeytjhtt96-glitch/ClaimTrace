"""
ClaimTrace JKN DSS - Hugging Face Spaces Entrypoint (Gradio SDK)
Alias forwarding to space.py to avoid root package naming collisions.
"""
from space import app, demo

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
