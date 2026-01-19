import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveCollection } from './collectionService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
    })),
  },
}));

describe('saveCollection', () => {
  const mockUser = { id: 'user-123' };
  const mockCollection = { id: 'col-123', name: 'My Collection' };
  
  // Mock implementations
  const mockFrom = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset chainable mocks
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
      delete: mockDelete,
      eq: mockEq,
    });

    // Make chain work
    mockInsert.mockReturnValue({ select: mockSelect }); // For first insert
    mockSelect.mockReturnValue({ single: mockSingle });
    
    // For second insert (collection_issues), insert returns Promise directly usually in mock logic, 
    // but in Supabase client it returns a builder. 
    // Wait, client code does: await supabase.from(...).insert(...) -> returning { error } directly?
    // In Supabase v2, insert returns a PostgrestFilterBuilder which is then awaited.
    // The previous mock setup `mockInsert.mockReturnValue({ select: mockSelect })` handles the first chain.
    // For the second chain: `supabase.from('collection_issues').insert(...)` should return a Promise<{ error }> (or an object with then)
    
    // Let's refine the mock strategy given the two different usages of `insert`
  });

  const setupSuccessPath = () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Chain 1: issue_collections insert
    mockInsert.mockImplementationOnce(() => ({ select: mockSelect }));
    mockSelect.mockImplementationOnce(() => ({ single: mockSingle }));
    mockSingle.mockResolvedValue({ data: mockCollection, error: null });

    // Chain 2: collection_issues insert
    mockInsert.mockImplementationOnce(() => Promise.resolve({ error: null }));
  };

  it('should save collection and issues successfully', async () => {
    setupSuccessPath();

    const result = await saveCollection('audit-1', 'My Collection', ['issue-1', 'issue-2']);

    expect(result.error).toBeNull();
    expect(result.collection).toEqual(mockCollection);
    
    // Verify Chain 1
    expect(supabase.from).toHaveBeenCalledWith('issue_collections');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: mockUser.id,
      audit_id: 'audit-1',
      name: 'My Collection',
      description: undefined,
    });

    // Verify Chain 2
    expect(supabase.from).toHaveBeenCalledWith('collection_issues');
    expect(mockInsert).toHaveBeenCalledWith([
      { collection_id: mockCollection.id, issue_id: 'issue-1' },
      { collection_id: mockCollection.id, issue_id: 'issue-2' },
    ]);
  });

  it('should handle unauthorized user', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: 'Auth error' });

    const result = await saveCollection('audit-1', 'My Collection', []);
    
    expect(result.error).toBeTruthy();
    expect(result.error?.message).toBe('User not authenticated');
  });

  it('should handle collection creation failure', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    mockInsert.mockImplementationOnce(() => ({ select: mockSelect }));
    mockSelect.mockImplementationOnce(() => ({ single: mockSingle }));
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

    const result = await saveCollection('audit-1', 'My Collection', []);

    expect(result.error?.message).toBe('DB Error');
  });

  it('should rollback if issue insertion fails', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Chain 1: Success
    mockInsert.mockImplementationOnce(() => ({ select: mockSelect }));
    mockSelect.mockImplementationOnce(() => ({ single: mockSingle }));
    mockSingle.mockResolvedValue({ data: mockCollection, error: null });

    // Chain 2: Failure
    // Note: mockInsert was called once above. The next call to mockInsert should fail.
    // However, I need to make sure the SECOND call to supabase.from returns a builder that has an insert method that returns failure
    // Complex mock handling.
    
    // Simplification: intercept calls based on arg
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'issue_collections') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCollection, error: null })
            })
          }),
          delete: mockDelete, // Used in rollback
        };
      }
      if (table === 'collection_issues') {
        return {
          insert: vi.fn().mockResolvedValue({ error: { message: 'Issue Insert Fail' } })
        };
      }
      return {};
    });

    // Mock delete chain
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });

    const result = await saveCollection('audit-1', 'My Collection', ['issue-1']);

    expect(result.error?.message).toBe('Issue Insert Fail');
    
    // Verify Rollback
    expect(supabase.from).toHaveBeenCalledWith('issue_collections'); // Called again for delete
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', mockCollection.id);
  });
});
