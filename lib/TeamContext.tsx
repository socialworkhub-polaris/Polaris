'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Organization, OrganizationMember, FacilityTeamNote, NoteCategory, TeamAnnouncement, AnnouncementPriority, TeamCalendarEvent, CalendarEventCategory } from '@/types/team';

interface TeamContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  loading: boolean;
  createTeam: (name: string) => Promise<Organization>;
  joinTeamByCode: (code: string) => Promise<Organization>;
  leaveTeam: (orgId: string) => Promise<void>;
  members: OrganizationMember[];
  loadMembers: () => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  notesCountByFacility: Record<string, number>;
  fetchNotesForFacility: (facilityId: string) => Promise<FacilityTeamNote[]>;
  addNoteForFacility: (facilityId: string, category: NoteCategory, content: string) => Promise<FacilityTeamNote>;
  deleteNote: (noteId: string) => Promise<void>;
  togglePinNote: (noteId: string, currentPin: boolean) => Promise<void>;
  refreshTeamNotesCount: () => Promise<void>;
  announcements: TeamAnnouncement[];
  loadAnnouncements: () => Promise<void>;
  createAnnouncement: (title: string, content: string, priority: AnnouncementPriority, isPinned?: boolean) => Promise<TeamAnnouncement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePinAnnouncement: (id: string, currentPin: boolean) => Promise<void>;
  allTeamFacilityNotes: FacilityTeamNote[];
  loadAllTeamFacilityNotes: () => Promise<void>;
  calendarEvents: TeamCalendarEvent[];
  loadCalendarEvents: () => Promise<void>;
  createCalendarEvent: (event: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: CalendarEventCategory;
    facilityId?: string;
    facilityName?: string;
    isCrossTeam?: boolean;
  }) => Promise<TeamCalendarEvent>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  startStripeCheckout: (target: string | { organizationId?: string; teamName?: string }) => Promise<void>;
  openBillingPortal: (orgId: string) => Promise<void>;
  updateSeats: (orgId: string, targetSeats: number) => Promise<void>;
  redeemTrialCode: (orgId: string, code: string) => Promise<{ success: boolean; message: string }>;
  updateMemberRole: (orgId: string, memberUserId: string, newRole: 'admin' | 'member') => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  organizations: [],
  currentOrganization: null,
  setCurrentOrganization: () => {},
  loading: true,
  createTeam: async () => { throw new Error('Not initialized'); },
  joinTeamByCode: async () => { throw new Error('Not initialized'); },
  leaveTeam: async () => {},
  members: [],
  loadMembers: async () => {},
  removeMember: async () => {},
  updateMemberRole: async () => {},
  notesCountByFacility: {},
  fetchNotesForFacility: async () => [],
  addNoteForFacility: async () => { throw new Error('Not initialized'); },
  deleteNote: async () => {},
  togglePinNote: async () => {},
  refreshTeamNotesCount: async () => {},
  announcements: [],
  loadAnnouncements: async () => {},
  createAnnouncement: async () => { throw new Error('Not initialized'); },
  deleteAnnouncement: async () => {},
  togglePinAnnouncement: async () => {},
  allTeamFacilityNotes: [],
  loadAllTeamFacilityNotes: async () => {},
  calendarEvents: [],
  loadCalendarEvents: async () => {},
  createCalendarEvent: async () => { throw new Error('Not initialized'); },
  deleteCalendarEvent: async () => {},
  startStripeCheckout: async () => {},
  openBillingPortal: async () => {},
  updateSeats: async () => {},
  redeemTrialCode: async () => ({ success: false, message: 'Not initialized' }),
  refreshOrganizations: async () => {},
});

export const useTeam = () => useContext(TeamContext);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [notesCountByFacility, setNotesCountByFacility] = useState<Record<string, number>>({});
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [allTeamFacilityNotes, setAllTeamFacilityNotes] = useState<FacilityTeamNote[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<TeamCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Set current organization and persist to localStorage
  const setCurrentOrganization = useCallback((org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (typeof window !== 'undefined') {
      if (org) {
        localStorage.setItem('polaris_active_team_id', org.id);
      } else {
        localStorage.removeItem('polaris_active_team_id');
      }
    }
  }, []);

  // 1. Load user's organizations
  const loadUserOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganizationState(null);
      setMembers([]);
      setNotesCountByFacility({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch organization_members join with organizations
      const { data: memberData, error: memberErr } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations (
            id,
            name,
            slug,
            invite_code,
            plan,
            created_at,
            stripe_customer_id,
            stripe_subscription_id,
            subscription_status,
            trial_ends_at,
            seat_limit
          )
        `)
        .eq('user_id', user.id);

      if (memberErr) {
        console.warn('Could not load organizations:', memberErr.message);
        setOrganizations([]);
        setCurrentOrganizationState(null);
        return;
      }

      if (memberData && memberData.length > 0) {
        const orgList: Organization[] = memberData
          .filter((m: any) => m.organization)
          .map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            inviteCode: m.organization.invite_code,
            plan: m.organization.plan,
            role: m.role,
            createdAt: m.organization.created_at,
            subscriptionStatus: m.organization.subscription_status,
            trialEndsAt: m.organization.trial_ends_at,
            seatLimit: m.organization.seat_limit || 10,
            stripeCustomerId: m.organization.stripe_customer_id,
            stripeSubscriptionId: m.organization.stripe_subscription_id,
          }));

        setOrganizations(orgList);

        // Restore previously selected team from localStorage or default to first
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('polaris_active_team_id') : null;
        const matching = orgList.find((o) => o.id === savedId);
        setCurrentOrganizationState(matching || orgList[0] || null);
      } else {
        setOrganizations([]);
        setCurrentOrganizationState(null);
      }
    } catch (err) {
      console.warn('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

  // 2. Load members of active organization
  const loadMembers = useCallback(async () => {
    if (!currentOrganization || !user) {
      setMembers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, user_email, user_name, joined_at')
        .eq('organization_id', currentOrganization.id)
        .order('joined_at', { ascending: true });

      if (!error && data) {
        setMembers(
          data.map((m: any) => ({
            id: m.id,
            organizationId: m.organization_id,
            userId: m.user_id,
            role: m.role,
            userEmail: m.user_email || 'Kolleg*in',
            userName: m.user_name || m.user_email?.split('@')[0] || 'Team-Mitglied',
            joinedAt: m.joined_at,
          }))
        );
      }
    } catch (err) {
      console.warn('Error loading team members:', err);
    }
  }, [currentOrganization, user]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // 3. Load aggregated team notes counts for all facilities
  const refreshTeamNotesCount = useCallback(async () => {
    if (!currentOrganization) {
      setNotesCountByFacility({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('facility_team_notes')
        .select('facility_id')
        .eq('organization_id', currentOrganization.id);

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((row: any) => {
          counts[row.facility_id] = (counts[row.facility_id] || 0) + 1;
        });
        setNotesCountByFacility(counts);
      }
    } catch (err) {
      console.warn('Error fetching notes count:', err);
    }
  }, [currentOrganization]);

  useEffect(() => {
    refreshTeamNotesCount();
  }, [refreshTeamNotesCount]);

  // Helper: Generate clean 6-character uppercase alphanumeric code (e.g. BER72K)
  const generateInviteCode = (name: string): string => {
    const prefix = name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${randomChars}`;
  };

  // 4. Create new Team
  const createTeam = async (name: string): Promise<Organization> => {
    if (!user) throw new Error('Bitte melden Sie sich an, um ein Team zu erstellen.');
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Bitte geben Sie einen Team-Namen ein.');

    const inviteCode = generateInviteCode(trimmedName);
    const userEmail = user.email || '';
    const userName = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Sozialarbeiter*in').trim();

    // Call stored procedure or direct insert
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_team', {
      p_name: trimmedName,
      p_invite_code: inviteCode,
      p_user_email: userEmail,
      p_user_name: userName,
    });

    if (rpcErr) {
      // Fallback to direct table inserts if RPC not available
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: trimmedName,
          slug,
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgErr) throw new Error(orgErr.message);

      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'admin',
        user_email: userEmail,
        user_name: userName,
      });

      const newOrg: Organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        inviteCode: org.invite_code,
        role: 'admin',
        createdAt: org.created_at,
      };

      setOrganizations((prev) => [newOrg, ...prev]);
      setCurrentOrganization(newOrg);
      return newOrg;
    }

    const created: Organization = {
      id: rpcData.id,
      name: rpcData.name,
      slug: rpcData.slug,
      inviteCode: rpcData.invite_code,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    setOrganizations((prev) => [created, ...prev]);
    setCurrentOrganization(created);
    return created;
  };

  // 5. Join Team by 6-char Code
  const joinTeamByCode = async (code: string): Promise<Organization> => {
    if (!user) throw new Error('Bitte melden Sie sich an, um einem Team beizutreten.');
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error('Bitte geben Sie einen gültigen Team-Code ein.');

    const userEmail = user.email || '';
    const userName = (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Sozialarbeiter*in').trim();

    const { data: rpcData, error: rpcErr } = await supabase.rpc('join_team_by_code', {
      p_code: cleanCode,
      p_user_email: userEmail,
      p_user_name: userName,
    });

    if (rpcErr) {
      throw new Error(rpcErr.message || 'Ungültiger Team-Code oder Beitritt fehlgeschlagen.');
    }

    const joinedOrg: Organization = {
      id: rpcData.id,
      name: rpcData.name,
      slug: rpcData.slug,
      inviteCode: rpcData.invite_code,
      role: rpcData.role as 'admin' | 'member',
      createdAt: new Date().toISOString(),
    };

    // Add to organizations list if not already present
    setOrganizations((prev) => {
      const exists = prev.some((o) => o.id === joinedOrg.id);
      return exists ? prev : [joinedOrg, ...prev];
    });

    setCurrentOrganization(joinedOrg);
    return joinedOrg;
  };

  // 6. Leave Team
  const leaveTeam = async (orgId: string): Promise<void> => {
    if (!user) return;

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    if (currentOrganization?.id === orgId) {
      const remaining = organizations.filter((o) => o.id !== orgId);
      setCurrentOrganization(remaining[0] || null);
    }
  };

  // 7. Remove Member (Admin action)
  const removeMember = async (memberId: string): Promise<void> => {
    if (!currentOrganization || !user) return;

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', currentOrganization.id);

    if (error) throw new Error(error.message);

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  // 8. Fetch Notes for specific facility
  const fetchNotesForFacility = async (facilityId: string): Promise<FacilityTeamNote[]> => {
    if (!currentOrganization) return [];

    try {
      const { data, error } = await supabase
        .from('facility_team_notes')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('facility_id', facilityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching facility team notes:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        facilityId: row.facility_id,
        organizationId: row.organization_id,
        authorId: row.author_id,
        authorName: row.author_name,
        category: row.category as NoteCategory,
        content: row.content,
        isPinned: !!row.is_pinned,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.warn('Error loading notes:', err);
      return [];
    }
  };

  // 9. Add Note for facility
  const addNoteForFacility = async (
    facilityId: string,
    category: NoteCategory,
    content: string
  ): Promise<FacilityTeamNote> => {
    if (!user || !currentOrganization) {
      throw new Error('Bitte wählen Sie ein aktives Team aus, um Notizen zu verfassen.');
    }

    const trimmed = content.trim();
    if (!trimmed) throw new Error('Bitte geben Sie einen Hinweistext ein.');

    const authorName = (
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Kolleg*in'
    ).trim();

    const { data, error } = await supabase
      .from('facility_team_notes')
      .insert({
        facility_id: facilityId,
        organization_id: currentOrganization.id,
        author_id: user.id,
        author_name: authorName,
        category,
        content: trimmed,
        is_pinned: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Increment notes count
    setNotesCountByFacility((prev) => ({
      ...prev,
      [facilityId]: (prev[facilityId] || 0) + 1,
    }));

    return {
      id: data.id,
      facilityId: data.facility_id,
      organizationId: data.organization_id,
      authorId: data.author_id,
      authorName: data.author_name,
      category: data.category as NoteCategory,
      content: data.content,
      isPinned: data.is_pinned,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  };

  // 10. Delete Note
  const deleteNote = async (noteId: string): Promise<void> => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('facility_team_notes')
      .delete()
      .eq('id', noteId)
      .eq('organization_id', currentOrganization.id);

    if (error) throw new Error(error.message);

    refreshTeamNotesCount();
  };

  // 11. Toggle Pin
  const togglePinNote = async (noteId: string, currentPin: boolean): Promise<void> => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('facility_team_notes')
      .update({ is_pinned: !currentPin })
      .eq('id', noteId)
      .eq('organization_id', currentOrganization.id);

    if (error) throw new Error(error.message);
  };


  // 12. Load general team announcements (Dienstübergabe / Schwarzes Brett)
  const loadAnnouncements = useCallback(async () => {
    if (!currentOrganization) {
      setAnnouncements([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_announcements')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(
          data.map((row: any) => ({
            id: row.id,
            organizationId: row.organization_id,
            authorId: row.author_id,
            authorName: row.author_name,
            priority: row.priority as AnnouncementPriority,
            title: row.title,
            content: row.content,
            isPinned: !!row.is_pinned,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
        );
      }
    } catch (err) {
      console.warn('Error loading announcements:', err);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // 13. Create new team announcement
  const createAnnouncement = async (
    title: string,
    content: string,
    priority: AnnouncementPriority = 'info',
    isPinned: boolean = false
  ): Promise<TeamAnnouncement> => {
    if (!user || !currentOrganization) {
      throw new Error('Kein aktives Team ausgewählt.');
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      throw new Error('Titel und Inhalt dürfen nicht leer sein.');
    }

    const authorName = (
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Kolleg*in'
    ).trim();

    const { data, error } = await supabase
      .from('team_announcements')
      .insert({
        organization_id: currentOrganization.id,
        author_id: user.id,
        author_name: authorName,
        priority,
        title: trimmedTitle,
        content: trimmedContent,
        is_pinned: isPinned,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const created: TeamAnnouncement = {
      id: data.id,
      organizationId: data.organization_id,
      authorId: data.author_id,
      authorName: data.author_name,
      priority: data.priority as AnnouncementPriority,
      title: data.title,
      content: data.content,
      isPinned: data.is_pinned,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setAnnouncements((prev) => [created, ...prev]);
    return created;
  };

  // 14. Delete announcement
  const deleteAnnouncement = async (id: string): Promise<void> => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('team_announcements')
      .delete()
      .eq('id', id)
      .eq('organization_id', currentOrganization.id);

    if (error) throw new Error(error.message);

    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // 15. Toggle pin announcement
  const togglePinAnnouncement = async (id: string, currentPin: boolean): Promise<void> => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('team_announcements')
      .update({ is_pinned: !currentPin })
      .eq('id', id)
      .eq('organization_id', currentOrganization.id);

    if (error) throw new Error(error.message);

    setAnnouncements((prev) =>
      prev
        .map((a) => (a.id === id ? { ...a, isPinned: !currentPin } : a))
        .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
    );
  };

  // 16. Load all facility notes written across Berlin for this team (Einrichtungs-Ticker)
  const loadAllTeamFacilityNotes = useCallback(async () => {
    if (!currentOrganization) {
      setAllTeamFacilityNotes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('facility_team_notes')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllTeamFacilityNotes(
          data.map((row: any) => ({
            id: row.id,
            facilityId: row.facility_id,
            organizationId: row.organization_id,
            authorId: row.author_id,
            authorName: row.author_name,
            category: row.category as NoteCategory,
            content: row.content,
            isPinned: !!row.is_pinned,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
        );
      }
    } catch (err) {
      console.warn('Error loading all facility notes:', err);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadAllTeamFacilityNotes();
  }, [loadAllTeamFacilityNotes]);
  // 17. Load calendar events (internal shifts & cross-team events)
  const loadCalendarEvents = useCallback(async () => {
    if (!currentOrganization) {
      setCalendarEvents([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_calendar_events')
        .select('*')
        .or(`organization_id.eq.${currentOrganization.id},is_cross_team.eq.true`)
        .order('start_time', { ascending: true });

      if (!error && data) {
        setCalendarEvents(
          data.map((row: any) => ({
            id: row.id,
            organizationId: row.organization_id,
            authorId: row.author_id,
            authorName: row.author_name,
            title: row.title,
            description: row.description || '',
            startTime: row.start_time,
            endTime: row.end_time,
            category: row.category as CalendarEventCategory,
            facilityId: row.facility_id || undefined,
            facilityName: row.facility_name || undefined,
            isCrossTeam: !!row.is_cross_team,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
        );
      }
    } catch (err) {
      console.warn('Error loading calendar events:', err);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  // 18. Create new calendar event
  const createCalendarEvent = async (eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: CalendarEventCategory;
    facilityId?: string;
    facilityName?: string;
    isCrossTeam?: boolean;
  }): Promise<TeamCalendarEvent> => {
    if (!user || !currentOrganization) {
      throw new Error('Kein aktives Team ausgewählt.');
    }

    const trimmedTitle = eventData.title.trim();
    if (!trimmedTitle) {
      throw new Error('Titel darf nicht leer sein.');
    }

    const authorName = (
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Kolleg*in'
    ).trim();

    const { data, error } = await supabase
      .from('team_calendar_events')
      .insert({
        organization_id: currentOrganization.id,
        author_id: user.id,
        author_name: authorName,
        title: trimmedTitle,
        description: eventData.description?.trim() || null,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        category: eventData.category,
        facility_id: eventData.facilityId || null,
        facility_name: eventData.facilityName || null,
        is_cross_team: !!eventData.isCrossTeam,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const created: TeamCalendarEvent = {
      id: data.id,
      organizationId: data.organization_id,
      authorId: data.author_id,
      authorName: data.author_name,
      title: data.title,
      description: data.description || '',
      startTime: data.start_time,
      endTime: data.end_time,
      category: data.category as CalendarEventCategory,
      facilityId: data.facility_id || undefined,
      facilityName: data.facility_name || undefined,
      isCrossTeam: !!data.is_cross_team,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setCalendarEvents((prev) => [...prev, created].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
    return created;
  };

  // 19. Delete calendar event
  const deleteCalendarEvent = async (id: string): Promise<void> => {
    if (!currentOrganization) return;

    const { error } = await supabase
      .from('team_calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };


  // 12. Billing Actions
  const startStripeCheckout = async (target: string | { organizationId?: string; teamName?: string }): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Nicht angemeldet.');

    const payload = typeof target === 'string' ? { organizationId: target } : target;

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Fehler beim Starten des Checkouts.');
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const openBillingPortal = async (orgId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Nicht angemeldet.');

    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ organizationId: orgId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Fehler beim Öffnen des Portals.');
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const updateSeats = async (orgId: string, targetSeats: number): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Nicht angemeldet.');

    const res = await fetch('/api/billing/update-seats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ organizationId: orgId, targetSeats }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Fehler beim Anpassen der Plätze.');
    await loadUserOrganizations();
  };

  const redeemTrialCode = async (orgId: string, code: string): Promise<{ success: boolean; message: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Nicht angemeldet.');

    const res = await fetch('/api/team/redeem-trial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ organizationId: orgId, code }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Fehler beim Einlösen des Codes.');
    await loadUserOrganizations();
    return { success: true, message: data.message };
  };

  const updateMemberRole = async (orgId: string, memberUserId: string, newRole: 'admin' | 'member'): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Nicht angemeldet.');

    const { data, error } = await supabase.rpc('update_member_role', {
      p_org_id: orgId,
      p_target_user_id: memberUserId,
      p_new_role: newRole,
    });

    if (error) {
      const { error: directErr } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', orgId)
        .eq('user_id', memberUserId);
      if (directErr) throw new Error(directErr.message || 'Fehler beim Aktualisieren der Rolle.');
    } else if (data && !data.success) {
      throw new Error(data.message || 'Fehler beim Aktualisieren der Rolle.');
    }

    await loadMembers();
    await loadUserOrganizations();
  };

  return (
    <TeamContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        loading,
        createTeam,
        joinTeamByCode,
        leaveTeam,
        members,
        loadMembers,
        removeMember,
        updateMemberRole,
        notesCountByFacility,
        fetchNotesForFacility,
        addNoteForFacility,
        deleteNote,
        togglePinNote,
        refreshTeamNotesCount,
        announcements,
        loadAnnouncements,
        createAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        allTeamFacilityNotes,
        loadAllTeamFacilityNotes,
        calendarEvents,
        loadCalendarEvents,
        createCalendarEvent,
        deleteCalendarEvent,
        startStripeCheckout,
        openBillingPortal,
        updateSeats,
        redeemTrialCode,
        refreshOrganizations: loadUserOrganizations,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
