FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies required for mysqlclient and other packages
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    python3-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-10000}"]
