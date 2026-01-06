-- Migration: Create Issue Collections Tables
-- Description: Allow users to save, name, and reuse issue selections as collections
-- Created: 2026-01-06

-- ================================================
-- ISSUE COLLECTIONS TABLE
-- ================================================
-- Stores named collections of issues from audits
CREATE TABLE IF NOT EXISTS public.issue_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

-- ================================================
-- COLLECTION ISSUES JOIN TABLE
-- ================================================
-- Many-to-many relationship between collections and issues
CREATE TABLE IF NOT EXISTS public.collection_issues (
    collection_id UUID NOT NULL REFERENCES public.issue_collections(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Primary key on both columns (prevents duplicate entries)
    PRIMARY KEY (collection_id, issue_id)
);

-- ================================================
-- INDEXES
-- ================================================
-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.issue_collections(user_id);

-- Fast lookup by audit
CREATE INDEX IF NOT EXISTS idx_collections_audit_id ON public.issue_collections(audit_id);

-- Fast lookup of issues in a collection
CREATE INDEX IF NOT EXISTS idx_collection_issues_collection_id ON public.collection_issues(collection_id);

-- Fast lookup by created date (for recent collections)
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.issue_collections(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
-- Enable RLS on both tables
ALTER TABLE public.issue_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own collections
CREATE POLICY "Users can view own collections"
    ON public.issue_collections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own collections
CREATE POLICY "Users can create own collections"
    ON public.issue_collections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own collections
CREATE POLICY "Users can update own collections"
    ON public.issue_collections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own collections
CREATE POLICY "Users can delete own collections"
    ON public.issue_collections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can view issues in their collections
CREATE POLICY "Users can view issues in own collections"
    ON public.collection_issues
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.issue_collections
            WHERE id = collection_id
            AND user_id = auth.uid()
        )
    );

-- Policy: Users can add issues to their collections
CREATE POLICY "Users can add issues to own collections"
    ON public.collection_issues
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.issue_collections
            WHERE id = collection_id
            AND user_id = auth.uid()
        )
    );

-- Policy: Users can remove issues from their collections
CREATE POLICY "Users can remove issues from own collections"
    ON public.collection_issues
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.issue_collections
            WHERE id = collection_id
            AND user_id = auth.uid()
        )
    );

-- ================================================
-- TRIGGERS
-- ================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_timestamp
    BEFORE UPDATE ON public.issue_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_updated_at();

-- ================================================
-- HELPER VIEWS
-- ================================================
-- View: Collections with issue count
CREATE OR REPLACE VIEW public.collections_with_counts AS
SELECT 
    c.id,
    c.user_id,
    c.audit_id,
    c.name,
    c.description,
    c.created_at,
    c.updated_at,
    COUNT(ci.issue_id) as issue_count
FROM public.issue_collections c
LEFT JOIN public.collection_issues ci ON c.id = ci.collection_id
GROUP BY c.id, c.user_id, c.audit_id, c.name, c.description, c.created_at, c.updated_at;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issue_collections TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.collection_issues TO authenticated;
GRANT SELECT ON public.collections_with_counts TO authenticated;
