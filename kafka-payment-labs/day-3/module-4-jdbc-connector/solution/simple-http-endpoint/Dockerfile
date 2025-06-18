# Build for linux/amd64 platform (required for most cloud platforms)
FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "main.py"]