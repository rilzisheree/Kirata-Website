import type { PresenceInputStatus } from './presenceInputStatus';

export interface PresenceInput {
  status: PresenceInputStatus;
  /** @nullable */
  currentApp?: string | null;
  currentApps?: string[];
  /** @nullable */
  currentGame?: string | null;
  /** @nullable */
  currentSong?: string | null;
  /** @nullable */
  currentSongArtist?: string | null;
  /** @nullable */
  currentSongAlbumArt?: string | null;
  /** @nullable */
  timeSpent?: string | null;
  /** @nullable */
  activityIcon?: string | null;
  /** @nullable */
  uptime?: string | null;
  /**
     * ISO 8601 timestamp of when the PC last booted
     * @nullable
     */
  bootTime?: string | null;
  /**
     * ISO 8601 timestamp of when the current activity started
     * @nullable
     */
  activityStartTime?: string | null;
}
