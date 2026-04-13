
export interface AudioGuide {
  id: number;
  day_number?: number;
  title?: string;
  titleEn: string;
  titleMy: string;
  isCompleted: boolean;
  audioUrl?: string;
  fileId?: string;
  downloadUrl?: string;
  fileName?: string;
  shareLink?: string;
  date?: string;
  explanation?: string;
  coverImage?: string;
  transcript?: string;
}

export interface MorningState {
  date: string;
  audioGuides: AudioGuide[];
}
