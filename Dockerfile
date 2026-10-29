# ==============================================================================
# CLAIMTRACE JKN - HUGGING FACE SPACES & CLOUD DOCKERFILE
# 100% Free Cloud Deployment without Credit Card (2 vCPU, 16 GB RAM)
# ==============================================================================

FROM python:3.11-slim

WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up standard non-root user (UID 1000 for Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install Python requirements
COPY --chown=user:user backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY --chown=user:user backend/ .

# Port 7860 is Hugging Face Spaces standard port
EXPOSE 7860

ENV HOST=0.0.0.0
ENV PORT=7860
ENV APP_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:7860/api/v1/health || exit 1

# Launch FastAPI with Uvicorn
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
