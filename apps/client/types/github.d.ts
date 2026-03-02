export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  public_repos: number;
  private_repos?: number;
  owned_private_repos?: number;
  followers?: number;
  following?: number;
  plan?: {
    name: string;
    space: number;
    private_repos: number;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  size: number;
  language: string | null;
  languages_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
  topics: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  owner: {
    id: number;
    login: string;
    avatar_url: string;
    type: 'User' | 'Organization';
  };
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: 'base64' | 'utf-8';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubLanguages {
  [language: string]: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
  };
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubAuthToken {
  access_token: string;
  token_type: 'bearer';
  scope: string;
  expires_at?: string;
  refresh_token?: string;
  refresh_token_expires_at?: string;
}

export interface GitHubAuthState {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  scopes: string[];
}

export interface RepositoryAnalysis {
  id: string;
  repository: GitHubRepository;
  structure: RepositoryStructure;
  languages: GitHubLanguages;
  totalFiles: number;
  processedFiles: number;
  excludedFiles: string[];
  estimatedTokens: number;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface RepositoryStructure {
  root: DirectoryNode;
  flatFiles: FileNode[];
  totalSize: number;
  depth: number;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'directory';
  children: (DirectoryNode | FileNode)[];
  size: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file';
  extension: string;
  size: number;
  language?: string;
  sha: string;
  content?: string;
  isDocumentable: boolean;
  skipReason?: string;
}

export interface DocumentationRequest {
  repository: GitHubRepository;
  branch: string;
  includeFiles: string[];
  excludePatterns: string[];
  documentationStyle: 'comprehensive' | 'overview' | 'technical' | 'user-guide';
  includePrivateFiles: boolean;
  maxTokens?: number;
}

export interface DocumentationProgress {
  id: string;
  status:
    | 'initializing'
    | 'analyzing'
    | 'fetching'
    | 'processing'
    | 'generating'
    | 'completed'
    | 'failed';
  progress: number; // 0-100
  currentStep: string;
  totalFiles: number;
  processedFiles: number;
  estimatedTimeRemaining?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}
