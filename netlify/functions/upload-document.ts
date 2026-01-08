import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, getCorsHeaders, createAuthErrorResponse } from "./lib/auth";

/**
 * Document Upload Function
 * 
 * Handles file uploads to Supabase Storage for document accessibility auditing.
 * Returns the storage path for use in subsequent audit requests.
 * 
 * Authentication: Requires X-Report-Service-Key header (if REPORT_SERVICE_KEY env var is set)
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const headers = getCorsHeaders();

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Validate authentication
  const auth = validateApiKey(event);
  if (!auth.isAuthenticated) {
    return createAuthErrorResponse(auth.error!);
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    // Get auth token from header
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized - missing token" }),
      };
    }

    const token = authHeader.substring(7);

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized - invalid token" }),
      };
    }

    // Parse multipart form data
    // Note: Netlify Functions don't natively support multipart/form-data parsing
    // We'll need to use the body as base64 and parse it
    const contentType = event.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
      };
    }

    // For now, we'll use a simplified approach expecting base64-encoded file
    // In production, you'd want to use a proper multipart parser like 'busboy'
    const body = JSON.parse(event.body || "{}");
    
    if (!body.file || !body.filename || !body.contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Missing required fields: file (base64), filename, contentType" 
        }),
      };
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!validTypes.includes(body.contentType) && 
        !body.filename.endsWith(".pdf") && 
        !body.filename.endsWith(".docx")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Invalid file type. Only PDF and DOCX files are supported." 
        }),
      };
    }

    // Validate file size (25MB limit)
    const fileBuffer = Buffer.from(body.file, "base64");
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (fileBuffer.length > maxSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` 
        }),
      };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = body.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audit-documents")
      .upload(filePath, fileBuffer, {
        contentType: body.contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Upload failed",
          details: uploadError.message,
        }),
      };
    }

    // Get signed URL for the uploaded file
    const { data: urlData, error: urlError } = await supabase.storage
      .from("audit-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      // Continue anyway, file is uploaded
    }

    // Determine document type
    const documentType = body.filename.endsWith(".pdf") ? "pdf" : "docx";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        path: uploadData.path,
        signedUrl: urlData?.signedUrl,
        documentType,
        userId: user.id,
      }),
    };

  } catch (error) {
    console.error("Document upload error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
