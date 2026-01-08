# Settings Feature Plan

## Overview
Add a comprehensive settings page to allow users to configure the app according to their preferences and workflow needs.

## Proposed Settings Categories

### 1. AI Model Selection 🤖
**Purpose**: Let users choose which AI model powers the accessibility analysis

**Settings**:
- **Primary Model**: 
  - Gemini 2.0 Flash (Default - fastest, cheapest)
  - GPT-4o (GitHub Copilot compatible)
  - GPT-4o-mini (Faster, cheaper GPT-4)
  - Claude 3.5 Sonnet (Best reasoning)
  - Groq Llama 3.1 (Ultra-fast open model)
  - Ollama (Local models, privacy-first)

- **Fallback Model**: Secondary model if primary fails
- **Model Parameters**:
  - Temperature (0-1): Creativity vs consistency
  - Max tokens: Response length limit
  - Timeout (seconds): How long to wait for response

**Storage**: User preferences in Supabase `user_settings` table

---

### 2. Report Templates 📄
**Purpose**: Choose output format and branding for generated reports

**Settings**:
- **Template Style**:
  - ETU Standard (Default - professional)
  - Minimal (Clean, simple)
  - Detailed (Comprehensive with examples)
  - Custom (Upload your own .docx template)

- **Report Format Default**:
  - Word (.docx)
  - HTML
  - Markdown
  - Plain Text

- **Branding**:
  - Organization logo upload
  - Color scheme (primary/secondary colors)
  - Custom footer text
  - Contact information defaults

**Storage**: Templates stored in Supabase Storage, metadata in `report_templates` table

---

### 3. Accessibility Statement Settings 📋
**Purpose**: Pre-fill common information for faster statement generation

**Settings**:
- **Organization Defaults**:
  - Organization name
  - Website URL
  - Contact email
  - Accessibility contact person
  - Phone number (optional)

- **Statement Content**:
  - Conformance target (AA vs AAA)
  - Methodology description
  - Technologies used (auto-detect or manual)
  - Testing tools list
  - Remediation timeline

- **Output Preferences**:
  - Default format (HTML/MD/TXT)
  - Include WCAG references
  - Include issue count
  - Include audit date

**Storage**: User settings in `user_settings` table

---

### 4. MCP Server Configuration 🔧
**Purpose**: Add custom MCP servers for enhanced AI capabilities

**Settings**:
- **Active MCP Servers**:
  - Fetch Server (Default - enabled)
  - WCAG Docs Server (Default - enabled)
  - Custom servers (user-added)

- **Add Custom Server**:
  - Server name
  - Server URL/path
  - Authentication (API key, token, etc.)
  - Enabled/disabled toggle
  - Test connection button

- **Server Priority**:
  - Drag-and-drop to reorder servers
  - Higher priority = consulted first

**Built-in Servers**:
```json
{
  "fetch": {
    "name": "Fetch Server",
    "description": "Retrieve web page content",
    "enabled": true,
    "readonly": true
  },
  "wcag-docs": {
    "name": "WCAG Documentation",
    "description": "WCAG 2.2 criterion details",
    "enabled": true,
    "readonly": true
  }
}
```

**Custom Server Example**:
```json
{
  "name": "Internal Guidelines",
  "url": "https://company.com/mcp/guidelines",
  "apiKey": "***",
  "enabled": true,
  "priority": 3
}
```

**Storage**: `mcp_servers` table with user_id FK

---

### 5. Audit Preferences ⚙️
**Purpose**: Customize default audit behavior

**Settings**:
- **Default Input Type**: URL / HTML / Snippet
- **Auto-save Audits**: Save to history automatically
- **Issue Severity Filter**: Show all / Critical+Serious only
- **Auto-select Issues**: Select all on load / Manual selection
- **Duplicate Detection**: Strict / Moderate / Disabled

---

### 6. UI Preferences 🎨
**Purpose**: Personalize the interface

**Settings**:
- **Theme**: Light / Dark / System
- **Language**: English / Swedish
- **Density**: Comfortable / Compact / Spacious
- **Font Size**: Small / Medium / Large
- **Keyboard Shortcuts**: Enable/disable

---

## Database Schema

### `user_settings` Table
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI Model Settings
  primary_model TEXT DEFAULT 'gemini-2.0-flash',
  fallback_model TEXT DEFAULT 'gpt-4o-mini',
  model_temperature DECIMAL(2,1) DEFAULT 0.3,
  model_max_tokens INTEGER DEFAULT 4000,
  model_timeout_seconds INTEGER DEFAULT 60,
  
  -- Report Settings
  default_template TEXT DEFAULT 'etu-standard',
  default_format TEXT DEFAULT 'word',
  organization_name TEXT,
  organization_logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#3b82f6',
  brand_secondary_color TEXT DEFAULT '#8b5cf6',
  
  -- Statement Settings
  statement_org_name TEXT,
  statement_website_url TEXT,
  statement_contact_email TEXT,
  statement_conformance_target TEXT DEFAULT 'AA',
  statement_default_format TEXT DEFAULT 'html',
  
  -- Audit Preferences
  default_input_type TEXT DEFAULT 'url',
  auto_save_audits BOOLEAN DEFAULT true,
  severity_filter TEXT DEFAULT 'all',
  
  -- UI Preferences
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en-US',
  ui_density TEXT DEFAULT 'comfortable',
  font_size TEXT DEFAULT 'medium',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### `mcp_servers` Table
```sql
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  api_key TEXT, -- Encrypted
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  readonly BOOLEAN DEFAULT false, -- Built-in servers can't be deleted
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- RLS Policies
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own MCP servers"
  ON mcp_servers FOR ALL
  USING (auth.uid() = user_id);
```

---

## Implementation Phases

### Phase 1: Foundation ✅ (Current)
- Database migrations for `user_settings` and `mcp_servers`
- Settings service layer
- Settings page skeleton with tabs

### Phase 2: AI Model Selection 🤖
- Model picker dropdown
- Model parameter sliders
- Test connection button
- Fallback logic in audit service

### Phase 3: Report Templates 📄
- Template selector
- Branding upload (logo)
- Color pickers
- Template preview

### Phase 4: Statement Defaults 📋
- Pre-fill organization info
- Conformance target selector
- Format preferences

### Phase 5: MCP Server Management 🔧
- List built-in servers
- Add custom server form
- Test connection
- Priority reordering (drag-drop)

### Phase 6: Polish ✨
- Settings import/export
- Reset to defaults button
- Settings search/filter
- Keyboard shortcuts

---

## UI Mockup

```
┌─────────────────────────────────────────────────────┐
│  Settings                                      ⚙️   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┬───────────────────────────────────┐  │
│  │ AI      │                                   │  │
│  │ Models  │  Primary Model                    │  │
│  ├─────────┤  ┌────────────────────────────┐   │  │
│  │ Report  │  │ Gemini 2.0 Flash       ▼  │   │  │
│  │ Templates│  └────────────────────────────┘   │  │
│  ├─────────┤                                   │  │
│  │ Statement│  Fallback Model                  │  │
│  │ Defaults │  ┌────────────────────────────┐   │  │
│  ├─────────┤  │ GPT-4o-mini            ▼  │   │  │
│  │ MCP     │  └────────────────────────────┘   │  │
│  │ Servers │                                   │  │
│  ├─────────┤  Temperature: 0.3  ─────●────     │  │
│  │ Audit   │                                   │  │
│  │ Prefs   │  Max Tokens: 4000                 │  │
│  ├─────────┤                                   │  │
│  │ UI      │  [Test Connection]                │  │
│  │ Theme   │                                   │  │
│  └─────────┴───────────────────────────────────┘  │
│                                                     │
│              [Save Changes]  [Reset to Defaults]   │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Create migration**: `008_create_user_settings.sql`
2. **Create service**: `src/lib/settingsService.ts`
3. **Create page**: `src/pages/Settings.tsx`
4. **Add route**: Update router to include `/settings`
5. **Add navigation**: Link in header/menu

---

## Open Questions

1. Should settings sync across devices automatically? (Yes via Supabase)
2. Allow exporting settings as JSON for backup? (Nice to have)
3. Organization-wide settings for teams? (Future feature)
4. Validate custom MCP servers before saving? (Yes, test connection)

---

## Security Considerations

- **API Keys**: Encrypt in database, never expose in client
- **MCP Server URLs**: Validate to prevent SSRF attacks
- **File Uploads**: Scan logos for malware
- **RLS Policies**: Ensure users only access their own settings
