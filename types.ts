export interface UploadedFile {
  objectId: string;
  name: string;
  url: string;
  createdAt: Date;
  size: number;
  mimeType?: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFileId: string | null;
}