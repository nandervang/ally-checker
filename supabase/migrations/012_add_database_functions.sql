-- ============================================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ============================================================================
-- This migration adds automated functions for maintaining audit statistics
-- and cleaning up old data.
--
-- Functions:
-- - update_audit_counts(): Recalculates issue counts on an audit
-- - cleanup_old_audits(): Deletes audits older than 90 days
--
-- Triggers:
-- - update_audit_counts_trigger: Fires when issues are modified
-- ============================================================================

-- ============================================================================
-- FUNCTION: update_audit_counts
-- ============================================================================
-- Recalculates all issue counts for a specific audit.
-- Called by trigger when issues are inserted, updated, or deleted.
--
-- Parameters:
--   audit_uuid: UUID of the audit to update
--
-- Returns: void
--
-- Example:
--   SELECT update_audit_counts('audit-id-here');
-- ============================================================================

CREATE OR REPLACE FUNCTION update_audit_counts(audit_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_count INTEGER;
  critical_count INTEGER;
  serious_count INTEGER;
  moderate_count INTEGER;
  minor_count INTEGER;
  perceivable_count INTEGER;
  operable_count INTEGER;
  understandable_count INTEGER;
  robust_count INTEGER;
BEGIN
  -- Count issues by severity
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'serious'),
    COUNT(*) FILTER (WHERE severity = 'moderate'),
    COUNT(*) FILTER (WHERE severity = 'minor')
  INTO total_count, critical_count, serious_count, moderate_count, minor_count
  FROM issues
  WHERE audit_id = audit_uuid;

  -- Count issues by WCAG principle
  SELECT
    COUNT(*) FILTER (WHERE wcag_principle = 'perceivable'),
    COUNT(*) FILTER (WHERE wcag_principle = 'operable'),
    COUNT(*) FILTER (WHERE wcag_principle = 'understandable'),
    COUNT(*) FILTER (WHERE wcag_principle = 'robust')
  INTO perceivable_count, operable_count, understandable_count, robust_count
  FROM issues
  WHERE audit_id = audit_uuid;

  -- Update the audit record
  UPDATE audits
  SET
    total_issues = total_count,
    critical_issues = critical_count,
    serious_issues = serious_count,
    moderate_issues = moderate_count,
    minor_issues = minor_count,
    perceivable_issues = perceivable_count,
    operable_issues = operable_count,
    understandable_issues = understandable_count,
    robust_issues = robust_count,
    updated_at = NOW()
  WHERE id = audit_uuid;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION update_audit_counts(UUID) IS 'Recalculates all issue counts for a specific audit. Called by trigger when issues are modified.';

-- ============================================================================
-- TRIGGER: update_audit_counts_trigger
-- ============================================================================
-- Automatically updates audit counts when issues are inserted, updated, or deleted.
-- Fires AFTER each INSERT, UPDATE, or DELETE operation on the issues table.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_audit_counts_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For INSERT and UPDATE, use NEW.audit_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_audit_counts(NEW.audit_id);
  END IF;

  -- For DELETE, use OLD.audit_id
  IF TG_OP = 'DELETE' THEN
    PERFORM update_audit_counts(OLD.audit_id);
  END IF;

  -- For UPDATE, if audit_id changed, update both old and new audits
  IF TG_OP = 'UPDATE' AND NEW.audit_id != OLD.audit_id THEN
    PERFORM update_audit_counts(OLD.audit_id);
  END IF;

  RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS update_audit_counts_trigger ON issues;
CREATE TRIGGER update_audit_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_counts_trigger_fn();

-- Add comment to trigger
COMMENT ON TRIGGER update_audit_counts_trigger ON issues IS 'Automatically updates audit counts when issues are inserted, updated, or deleted.';

-- ============================================================================
-- FUNCTION: cleanup_old_audits
-- ============================================================================
-- Deletes audits older than the specified number of days.
-- By default, deletes audits older than 90 days (GDPR compliance).
-- CASCADE DELETE ensures related issues are also deleted.
--
-- Parameters:
--   days_old: Number of days (default: 90)
--
-- Returns: INTEGER (number of audits deleted)
--
-- Example:
--   SELECT cleanup_old_audits(90);  -- Delete audits older than 90 days
--   SELECT cleanup_old_audits(30);  -- Delete audits older than 30 days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audits(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audits older than specified days
  WITH deleted AS (
    DELETE FROM audits
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Log the cleanup operation
  RAISE NOTICE 'Cleaned up % audits older than % days', deleted_count, days_old;

  RETURN deleted_count;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION cleanup_old_audits(INTEGER) IS 'Deletes audits older than specified days (default 90). Returns count of deleted audits.';

-- ============================================================================
-- TEST DATA AND VERIFICATION
-- ============================================================================
-- Run these queries to verify the functions work correctly:
--
-- 1. Test update_audit_counts:
--    SELECT update_audit_counts((SELECT id FROM audits LIMIT 1));
--
-- 2. Test cleanup_old_audits (dry run):
--    SELECT COUNT(*) FROM audits WHERE created_at < NOW() - INTERVAL '90 days';
--
-- 3. Test cleanup_old_audits (actual cleanup):
--    SELECT cleanup_old_audits(90);
-- ============================================================================
