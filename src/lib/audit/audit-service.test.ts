import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocumentForAudit, createAudit } from './audit-service';
import { supabase } from '../supabase';
import { uploadDocument } from '../storage';

// Mock dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../storage', () => ({
  uploadDocument: vi.fn(),
}));

describe('Audit Service', () => {
  const mockUserId = 'user-123';
  const mockAuditId = 'audit-123';
  const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
  
  // Supabase chain mocks
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup basic Supabase mock chain
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
  });

  describe('uploadDocumentForAudit', () => {
    it('should upload document and create audit successfully', async () => {
      // Mock successful storage upload
      (uploadDocument as any).mockResolvedValue({
        path: 'user-123/123456-test.pdf',
        url: 'https://example.com/doc.pdf',
        error: undefined,
      });

      // Mock successful db insert
      mockSingle.mockResolvedValue({
        data: { id: mockAuditId },
        error: null,
      });

      const result = await uploadDocumentForAudit(mockFile, mockUserId);

      expect(result).toEqual({
        auditId: mockAuditId,
        documentPath: 'user-123/123456-test.pdf',
        documentType: 'pdf',
      });

      expect(uploadDocument).toHaveBeenCalledWith(mockFile, mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('audits');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUserId,
        input_type: 'document',
        input_value: 'test.pdf',
        document_path: 'user-123/123456-test.pdf',
        document_type: 'pdf',
        status: 'queued',
      }));
    });

    it('should throw error if storage upload fails', async () => {
      (uploadDocument as any).mockResolvedValue({
        path: '',
        url: '',
        error: 'Storage Unavailable',
      });

      await expect(uploadDocumentForAudit(mockFile, mockUserId))
        .rejects.toThrow('Document upload failed: Storage Unavailable');

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error if database insert fails', async () => {
      (uploadDocument as any).mockResolvedValue({
        path: 'path/doc.pdf',
        url: 'url',
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Insert Failed' },
      });

      await expect(uploadDocumentForAudit(mockFile, mockUserId))
        .rejects.toThrow('Failed to create audit: DB Insert Failed');
    });

    it('should handle docx files correctly', async () => {
      const docxFile = new File([''], 'test.docx', { type: 'application/docx' });
      
      (uploadDocument as any).mockResolvedValue({
        path: 'path/test.docx',
        url: 'url',
      });
      mockSingle.mockResolvedValue({ data: { id: mockAuditId }, error: null });

      const result = await uploadDocumentForAudit(docxFile, mockUserId);
      expect(result.documentType).toBe('docx');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ document_type: 'docx' }));
    });
  });

  describe('createAudit', () => {
    it('should create an audit record from input', async () => {
      mockSingle.mockResolvedValue({ data: { id: mockAuditId }, error: null });

      const input = {
        user_id: mockUserId,
        input_type: 'url' as const,
        input_value: 'https://example.com',
      };

      const auditId = await createAudit(input);

      expect(auditId).toBe(mockAuditId);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUserId,
        input_type: 'url',
        url: 'https://example.com',
        status: 'queued',
      }));
    });
  });
});
