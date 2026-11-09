'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarkedIds([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('facility_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setBookmarkedIds(data.map((row: any) => row.facility_id));
      }
    } catch (err) {
      console.warn('Bookmarks konnten nicht geladen werden:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const toggleBookmark = async (facilityId: string) => {
    if (!user) {
      alert('Bitte melden Sie sich an, um Favoriten zu speichern.');
      return;
    }

    const isSaved = bookmarkedIds.includes(facilityId);

    // Optimistic UI update
    if (isSaved) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== facilityId));
      try {
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('facility_id', facilityId);
      } catch (err) {
        console.error('Fehler beim Entfernen des Lesezeichens:', err);
        setBookmarkedIds((prev) => [...prev, facilityId]); // rollback
      }
    } else {
      setBookmarkedIds((prev) => [...prev, facilityId]);
      try {
        await supabase
          .from('user_bookmarks')
          .insert({ user_id: user.id, facility_id: facilityId });
      } catch (err) {
        console.error('Fehler beim Speichern des Lesezeichens:', err);
        setBookmarkedIds((prev) => prev.filter((id) => id !== facilityId)); // rollback
      }
    }
  };

  return {
    bookmarkedIds,
    isBookmarked: (id: string) => bookmarkedIds.includes(id),
    toggleBookmark,
    loadingBookmarks: loading,
  };
}
