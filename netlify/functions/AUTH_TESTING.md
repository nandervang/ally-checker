# Netlify Function Authentication Testing

## Test Authentication

### 1. Test Without API Key (Public Mode)

When `REPORT_SERVICE_KEY` is not set, functions allow unauthenticated access:

```bash
# Should succeed
curl -X POST http://localhost:8888/.netlify/functions/ai-agent-audit \
  -H "Content-Type: application/json" \
  -d '{"mode":"snippet","content":"<button>Click</button>","model":"gemini"}'
```

### 2. Test With Missing API Key

When `REPORT_SERVICE_KEY` is set but request has no key:

```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:8888/.netlify/functions/ai-agent-audit \
  -H "Content-Type: application/json" \
  -d '{"mode":"snippet","content":"<button>Click</button>","model":"gemini"}'
```

Response:
```json
{
  "error": "Unauthorized",
  "message": "Missing X-Report-Service-Key header"
}
```

### 3. Test With Invalid API Key

```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:8888/.netlify/functions/ai-agent-audit \
  -H "Content-Type: application/json" \
  -H "X-Report-Service-Key: wrong-key" \
  -d '{"mode":"snippet","content":"<button>Click</button>","model":"gemini"}'
```

Response:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### 4. Test With Valid API Key

```bash
# Should succeed
curl -X POST http://localhost:8888/.netlify/functions/ai-agent-audit \
  -H "Content-Type: application/json" \
  -H "X-Report-Service-Key: a3f8d9e2c1b4567890abcdef1234567890abcdef1234567890abcdef12345678" \
  -d '{"mode":"snippet","content":"<button>Click</button>","model":"gemini"}'
```

### 5. Test CORS Preflight

```bash
# Should return 204 No Content with CORS headers
curl -X OPTIONS http://localhost:8888/.netlify/functions/ai-agent-audit \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Report-Service-Key" \
  -v
```

Look for these headers in response:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, X-Report-Service-Key`
- `Access-Control-Allow-Methods: POST, OPTIONS`

## Local Testing Setup

1. Start Netlify Dev:
```bash
netlify dev
```

2. Set environment variable (optional, for testing authenticated mode):
```bash
export REPORT_SERVICE_KEY=a3f8d9e2c1b4567890abcdef1234567890abcdef1234567890abcdef12345678
netlify dev
```

3. Run test requests above

## Production Testing

Replace `http://localhost:8888` with your Netlify site URL:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-agent-audit \
  -H "Content-Type: application/json" \
  -H "X-Report-Service-Key: your-production-key" \
  -d '{"mode":"snippet","content":"<button>Click</button>","model":"gemini"}'
```

## Frontend Integration

Update your API client to include the API key header:

```typescript
// src/services/aiAgentService.ts
const REPORT_SERVICE_KEY = import.meta.env.VITE_REPORT_SERVICE_KEY;

const response = await fetch('/.netlify/functions/ai-agent-audit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Report-Service-Key': REPORT_SERVICE_KEY || '',
  },
  body: JSON.stringify(request),
});
```

Add to `.env.local`:
```bash
VITE_REPORT_SERVICE_KEY=a3f8d9e2c1b4567890abcdef1234567890abcdef1234567890abcdef12345678
```
