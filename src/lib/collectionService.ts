/**
 * Collection Service - Supabase Integration
 * 
 * Handles saving, loading, and managing issue collections
 */

import { supabase } from './supabase';

export interface IssueCollection {
  id: string;
  user_id: string;
  audit_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  issue_count?: number; // From view
}

export interface CollectionWithIssues extends IssueCollection {
  issue_ids: string[];
}

/**
 * Create a new collection from selected issues
 */
export async function saveCollection(
  auditId: string,
  name: string,
  issueIds: string[],
  description?: string
): Promise<{ collection: IssueCollection; error: Error | null }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create collection
    const { data: collection, error: collectionError } = await supabase
      .from('issue_collections')
      .insert({
        user_id: user.id,
        audit_id: auditId,
        name,
        description,
      })
      .select()
      .single();

    if (collectionError) {
      throw collectionError;
    }

    // Add issues to collection
    const collectionIssues = issueIds.map(issueId => ({
      collection_id: collection.id,
      issue_id: issueId,
    }));

    const { error: issuesError } = await supabase
      .from('collection_issues')
      .insert(collectionIssues);

    if (issuesError) {
      // Rollback: delete the collection if adding issues fails
      await supabase.from('issue_collections').delete().eq('id', collection.id);
      throw issuesError;
    }

    return { collection, error: null };
  } catch (error: any) {
    console.error('Save collection error:', error);
    return { 
      collection: null as any, 
      error: error instanceof Error ? error : new Error(error?.message || String(error))
    };
  }
}

/**
 * Get all collections for the current user
 */
export async function getUserCollections(
  auditId?: string
): Promise<{ collections: IssueCollection[]; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('collections_with_counts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Optionally filter by audit
    if (auditId) {
      query = query.eq('audit_id', auditId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { collections: data || [], error: null };
  } catch (error) {
    return { 
      collections: [], 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Get a specific collection with its issues
 */
export async function getCollection(
  collectionId: string
): Promise<{ collection: CollectionWithIssues | null; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('issue_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single();

    if (collectionError) {
      throw collectionError;
    }

    // Get issue IDs in this collection
    const { data: issueLinks, error: issuesError } = await supabase
      .from('collection_issues')
      .select('issue_id')
      .eq('collection_id', collectionId);

    if (issuesError) {
      throw issuesError;
    }

    const collectionWithIssues: CollectionWithIssues = {
      ...collection,
      issue_ids: issueLinks?.map(link => link.issue_id) || [],
    };

    return { collection: collectionWithIssues, error: null };
  } catch (error) {
    return { 
      collection: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Update a collection's name or description
 */
export async function updateCollection(
  collectionId: string,
  updates: { name?: string; description?: string }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('issue_collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  collectionId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('issue_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
