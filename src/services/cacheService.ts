import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/music_cache`;

export const initCacheDirectory = async () => {
  try {
    const exists = await RNFS.exists(CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(CACHE_DIR);
    }
  } catch (error) {
    console.error('Failed to create cache directory', error);
  }
};

export const getCachedSongUri = async (songId: string): Promise<string | null> => {
  const filePath = `${CACHE_DIR}/${songId}.m4a`;
  const exists = await RNFS.exists(filePath);
  if (exists) {
    return `file://${filePath}`;
  }
  return null;
};

export const downloadAndCacheSong = async (song: Song): Promise<void> => {
  const filePath = `${CACHE_DIR}/${song.id}.m4a`;
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) return; // Already downloaded

    const options = {
      fromUrl: song.url,
      toFile: filePath,
      background: true,
    };
    
    await RNFS.downloadFile(options).promise;
    console.log('Song downloaded to cache:', filePath);
  } catch (error) {
    console.error('Error downloading song:', error);
  }
};
