# TrustForge Pocketful Stage 1

## Build
```bash
docker build -t trustforge-pocketful ./pocketful
```

## Run
```bash
docker run --rm -p 8080:8080 -e PORT=8080 trustforge-pocketful
```

## Health
```bash
curl http://localhost:8080/health
```

The Stage 1 service is self-contained and does not require PostgreSQL or outbound network access at runtime.
