import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { Song } from '../types';

// TODO: Replace with actual Firebase Web config
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "music-app-placeholder.firebaseapp.com",
  projectId: "music-app-placeholder",
  storageBucket: "music-app-placeholder.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const searchSongByNameInDb = async (queryStr: string): Promise<Song | null> => {
  try {
    const q = query(
      collection(db, 'songs'),
      where('title', '>=', queryStr),
      where('title', '<=', queryStr + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Song;
    }
    return null;
  } catch (error) {
    console.warn('Firebase query failed:', error);
    return null;
  }
};

export const checkSongInDb = async (songId: string): Promise<Song | null> => {
  try {
    const songDoc = await getDoc(doc(db, 'songs', songId));
    if (songDoc.exists()) {
      return songDoc.data() as Song;
    }
    return null;
  } catch (error) {
    console.warn('Firebase query failed (likely missing config):', error);
    return null;
  }
};

export const saveSongToDb = async (song: Song): Promise<void> => {
  try {
    await setDoc(doc(db, 'songs', song.id), song, { merge: true });
    console.log('Song saved to Firebase');
  } catch (error) {
    console.warn('Firebase save failed (likely missing config):', error);
  }
};
