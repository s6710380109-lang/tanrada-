export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'slide' | 'other';
export type EducationLevel =
  | 'ประถมศึกษา'
  | 'มัธยมศึกษาตอนต้น'
  | 'มัธยมศึกษาตอนปลาย'
  | 'อาชีวศึกษา/ปวช.-ปวส.'
  | 'อุดมศึกษา/มหาวิทยาลัย'
  | 'บุคคลทั่วไป';

export type ResourceStatus = 'published' | 'hidden' | 'deleted';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  level: EducationLevel;
  mediaType: MediaType;
  url: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorPhoto?: string;
  viewCount: number;
  favoriteCount: number;
  reportCount?: number;
  status: ResourceStatus;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceMediaType: MediaType;
  createdAt: string;
}

export type ReportReason = 'broken_link' | 'copyright' | 'inappropriate' | 'inaccurate' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail?: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLog {
  id: string;
  action: string;
  targetType: 'resource' | 'user' | 'setting';
  targetId: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  announcement: string;
  showAnnouncement: boolean;
  categories: string[];
  levels: EducationLevel[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  level: string;
  mediaType: string;
  sortBy: 'latest' | 'popular' | 'favorites';
}
