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
        // Get the best image resolution available
        const images = item.image;
        const artwork = images?.length > 0 ? images[images.length - 1].link : '';
        
        // Get the best download url
        const downloadUrls = item.downloadUrl;
        const highestQualityUrl = downloadUrls?.length > 0 ? downloadUrls[downloadUrls.length - 1].link : '';

        return {
          id: item.id.toString(),
          title: item.name,
          artist: item.primaryArtists || 'Unknown Artist',
          artwork: artwork,
          url: highestQualityUrl,
        };
      }).filter((song: Song) => song.url !== ''); // Ensure valid stream links
    }
    return [];
  } catch (error) {
    console.error('Error searching Saavn API:', error);
    return [];
  }
};

export const getSimilarSongs = async (songId: string): Promise<Song[]> => {
  try {
    // JioSaavn API often uses 'radios' or 'recommendations' for suggestions
    // Here we use the recommendations endpoint if supported, or a fallback search of the artist
    const response = await axios.get(`${API_BASE_URL}/songs/${songId}/suggestions`, {
      params: { limit: 10 }
    });
    
    if (response.data && response.data.data) {
      return response.data.data.map((item: any) => {
        const images = item.image;
        const artwork = images?.length > 0 ? images[images.length - 1].link : '';
        const downloadUrls = item.downloadUrl;
        const highestQualityUrl = downloadUrls?.length > 0 ? downloadUrls[downloadUrls.length - 1].link : '';

        return {
          id: item.id.toString(),
          title: item.name,
          artist: item.primaryArtists || 'Unknown Artist',
          artwork: artwork,
          url: highestQualityUrl,
        };
      }).filter((song: Song) => song.url !== '');
    }
    return [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};
