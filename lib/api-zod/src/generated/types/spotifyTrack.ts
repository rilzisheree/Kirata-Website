
export interface SpotifyTrack {
  name: string;
  artist: string;
  /** @nullable */
  albumArt?: string | null;
  /** @nullable */
  spotifyUrl?: string | null;
  playedAt: string;
}
