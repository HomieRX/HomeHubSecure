import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, File, Image, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UploadedFile {
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
  objectPath: string;
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onComplete?: (files: UploadedFile[]) => void;
  onFilesChange?: (files: File[]) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  children?: ReactNode;
  disabled?: boolean;
  accept?: string;
}

/**
 * A comprehensive file upload component that provides drag-and-drop and button upload interface.
 * 
 * Features:
 * - Multiple file upload support
 * - Drag and drop interface
 * - File type and size validation
 * - Upload progress tracking
 * - File preview and management
 * - Integration with HomeHub backend upload API
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 5)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.allowedTypes - Array of allowed MIME types
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.onFilesChange - Callback function called when files are selected/removed
 * @param props.buttonClassName - Optional CSS class name for the upload button
 * @param props.buttonVariant - Button variant style
 * @param props.children - Content to be rendered inside the button
 * @param props.disabled - Whether the uploader is disabled
 * @param props.accept - File input accept attribute
 */
export function ObjectUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "application/pdf"
  ],
  onComplete,
  onFilesChange,
  buttonClassName,
  buttonVariant = "outline",
  children,
  disabled = false,
  accept,
}: ObjectUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB.`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `File ${file.name} has an unsupported type. Allowed types: ${allowedTypes.join(', ')}.`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "File Validation Error",
        description: errors.join('\n'),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles].slice(0, maxNumberOfFiles);
      setSelectedFiles(newFiles);
      onFilesChange?.(newFiles);

      if (newFiles.length > maxNumberOfFiles) {
        toast({
          title: "Too Many Files",
          description: `Only the first ${maxNumberOfFiles} files will be uploaded.`,
          variant: "destructive",
        });
      }
    }
  };

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  // Helper function to get CSRF token
  const getCSRFToken = async (): Promise<string> => {
    try {
      const res = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        return data.csrfToken || "";
      }
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error);
    }
    return "";
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Get CSRF token for the request
      const csrfToken = await getCSRFToken();
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(100);
        
        toast({
          title: "Upload Successful",
          description: `${selectedFiles.length} file(s) uploaded successfully.`,
        });

        // Invalidate any related queries
        queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
        
        onComplete?.(result.files);
        setSelectedFiles([]);
        onFilesChange?.([]);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred while uploading files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const defaultAccept = allowedTypes.join(',');

  return (
    <div className="space-y-4">
      {/* Upload Button and Drag Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxNumberOfFiles > 1}
          accept={accept || defaultAccept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading}
          data-testid="input-file-upload"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum {maxNumberOfFiles} files, up to {Math.round(maxFileSize / (1024 * 1024))}MB each
            </p>
          </div>
          <Button
            variant={buttonVariant}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className={buttonClassName}
            data-testid="button-file-select"
          >
            {children || (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border"
                data-testid={`file-item-${index}`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  data-testid={`button-remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && !uploading && (
        <Button
          onClick={uploadFiles}
          disabled={disabled || uploading}
          className="w-full"
          data-testid="button-upload-files"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}