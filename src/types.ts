export interface DisplaySettings {
  icon16x16?: string;
}

export interface Track {
  key: string;
  title?: string;
  trackUrl?: string;
  duration?: number;
  fileSize?: number;
  channels?: number;
  format?: string;
  type?: string;
  overlayLabel?: string;
  display?: DisplaySettings;
  [key: string]: unknown;
}

export interface Chapter {
  key: string;
  title?: string;
  overlayLabel?: string;
  tracks?: Track[];
  display?: DisplaySettings;
  [key: string]: unknown;
}

export interface ContentBody {
  chapters?: Chapter[];
  [key: string]: unknown;
}

export interface CardMetadata {
  cover?: {
    imageL?: string;
    imageS?: string;
  };
  media?: {
    duration?: number;
    fileSize?: number;
    readableFileSize?: number;
  };
  [key: string]: unknown;
}

export interface Card {
  id?: string;
  cardId?: string;
  title?: string;
  content?: ContentBody;
  metadata?: CardMetadata;
  [key: string]: unknown;
}

export interface IconUploadResponse {
  displayIcon: {
    mediaId: string;
    userId?: string;
    displayIconId?: string;
    url?: string;
    new?: boolean;
  };
}
