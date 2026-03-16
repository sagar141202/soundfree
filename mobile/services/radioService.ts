import { api } from '../lib/api';
import type { Track } from '../stores/playerStore';

export async function fetchRadioTracks(seedTrack: Track): Promise<Track[]> {
  try {
    console.log('Radio: fetching more tracks based on', seedTrack.title);

    // Try recommendations endpoint first
    const { data: recs } = await api.get('/recommendations/similar', { params: { limit: 10 } });
    if (recs && recs.length > 0) {
      console.log(`Radio: got ${recs.length} similar tracks`);
      return recs;
    }

    // Fallback to search based on artist
    const { data: search } = await api.get('/search', {
      params: { q: seedTrack.artist, limit: 10 }
    });
    if (search && search.length > 0) {
      // Filter out the seed track
      const filtered = search.filter((t: Track) => t.video_id !== seedTrack.video_id);
      console.log(`Radio: got ${filtered.length} artist tracks`);
      return filtered.slice(0, 10);
    }

    return [];
  } catch (e: any) {
    console.error('Radio fetch error:', e?.message);
    return [];
  }
}
