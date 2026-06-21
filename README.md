# SmolLM Chat

Minimal local chat app with Express backend and static frontend.

## Setup

```bash
npm install
```

Create `.env` with:

```env
PORT=3000
LLM_BASE_URL=http://localhost:8000
LLM_MODEL=smollm-2
SYSTEM_PROMPT=You are a helpful AI assistant.
```

## Run locally

```bash
node server.js
```

Open `http://localhost:3000`

## Run with Docker Compose

```bash
docker compose -f compose.yaml up --build
```

To run in the background:

```bash
docker compose -f compose.yaml up --build -d
```

## Notes

- Frontend posts to `/api/chat`
- Health check available at `/health`
- If the container fails to start with `npm start`, add a `start` script in `package.json` or use `CMD ["node", "server.js"]` in the Dockerfile.
