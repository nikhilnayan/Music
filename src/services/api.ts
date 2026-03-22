import axios from 'axios';
import { Song } from '../types';

const API_BASE_URL = 'https://jiosaavn-api-privatecvc2.vercel.app';

export const searchSongsOnJioSaavn = async (query: string): Promise<Song[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search/songs`, {
      params: { query: query, limit: 15 }
    });
    
    if (response.data && response.data.data?.results) {
      return response.data.data.results.map((item: any) => {
        const images = item.image;
        const artworkRaw = images?.length > 0 ? images[images.length - 1].link : '';
        const artwork = artworkRaw ? artworkRaw.replace('150x150', '500x500').replace('50x50', '500x500') : '';
        const downloadUrls = item.downloadUrl;
        const highestQualityUrl = downloadUrls?.length > 0 ? downloadUrls[downloadUrls.length - 1].link : '';

        return {
          id: item.id.toString(),
          title: item.name,
          artist: item.primaryArtists || 'Unknown Artist',
          artwork: artwork.replace('150x150', '500x500').replace('50x50', '500x500'),
          url: highestQualityUrl,
          duration: item.duration ? parseInt(item.duration) : 0,
        };
      }).filter((song: Song) => song.url !== '');
    }
    return [];
  } catch (error) {
    console.error('Error searching Saavn API:', error);
    return [];
  }
};

export const getSimilarSongs = async (song: Song): Promise<Song[]> => {
  try {
    const primaryArtist = song.artist.split(',')[0].trim();
    if (!primaryArtist || primaryArtist === 'Unknown Artist') return [];
    
    // Strictly suggest entirely from same primary artist / genre to stay in the same vibe
    const query = primaryArtist;
    const results = await searchSongsOnJioSaavn(query);
    
    // Shuffle the results for even more variety
    const shuffled = results.sort(() => Math.random() - 0.5);
    
    // Filter out the exact same song
    return shuffled.filter(s => s.id !== song.id);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};
