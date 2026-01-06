# Netlify Function Troubleshooting Guide

## Issue: `generate-report` Function Not Loading

### Symptoms
```bash
netlify dev
⬥ Loaded function upload-document
⬥ Loaded function gemini-agent
⬥ Loaded function ai-agent-audit
# generate-report missing ❌
```

### Root Cause
The `generate-report` function is a **Python function** that requires dependencies to be installed before Netlify can load it.

---

## Solution: Install Python Dependencies

### Step 1: Check Python Version
```bash
python3 --version
# Should be Python 3.9 or higher
```

### Step 2: Navigate to Function Directory
```bash
cd netlify/functions/generate-report
```

### Step 3: Install Requirements
```bash
pip3 install -r requirements.txt
```

**Required packages** (from `requirements.txt`):
- `python-docx` - Word document generation
- `jinja2` - HTML template rendering
- `pydantic` - Data validation
- `pydantic-ai` - AI model abstraction
- `markdown` - Markdown processing

### Step 4: Return to Project Root
```bash
cd ../../..
```

### Step 5: Restart Netlify Dev
```bash
# Kill port 3000 first (if running)
lsof -ti:3000 | xargs kill -9

# Start netlify dev
netlify dev
```

### Expected Output
```bash
⬥ Loaded function upload-document
⬥ Loaded function gemini-agent
⬥ Loaded function ai-agent-audit
⬥ Loaded function generate-report ✅
```

---

## Alternative: Use Virtual Environment (Recommended)

### Create Virtual Environment
```bash
cd netlify/functions/generate-report
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Update .gitignore
Add to your `.gitignore`:
```
netlify/functions/generate-report/venv/
```

### Run Netlify Dev
```bash
cd ../../..
netlify dev
```

---

## Port 3000 Conflict

### Symptom
```
error: Failed to start server. Is port 3000 in use?
code: "EADDRINUSE"
```

### Solution
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or find and kill manually
lsof -i :3000
kill -9 <PID>
```

### Why This Happens
The `netlify dev` command runs TWO servers:
1. **Framework dev server** (bun dev) on port **3000**
2. **Netlify proxy** on port **8888**

If port 3000 is already in use (e.g., you ran `bun dev` separately), you'll get this error.

### Prevention
Always use **one command**:
- Use `netlify dev` for full-stack development ✅
- OR use `bun dev` for frontend-only (no functions) ✅
- DON'T run both at the same time ❌

---

## Environment Variables

### Required for `generate-report` Function

Create `.env` file in project root:
```bash
# AI Model (at least one required)
GEMINI_API_KEY=your_gemini_key_here
# OR
OPENAI_API_KEY=your_openai_key_here
# OR
ANTHROPIC_API_KEY=your_claude_key_here

# Report Service Auth
REPORT_SERVICE_KEY=your_secret_key_here

# Supabase (for database access)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

Also create `.env.local` for frontend:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_REPORT_SERVICE_KEY=same_as_REPORT_SERVICE_KEY
GEMINI_API_KEY=your_gemini_key_here
```

---

## Testing the Function

### 1. Check Function Loaded
Visit: http://localhost:8888/.netlify/functions/generate-report

You should see:
```json
{
  "statusCode": 405,
  "error": "Method Not Allowed"
}
```
This means the function is loaded! (It just doesn't accept GET requests)

### 2. Test with cURL
```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-report \
  -H "Content-Type: application/json" \
  -H "X-Report-Service-Key: your_key_here" \
  -d '{
    "audit_id": "test-123",
    "template": "etu-standard",
    "format": "text",
    "audit_data": {
      "url": "https://example.com",
      "input_type": "url",
      "total_issues": 1,
      "issues": [
        {
          "wcag_principle": "Perceivable",
          "success_criterion": "1.1.1",
          "severity": "critical",
          "description": "Test issue"
        }
      ]
    }
  }'
```

### 3. Check Frontend Integration
In the app:
1. Run an audit
2. Select some issues
3. Click "Generate Custom Report"
4. Check Network tab for `/generate-report` request

---

## Common Errors

### "Module not found: python-docx"
**Solution**: Install dependencies
```bash
cd netlify/functions/generate-report
pip3 install -r requirements.txt
```

### "No module named 'pydantic_ai'"
**Solution**: Update pydantic-ai
```bash
pip3 install --upgrade pydantic-ai
```

### "Invalid API key"
**Solution**: Check environment variables
```bash
echo $GEMINI_API_KEY  # Should print your key
```

---

## Development Workflow

### Recommended Setup
```bash
# Terminal 1: Start Netlify Dev
netlify dev

# Terminal 2: Watch logs
tail -f .netlify/functions-serve/generate-report/function.log

# Terminal 3: Run tests
cd netlify/functions/generate-report
pytest tests/
```

### Hot Reload
Netlify Functions auto-reload on code changes. Just edit `main.py` and save!

---

## Production Deployment

### Build Command
```bash
bun run build
```

### Deploy
```bash
netlify deploy --prod
```

### Environment Variables (Set in Netlify Dashboard)
1. Go to: Site Settings > Environment variables
2. Add:
   - `GEMINI_API_KEY`
   - `REPORT_SERVICE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

---

## Next Steps

1. ✅ Kill port 3000
2. ✅ Install Python dependencies
3. ✅ Set environment variables
4. ✅ Run `netlify dev`
5. ✅ Test report generation
6. 🚀 Deploy to production

If issues persist, check the full error logs in `.netlify/functions-serve/`.
