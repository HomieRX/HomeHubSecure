import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image, FileText, Camera } from "lucide-react";

interface FileUploadProps {
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
  multiple?: boolean;
  className?: string;
  files?: File[];
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ["image/*"],
  label = "Upload Files",
  description = `Select up to ${maxFiles} files (max ${maxSizeMB}MB each)`,
  multiple = true,
  className,
  files = [],
  disabled = false
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isValidType) {
        alert(`File "${file.name}" is not a supported file type.`);
        continue;
      }

      // Check max files limit
      if (files.length + validFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        break;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFileSelect?.(validFiles);
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    onFileRemove?.(index);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full", className)} data-testid="file-upload">
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !dragOver && !disabled && "hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        data-testid="upload-area"
      >
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <h3 className="mb-2 text-sm font-medium" data-testid="upload-label">
            {label}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-4" data-testid="upload-description">
            {description}
          </p>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            data-testid="button-browse"
          >
            <Camera className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2">
            Drag & drop files here or click to browse
          </p>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        data-testid="file-input"
      />

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2" data-testid="selected-files">
          <h4 className="text-sm font-medium">Selected Files</h4>
          
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
              data-testid={`file-item-${index}`}
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div>
                  <div className="text-sm font-medium" data-testid={`file-name-${index}`}>
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`file-size-${index}`}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={disabled}
                data-testid={`button-remove-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}