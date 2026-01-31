export type VersionType = 'Major Update' | 'Minor Update' | 'Tweak' | 'Initial';

export interface FileMetadata {
  originalName: string;
  timestamp: number;
  versionLabel: string;
  hash: string;
  size: number;
  storedPath?: string;
}

export interface ManuscriptVersion {
  id: string;
  content: string; // The extracted text content
  metadata: FileMetadata;
  similarityToPrevious: number | null; // Percentage 0-100
  changeType: VersionType;
  aiAnalysis?: string;
}

export interface Branch {
  id: string;
  name: string;
  versions: ManuscriptVersion[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  type: 'docx' | 'md' | 'txt';
  branches: Branch[];
  defaultBranchId: string;
  // Legacy support for migration (optional)
  versions?: ManuscriptVersion[];
  lastModified: number;
}
