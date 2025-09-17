import multer from "multer";
import { randomUUID } from "crypto";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import type { Request } from "express";

// File validation configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf"
];

// Custom error types for upload handling
export class UploadError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 400) {
    super(message);
    this.name = 'UploadError';
  }
}

export class FileSizeError extends UploadError {
  constructor(size: number) {
    super(`File size ${Math.round(size / (1024 * 1024) * 10) / 10}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 'FILE_TOO_LARGE', 413);
  }
}

export class FileTypeError extends UploadError {
  constructor(mimeType: string) {
    super(`File type ${mimeType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 'INVALID_FILE_TYPE', 415);
  }
}

// Interface for uploaded file information
export interface UploadedFile {
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
  objectPath: string;
  uploadUrl?: string;
}

// Interface for file upload request
export interface FileUploadRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
}

// Configure multer for memory storage
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new FileTypeError(file.mimetype));
      return;
    }
    cb(null, true);
  },
});

// Upload service for handling file operations
export class UploadService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Validates uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new UploadError("No file provided", "NO_FILE");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileSizeError(file.size);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new FileTypeError(file.mimetype);
    }
  }

  /**
   * Generates a secure file key with extension
   */
  private generateFileKey(originalName: string): string {
    const ext = originalName.split('.').pop() || '';
    const uuid = randomUUID();
    return ext ? `${uuid}.${ext}` : uuid;
  }

  /**
   * Gets the full object path for a file key
   */
  private getObjectPath(fileKey: string): string {
    const privateDir = this.objectStorageService.getPrivateObjectDir();
    return `${privateDir}/uploads/${fileKey}`;
  }

  /**
   * Uploads a single file to object storage
   */
  async uploadFile(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    this.validateFile(file);

    const fileKey = this.generateFileKey(file.originalname);
    const objectPath = this.getObjectPath(fileKey);
    const { bucketName, objectName } = this.parseObjectPathHelper(objectPath);

    try {
      // Get bucket and create file reference
      const bucket = objectStorageClient.bucket(bucketName);
      const fileObj = bucket.file(objectName);

      // Upload file buffer to object storage
      await fileObj.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Set ACL policy for the uploaded file
      await this.objectStorageService.trySetObjectEntityAclPolicy(
        `/objects/uploads/${fileKey}`,
        {
          owner: userId,
          visibility: "private", // Private by default for security
          aclRules: [], // Can be extended for sharing
        }
      );

      return {
        key: fileKey,
        fileName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        objectPath: `/objects/uploads/${fileKey}`,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new UploadError("Failed to upload file to storage", "UPLOAD_FAILED", 500);
    }
  }

  /**
   * Uploads multiple files to object storage
   */
  async uploadFiles(files: Express.Multer.File[], userId: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId));
    return Promise.all(uploadPromises);
  }

  /**
   * Generates a signed download URL for a file
   */
  async getDownloadUrl(fileKey: string, userId: string, ttlSec: number = 3600): Promise<string> {
    try {
      const objectPath = `/objects/uploads/${fileKey}`;
      const objectFile = await this.objectStorageService.getObjectEntityFile(objectPath);

      // Check if user has access to the file
      const hasAccess = await this.objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!hasAccess) {
        throw new UploadError("Access denied to this file", "ACCESS_DENIED", 403);
      }

      // Generate signed URL for download
      const objectPathObj = this.getObjectPath(fileKey);
      const { bucketName, objectName } = this.parseObjectPathHelper(objectPathObj);
      
      return await this.signObjectURLHelper({
        bucketName,
        objectName,
        method: "GET",
        ttlSec,
      });
    } catch (error) {
      if (error instanceof UploadError) {
        throw error;
      }
      console.error("Error generating download URL:", error);
      throw new UploadError("File not found", "FILE_NOT_FOUND", 404);
    }
  }

  /**
   * Deletes a file from object storage
   */
  async deleteFile(fileKey: string, userId: string): Promise<boolean> {
    try {
      const objectPath = `/objects/uploads/${fileKey}`;
      const objectFile = await this.objectStorageService.getObjectEntityFile(objectPath);

      // Check if user has write access to the file (owner or admin)
      const hasAccess = await this.objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.WRITE,
      });

      if (!hasAccess) {
        throw new UploadError("Access denied to delete this file", "ACCESS_DENIED", 403);
      }

      // Delete the file
      await objectFile.delete();
      return true;
    } catch (error) {
      if (error instanceof UploadError) {
        throw error;
      }
      console.error("Error deleting file:", error);
      throw new UploadError("Failed to delete file", "DELETE_FAILED", 500);
    }
  }

  /**
   * Gets file metadata
   */
  async getFileMetadata(fileKey: string, userId: string): Promise<any> {
    try {
      const objectPath = `/objects/uploads/${fileKey}`;
      const objectFile = await this.objectStorageService.getObjectEntityFile(objectPath);

      // Check if user has access to the file
      const hasAccess = await this.objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!hasAccess) {
        throw new UploadError("Access denied to this file", "ACCESS_DENIED", 403);
      }

      const [metadata] = await objectFile.getMetadata();
      return {
        key: fileKey,
        fileName: metadata.metadata?.originalName || fileKey,
        size: parseInt(String(metadata.size || "0")),
        mimeType: metadata.contentType,
        uploadedBy: metadata.metadata?.uploadedBy,
        uploadedAt: metadata.metadata?.uploadedAt,
        objectPath: `/objects/uploads/${fileKey}`,
      };
    } catch (error) {
      if (error instanceof UploadError) {
        throw error;
      }
      console.error("Error getting file metadata:", error);
      throw new UploadError("File not found", "FILE_NOT_FOUND", 404);
    }
  }

  // Helper methods that delegate to objectStorage.ts functions
  private parseObjectPathHelper(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }

  private async signObjectURLHelper({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}

// Export singleton instance
export const uploadService = new UploadService();