#!/usr/bin/env python3
"""
Supabase Schema MCP Server

Provides Model Context Protocol tools for Supabase schema introspection.
Allows AI agents to query database schema, tables, columns, and relationships.
"""

import asyncio
import os
from typing import Any
import psycopg2
import psycopg2.extras
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv("SUPABASE_DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("SUPABASE_DB_PORT", "54322"))
DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
DB_USER = os.getenv("SUPABASE_DB_USER", "postgres")
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "postgres")

# Create MCP server instance
app = Server("supabase-schema-server")


def get_db_connection():
    """Create a database connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools."""
    return [
        Tool(
            name="list_tables",
            description="List all tables in the public schema",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="get_table_schema",
            description="Get detailed schema information for a specific table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table to inspect",
                    }
                },
                "required": ["table_name"],
            },
        ),
        Tool(
            name="get_table_relationships",
            description="Get foreign key relationships for a table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table",
                    }
                },
                "required": ["table_name"],
            },
        ),
        Tool(
            name="get_table_indexes",
            description="Get indexes for a specific table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table",
                    }
                },
                "required": ["table_name"],
            },
        ),
        Tool(
            name="get_rls_policies",
            description="Get Row Level Security policies for a table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table",
                    }
                },
                "required": ["table_name"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    conn = get_db_connection()

    try:
        if name == "list_tables":
            result = list_tables_impl(conn)
        elif name == "get_table_schema":
            result = get_table_schema_impl(conn, arguments["table_name"])
        elif name == "get_table_relationships":
            result = get_table_relationships_impl(conn, arguments["table_name"])
        elif name == "get_table_indexes":
            result = get_table_indexes_impl(conn, arguments["table_name"])
        elif name == "get_rls_policies":
            result = get_rls_policies_impl(conn, arguments["table_name"])
        else:
            result = f"Unknown tool: {name}"

        return [TextContent(type="text", text=result)]
    finally:
        conn.close()


def list_tables_impl(conn) -> str:
    """List all tables in the public schema."""
    query = """
        SELECT 
            table_name,
            obj_description(('public.' || table_name)::regclass, 'pg_class') as description
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()

    if not rows:
        return "No tables found in public schema."

    result = "Tables in public schema:\n\n"
    for row in rows:
        table_name = row["table_name"]
        description = row["description"] or "No description"
        result += f"- {table_name}: {description}\n"

    return result


def get_table_schema_impl(conn, table_name: str) -> str:
    """Get detailed schema for a table."""
    query = """
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            col_description(('public.' || %s)::regclass, ordinal_position) as column_description
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = %s
        ORDER BY ordinal_position;
    """
    cur = conn.cursor()
    cur.execute(query, (table_name, table_name))
    rows = cur.fetchall()
    cur.close()

    if not rows:
        return f"Table '{table_name}' not found."

    result = f"Schema for table '{table_name}':\n\n"
    result += "Column Name | Type | Nullable | Default | Description\n"
    result += "----------- | ---- | -------- | ------- | -----------\n"

    for row in rows:
        col_name = row["column_name"]
        data_type = row["data_type"]
        if row["character_maximum_length"]:
            data_type += f"({row['character_maximum_length']})"
        nullable = "YES" if row["is_nullable"] == "YES" else "NO"
        default = row["column_default"] or "-"
        description = row["column_description"] or "-"

        result += f"{col_name} | {data_type} | {nullable} | {default} | {description}\n"

def get_table_relationships_impl(conn, table_name: str) -> str:
    """Get foreign key relationships for a table."""
    query = """
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule,
            rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
            AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = %s;
    """
    cur = conn.cursor()
    cur.execute(query, (table_name,))
    rows = cur.fetchall()
    cur.close(
        AND tc.table_name = $1;
    """
    rows = await conn.fetch(query, table_name)

    if not rows:
        return f"No foreign key relationships found for table '{table_name}'."

    result = f"Foreign key relationships for '{table_name}':\n\n"

    for row in rows:
        result += f"- {row['column_name']} → {row['foreign_table_name']}.{row['foreign_column_name']}\n"
        result += f"  ON DELETE: {row['delete_rule']}, ON UPDATE: {row['update_rule']}\n\n"

    return result

def get_table_indexes_impl(conn, table_name: str) -> str:
    """Get indexes for a table."""
    query = """
        SELECT
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = %s
        ORDER BY indexname;
    """
    cur = conn.cursor()
    cur.execute(query, (table_name,))
    rows = cur.fetchall()
    cur.close(
    rows = await conn.fetch(query, table_name)

    if not rows:
        return f"No indexes found for table '{table_name}'."

    result = f"Indexes for table '{table_name}':\n\n"

    for row in rows:
        result += f"Index: {row['indexname']}\n"
        result += f"Definition: {row['indexdef']}\n\n"

def get_rls_policies_impl(conn, table_name: str) -> str:
    """Get RLS policies for a table."""
    # Check if RLS is enabled
    rls_query = """
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = %s AND relnamespace = 'public'::regnamespace;
    """
    cur = conn.cursor()
    cur.execute(rls_query, (table_name,))
    rls_row = cur.fetchone()

    if not rls_row:
        cur.close()
        return f"Table '{table_name}' not found."

    rls_enabled = rls_row["relrowsecurity"]

    # Get policies
    policies_query = """
        SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = %s
        ORDER BY policyname;
    """
    cur.execute(policies_query, (table_name,))
    rows = cur.fetchall()
    cur.close(
        ORDER BY policyname;
    """
    rows = await conn.fetch(policies_query, table_name)

    result = f"Row Level Security for table '{table_name}':\n\n"
    result += f"RLS Enabled: {'YES' if rls_enabled else 'NO'}\n\n"

    if not rows:
        result += "No RLS policies found.\n"
        return result

    result += "Policies:\n\n"

    for row in rows:
        result += f"Policy: {row['policyname']}\n"
        result += f"  Command: {row['cmd']}\n"
        result += f"  Permissive: {row['permissive']}\n"
        result += f"  Roles: {', '.join(row['roles'])}\n"
        if row["qual"]:
            result += f"  USING: {row['qual']}\n"
        if row["with_check"]:
            result += f"  WITH CHECK: {row['with_check']}\n"
        result += "\n"

    return result


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
