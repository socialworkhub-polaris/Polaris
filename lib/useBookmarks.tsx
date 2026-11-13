'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const LOCAL_STORAGE_KEY = 'polaris_bookmarks';

interface BookmarkContextType {
  bookmarkedIds: string[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (facilityId: string) => Promise<void>;
  loadingBookmarks: boolean;
}

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarkedIds: [],
  isBookmarked: () => false,
  toggleBookmark: async () => {},
  loadingBookmarks: false,
});

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Initial aus localStorage laden (sofort verfügbar, auch offline & ohne Login)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBookmarkedIds(parsed);
        }
      }
    } catch (e) {
      console.warn('Konnte lokale Favoriten nicht lesen:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Wenn Benutzer angemeldet ist: Supabase synchronisieren
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const syncWithSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('user_bookmarks')
          .select('facility_id')
          .eq('user_id', user.id);

        if (!error && data && isMounted) {
          const remoteIds = data.map((row: any) => row.facility_id);
          
          setBookmarkedIds((prevLocal) => {
            // Union aus lokalen und Cloud-Lesezeichen bilden
            const merged = Array.from(new Set([...prevLocal, ...remoteIds]));
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Cloud-Bookmarks konnten nicht synchronisiert werden:', err);
      }
    };

    syncWithSupabase();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 3. Toggle Bookmark Funktion (Gated to registered accounts)
  const toggleBookmark = useCallback(async (facilityId: string) => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polaris:open-auth'));
      }
      return;
    }

    setBookmarkedIds((prev) => {
      const isSaved = prev.includes(facilityId);
      const next = isSaved
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId];

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Konnte Favorit lokal nicht speichern:', e);
      }

      // Falls angemeldet: Asynchron in Supabase spiegeln
      if (user) {
        if (isSaved) {
          supabase
            .from('user_bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('facility_id', facilityId)
            .then(({ error }) => {
              if (error) console.error('Fehler beim Löschen des Lesezeichens in Supabase:', error);
            });
        } else {
          supabase
            .from('user_bookmarks')
            .insert({ user_id: user.id, facility_id: facilityId })
            .then(({ error }) => {
              if (error) console.error('Fehler beim Speichern des Lesezeichens in Supabase:', error);
            });
        }
      }

      return next;
    });
  }, [user]);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.includes(id),
    [bookmarkedIds]
  );

  return (
    <BookmarkContext.Provider
      value={{
        bookmarkedIds,
        isBookmarked,
        toggleBookmark,
        loadingBookmarks: loading,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
