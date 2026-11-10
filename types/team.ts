export type TeamRole = 'admin' | 'member';

export type NoteCategory = 'contact_person' | 'intake_tip' | 'warning' | 'general';

export type AnnouncementPriority = 'urgent' | 'important' | 'info';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  plan?: string;
  role: TeamRole;
  createdAt?: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: TeamRole;
  userEmail?: string;
  userName?: string;
  joinedAt: string;
}

export interface FacilityTeamNote {
  id: string;
  facilityId: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  category: NoteCategory;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  facilityName?: string;
  facilityDistrict?: string;
}

export interface TeamAnnouncement {
  id: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  priority: AnnouncementPriority;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}
