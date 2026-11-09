'use client';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setBookmarkedIds([]);
      setLoading(false);
      return;
    }

    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const unsubscribe = onSnapshot(bookmarksRef, (snapshot) => {
      const ids = snapshot.docs.map((d) => d.id);
      setBookmarkedIds(ids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleBookmark = async (facilityId: string) => {
    if (!user) {
      alert('Bitte melde dich an, um Favoriten zu speichern.');
      return;
    }

    const bookmarkDoc = doc(db, 'users', user.uid, 'bookmarks', facilityId);
    if (bookmarkedIds.includes(facilityId)) {
      await deleteDoc(bookmarkDoc);
    } else {
      await setDoc(bookmarkDoc, {
        facilityId,
        savedAt: new Date().toISOString(),
      });
    }
  };

  return {
    bookmarkedIds,
    isBookmarked: (id: string) => bookmarkedIds.includes(id),
    toggleBookmark,
    loadingBookmarks: loading,
  };
}