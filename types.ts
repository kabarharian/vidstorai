export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface DownloadState {
  isDownloading: boolean;
  message: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';