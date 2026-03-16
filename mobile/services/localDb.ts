import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('soundfree.db');
    await initSchema();
  }
  return db;
}

async function initSchema() {
  if (!db) return;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS downloaded_tracks (
      video_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      duration_ms INTEGER,
      thumbnail_url TEXT,
      local_path TEXT NOT NULL,
      downloaded_at TEXT DEFAULT (datetime('now')),
      file_size INTEGER DEFAULT 0
    );
  `);
}

export interface LocalTrack {
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number | null;
  thumbnail_url: string | null;
  local_path: string;
  downloaded_at?: string;
  file_size?: number;
}

export async function saveTrack(track: LocalTrack): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO downloaded_tracks
     (video_id, title, artist, album, duration_ms, thumbnail_url, local_path, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      track.video_id,
      track.title,
      track.artist,
      track.album ?? null,
      track.duration_ms ?? null,
      track.thumbnail_url ?? null,
      track.local_path,
      track.file_size ?? 0,
    ]
  );
}

export async function getTrack(videoId: string): Promise<LocalTrack | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalTrack>(
    'SELECT * FROM downloaded_tracks WHERE video_id = ?',
    [videoId]
  );
  return row ?? null;
}

export async function getAllTracks(): Promise<LocalTrack[]> {
  const db = await getDb();
  return await db.getAllAsync<LocalTrack>(
    'SELECT * FROM downloaded_tracks ORDER BY downloaded_at DESC'
  );
}

export async function deleteTrack(videoId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM downloaded_tracks WHERE video_id = ?',
    [videoId]
  );
}

export async function getDownloadCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM downloaded_tracks'
  );
  return row?.count ?? 0;
}

export async function getTotalSize(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT SUM(file_size) as total FROM downloaded_tracks'
  );
  return row?.total ?? 0;
}
