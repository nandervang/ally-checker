/**
 * Audit Module - Main Entry Point
 * 
 * Exports all audit functionality:
 * - runAudit: Execute accessibility audit
 * - getAudit: Fetch audit results
 * - getAuditIssues: Get issues for an audit
 * - getUserAudits: Get user's audit history
 */

export {
  runAudit,
  getAudit,
  getAuditIssues,
  getUserAudits,
  uploadDocumentForAudit,
} from './audit-service';

export {
  parseGeminiResponse,
} from './response-parser';

export {
  calculateMetrics,
  mergeMetrics,
} from './metrics';

export {
  deduplicateIssues,
  sortIssues,
} from './deduplication';

// NOTE: runGeminiAudit is not exported to avoid client-side imports
// It's only used server-side in /api/run-audit endpoint

// Re-export types
export type {
  InputType,
  AuditStatus,
  IssueSource,
  IssueSeverity,
  WCAGPrinciple,
  WCAGLevel,
  Issue,
  AuditMetrics,
  AuditResult,
  AuditInput,
  AuditProgress,
  AuditProgressCallback,
} from '@/types/audit';
