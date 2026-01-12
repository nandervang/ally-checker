# Netlify Environment Variables Setup

## Issue

When running audits, you may see the error message:
```
Failed to retrieve audit results
```

However, inspecting the network tab shows that the API is returning successful responses with audit results, but `"auditId": null`.

## Root Cause

The Netlify function is unable to save audit results to the Supabase database because required environment variables are not configured in the Netlify dashboard.

## Solution

### 1. Configure Required Environment Variables

Log into your Netlify dashboard and add the following environment variables:

#### **Required for Database Operations**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click "Project Settings" (gear icon)
3. Navigate to "API" section
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to see it)

⚠️ **Important:** The `service_role` key has admin privileges - never expose it in client-side code or commit it to git.

#### **Required for AI Models (at least one)**

```bash
GEMINI_API_KEY=your_gemini_api_key       # Google Gemini (recommended)
ANTHROPIC_API_KEY=your_anthropic_key     # Claude (optional)
OPENAI_API_KEY=your_openai_key           # GPT-4 (optional)
```

**Where to get API keys:**
- Gemini: https://aistudio.google.com/app/apikey
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys

#### **Optional Security**

```bash
REPORT_SERVICE_KEY=your_custom_secret_key
```

Generate a random secure key:
```bash
openssl rand -base64 32
```

If set, all API requests must include this in the `X-Report-Service-Key` header.

### 2. Set Environment Variables in Netlify

1. Go to Netlify Dashboard → Your Site
2. Navigate to **Site configuration** → **Environment variables**
3. Click **Add a variable**
4. For each variable:
   - **Key**: Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Values**: Select "Same value for all scopes"
   - **Value**: Paste your value
   - Click **Create variable**

### 3. Redeploy the Site

After adding all environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete (~2-3 minutes)

### 4. Verify the Fix

1. Open your deployed site
2. Run an accessibility audit
3. Check that:
   - Audit completes successfully ✅
   - Results are displayed ✅
   - Audit appears in your history ✅
   - No "Failed to retrieve audit results" error ✅

## How the Fix Works

### Before (Current Behavior)

1. User runs audit
2. Netlify function detects missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`
3. Function returns audit results but with `auditId: null`
4. Frontend tries to fetch audit from database using null ID
5. Database query fails due to null validation
6. User sees "Failed to retrieve audit results" error

### After (Fixed Behavior)

#### Scenario A: Environment Variables Configured ✅

1. User runs audit
2. Netlify function saves audit to Supabase database
3. Function returns audit results with valid `auditId`
4. Frontend fetches audit from database
5. Results displayed normally
6. Audit saved in history for future access

#### Scenario B: Environment Variables Missing ⚠️

1. User runs audit
2. Netlify function detects missing environment variables
3. Function returns audit results with `auditId: null`
4. Frontend detects special error case (`AUDIT_NOT_SAVED`)
5. **Frontend displays results directly from API response**
6. Warning message: "Audit complete! (Results not saved to database - check environment configuration)"
7. User can see results but they won't persist in history

## Testing Locally

To test locally with environment variables:

```bash
# Create .env file in root
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
REPORT_SERVICE_KEY=optional_secret_key
EOF

# Run Netlify dev server
netlify dev
```

This will:
- Load environment variables from `.env`
- Start Netlify functions locally
- Allow you to test the full flow

## Troubleshooting

### Issue: Still seeing "Failed to retrieve audit results"

**Check:**
1. Environment variables are set in Netlify dashboard
2. Site has been redeployed after adding variables
3. Check Netlify function logs for errors:
   - Go to **Functions** tab
   - Click on `ai-agent-audit`
   - View recent invocations and logs

### Issue: "Supabase not configured" in function logs

**Solution:**
- Verify `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Ensure no typos in variable names
- Check that values are correct (copy directly from Supabase dashboard)

### Issue: Audit runs but results not saved

**Symptoms:**
- Warning message about database not configured
- Results display but don't appear in history

**Solution:**
- This is expected behavior when environment variables are missing
- Configure `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to enable persistence

### Issue: "Authentication failed" errors

**Check:**
1. `REPORT_SERVICE_KEY` is either:
   - Not set (API is public), OR
   - Set correctly and frontend has matching `VITE_REPORT_SERVICE_KEY`
2. If using `REPORT_SERVICE_KEY`, ensure it's the same on both:
   - Netlify environment (backend)
   - Client-side environment (frontend build)

## Security Best Practices

1. **Never commit sensitive keys to git**
   - Use `.env.local` for local development (already in `.gitignore`)
   - Set production keys only in Netlify dashboard

2. **Use separate keys for different environments**
   - Development: Local Supabase instance
   - Production: Production Supabase project

3. **Rotate keys periodically**
   - Generate new API keys every 90 days
   - Update both Netlify and local `.env` files

4. **Monitor usage**
   - Check Supabase dashboard for unusual activity
   - Monitor API usage for your AI providers
   - Set up billing alerts

## Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/environment-variables/get-started/)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Last Updated:** January 12, 2026
**Related Issues:** #audit-not-saved, #failed-to-retrieve
**Fixed In:** Commit f03aa5d
