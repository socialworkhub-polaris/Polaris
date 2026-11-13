'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export interface UserFacilityNote {
  id?: string;
  facilityId: string;
  content: string;
  updatedAt?: string;
}

export function usePersonalNotes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNoteForFacility = useCallback(
    async (facilityId: string): Promise<string> => {
      if (!user) return '';
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('user_facility_notes')
          .select('content')
          .eq('user_id', user.id)
          .eq('facility_id', facilityId)
          .maybeSingle();

        if (err) throw err;
        return data?.content || '';
      } catch (err: any) {
        console.warn('Fehler beim Laden der privaten Notiz:', err);
        setError(err.message);
        return '';
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const saveNoteForFacility = useCallback(
    async (facilityId: string, content: string): Promise<boolean> => {
      if (!user) {
        throw new Error('Bitte erstelle ein Fachkraft-Konto, um persönliche Notizen zu speichern.');
      }

      setLoading(true);
      setError(null);
      try {
        const trimmed = content.trim();
        if (!trimmed) {
          // Delete empty note
          const { error: delErr } = await supabase
            .from('user_facility_notes')
            .delete()
            .eq('user_id', user.id)
            .eq('facility_id', facilityId);

          if (delErr) throw delErr;
          return true;
        }

        const { error: upsertErr } = await supabase
          .from('user_facility_notes')
          .upsert(
            {
              user_id: user.id,
              facility_id: facilityId,
              content: trimmed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,facility_id' }
          );

        if (upsertErr) throw upsertErr;
        return true;
      } catch (err: any) {
        console.error('Fehler beim Speichern der privaten Notiz:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    getNoteForFacility,
    saveNoteForFacility,
    loading,
    error,
  };
}
