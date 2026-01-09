# Supabase Schema MCP Server

Model Context Protocol server for Supabase database schema introspection.

## Features

- **List Tables**: Get all tables in the public schema
- **Table Schema**: View detailed column information
- **Relationships**: See foreign key constraints
- **Indexes**: List table indexes
- **RLS Policies**: View Row Level Security policies

## Installation

```bash
cd mcp-servers/supabase-schema-server
pip install -r requirements.txt
```

## Configuration

Create a `.env` file or export environment variables:

```bash
# Local Supabase (default)
SUPABASE_DB_HOST=127.0.0.1
SUPABASE_DB_PORT=54322
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=postgres

# Production Supabase
# SUPABASE_DB_HOST=db.xxxxxxxxxxxx.supabase.co
# SUPABASE_DB_PORT=5432
# SUPABASE_DB_PASSWORD=your-password
```

## Running

```bash
python server.py
```

## MCP Tools

### `list_tables`

List all tables in the public schema.

**Arguments**: None

**Example**:
```json
{
  "name": "list_tables",
  "arguments": {}
}
```

**Output**:
```
Tables in public schema:

- user_sessions: User session and preference data
- audits: Accessibility audit records
- issues: Accessibility issues from audits
- user_settings: User configuration
- issue_collections: Saved issue collections
- collection_issues: Issues within collections
```

### `get_table_schema`

Get detailed schema information for a specific table.

**Arguments**:
- `table_name` (string, required): Name of the table

**Example**:
```json
{
  "name": "get_table_schema",
  "arguments": {
    "table_name": "audits"
  }
}
```

**Output**:
```
Schema for table 'audits':

Column Name | Type | Nullable | Default | Description
----------- | ---- | -------- | ------- | -----------
id | uuid | NO | gen_random_uuid() | Primary key
user_id | uuid | NO | - | User who created the audit
input_type | text | NO | - | Type of input (url, html, snippet)
status | text | NO | 'queued' | Audit status
created_at | timestamp with time zone | NO | NOW() | Creation timestamp
...
```

### `get_table_relationships`

Get foreign key relationships for a table.

**Arguments**:
- `table_name` (string, required): Name of the table

**Example**:
```json
{
  "name": "get_table_relationships",
  "arguments": {
    "table_name": "issues"
  }
}
```

**Output**:
```
Foreign key relationships for 'issues':

- audit_id → audits.id
  ON DELETE: CASCADE, ON UPDATE: NO ACTION
```

### `get_table_indexes`

Get indexes for a specific table.

**Arguments**:
- `table_name` (string, required): Name of the table

**Example**:
```json
{
  "name": "get_table_indexes",
  "arguments": {
    "table_name": "audits"
  }
}
```

**Output**:
```
Indexes for table 'audits':

Index: audits_pkey
Definition: CREATE UNIQUE INDEX audits_pkey ON public.audits USING btree (id)

Index: idx_audits_user_id
Definition: CREATE INDEX idx_audits_user_id ON public.audits USING btree (user_id)

Index: idx_audits_created_at
Definition: CREATE INDEX idx_audits_created_at ON public.audits USING btree (created_at DESC)
```

### `get_rls_policies`

Get Row Level Security policies for a table.

**Arguments**:
- `table_name` (string, required): Name of the table

**Example**:
```json
{
  "name": "get_rls_policies",
  "arguments": {
    "table_name": "audits"
  }
}
```

**Output**:
```
Row Level Security for table 'audits':

RLS Enabled: YES

Policies:

Policy: Users can view their own audits
  Command: SELECT
  Permissive: PERMISSIVE
  Roles: public
  USING: (user_id = auth.uid())

Policy: Users can create their own audits
  Command: INSERT
  Permissive: PERMISSIVE
  Roles: public
  WITH CHECK: (user_id = auth.uid())
```

## Usage in Development

The server connects to your local Supabase instance by default. Make sure Supabase is running:

```bash
supabase start
```

Then use the MCP tools through your AI agent to inspect the database schema, understand relationships, and verify RLS policies.

## Security Notes

- **Never commit credentials**: Use `.env` files (gitignored)
- **Local only by default**: Server connects to localhost
- **Read-only access**: Server only performs SELECT queries
- **No data modification**: Schema introspection only

## Testing

Test the server using the MCP test script:

```bash
cd mcp-servers
python test_servers.py supabase-schema
```

Or test individual tools:

```python
# List all tables
python -c "import asyncio; from server import list_tables_impl, get_db_connection; asyncio.run(get_db_connection().then(lambda c: list_tables_impl(c)))"
```
