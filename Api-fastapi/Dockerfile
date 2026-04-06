FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8001

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=10 CMD python -c "import urllib.request; response = urllib.request.urlopen('http://127.0.0.1:8001/api/health'); raise SystemExit(0 if response.status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
