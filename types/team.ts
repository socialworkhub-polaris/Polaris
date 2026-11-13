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
  subscriptionStatus?: string;
  trialEndsAt?: string;
  seatLimit?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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

export type CalendarEventCategory = 'shift' | 'handover' | 'outreach' | 'event' | 'deadline';

export interface TeamCalendarEvent {
  id: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category: CalendarEventCategory;
  facilityId?: string;
  facilityName?: string;
  isCrossTeam?: boolean;
  createdAt: string;
  updatedAt?: string;
}
