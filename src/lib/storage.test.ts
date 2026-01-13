import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocument } from './storage';
import { supabase } from './supabase';

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

describe('uploadDocument', () => {
  const mockUserId = 'user-123';
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    mockUpload.mockResolvedValue({
      data: { path: 'some/path' },
      error: null,
    });

    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/doc.pdf' },
    });
  });

  it('should upload a valid PDF file successfully', async () => {
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    
    const result = await uploadDocument(file, mockUserId);

    expect(result.error).toBeUndefined();
    expect(result.url).toBe('https://example.com/doc.pdf');
    expect(supabase.storage.from).toHaveBeenCalledWith('audit-documents');
    expect(mockUpload).toHaveBeenCalled();
  });

  it('should upload a valid DOCX file successfully', async () => {
    const file = new File(['dummy content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    const result = await uploadDocument(file, mockUserId);

    expect(result.error).toBeUndefined();
    expect(result.url).toBe('https://example.com/doc.pdf'); // Mock returns same URL
  });

  it('should fail if file size exceeds limit', async () => {
    // Mock a large file (size is read-only, so we might need Object.defineProperty or a large buffer)
    // Creating a 26MB buffer is slow. Let's mock the file object directly if possible, or assume 25MB check is there.
    // Easier needed: just mock the size property if the environment allows, or create a file with specific size property.
    const file = {
      name: 'large.pdf',
      type: 'application/pdf',
      size: 26 * 1024 * 1024, // 26MB
    } as File;

    const result = await uploadDocument(file, mockUserId);

    expect(result.error).toContain('File size exceeds');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should fail if file type is invalid', async () => {
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    
    const result = await uploadDocument(file, mockUserId);

    expect(result.error).toContain('Invalid file type');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should handle supabase upload errors', async () => {
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: 'Upload failed' },
    });

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const result = await uploadDocument(file, mockUserId);

    expect(result.error).toBe('Upload failed');
  });
});
