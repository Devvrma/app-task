# Lightweight Python image
FROM python:3.9-slim

WORKDIR /app

# Security: Create a non-root user
RUN useradd -m workeruser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Change ownership to our user
RUN chown -R workeruser:workeruser /app
USER workeruser

CMD ["python", "worker.py"]