/**
 * Supabase Storage utilities for document uploads
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'audit-documents';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface UploadDocumentResult {
  path: string;
  url: string;
  error?: string;
}

/**
 * Upload a document (PDF/DOCX) to Supabase Storage
 */
export async function uploadDocument(
  file: File,
  userId: string
): Promise<UploadDocumentResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        path: '',
        url: '',
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type) && 
        !file.name.endsWith('.pdf') && 
        !file.name.endsWith('.docx')) {
      return {
        path: '',
        url: '',
        error: 'Invalid file type. Only PDF and DOCX files are supported.',
      };
    }

    // Generate unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        path: '',
        url: '',
        error: error.message,
      };
    }

    // Get public URL (will require auth to access due to RLS policies)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get a signed URL for accessing a document
 * Signed URLs work even with private buckets
 */
export async function getDocumentUrl(
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return {
        url: '',
        error: error.message,
      };
    }

    return {
      url: data.signedUrl,
    };
  } catch (error) {
    console.error('Unexpected error getting signed URL:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Failed to get URL',
    };
  }
}

/**
 * Download a document from storage
 */
export async function downloadDocument(
  path: string
): Promise<{ data: Blob | null; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) {
      console.error('Error downloading document:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return { data };
  } catch (error) {
    console.error('Unexpected error downloading document:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * Delete a document from storage
 */
export async function deleteDocument(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * List documents for a user
 */
export async function listUserDocuments(
  userId: string
): Promise<{ files: Array<{ name: string; size: number; createdAt: string }>; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listing documents:', error);
      return {
        files: [],
        error: error.message,
      };
    }

    const files = data.map((file) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || '',
    }));

    return { files };
  } catch (error) {
    console.error('Unexpected error listing documents:', error);
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}
