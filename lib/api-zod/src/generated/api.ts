import * as zod from 'zod';


/**
 * Returns server health status
 * @summary Health check
 */
export const HealthCheckResponse = zod.object({
  "status": zod.string()
})


/**
 * Returns the current real-time presence status (online/idle/offline, current app, game, song, etc.)
 * @summary Get current presence
 */
export const GetPresenceResponse = zod.object({
  "status": zod.enum(['online', 'idle', 'offline']).describe('online | idle | offline'),
  "currentApp": zod.string().nullish().describe('Currently open application (legacy, prefer currentApps)'),
  "currentApps": zod.array(zod.string()).optional().describe('All currently open\/visible apps'),
  "currentGame": zod.string().nullish().describe('Currently playing game'),
  "currentSong": zod.string().nullish().describe('Currently listening to song'),
  "currentSongArtist": zod.string().nullish().describe('Artist of current song'),
  "currentSongAlbumArt": zod.string().nullish().describe('URL to album art'),
  "timeSpent": zod.string().nullish().describe('Human-readable time spent in current activity (e.g. \"2h 15m\") — legacy, prefer activityStartTime'),
  "activityIcon": zod.string().nullish().describe('Icon URL or emoji for current activity'),
  "uptime": zod.string().nullish().describe('Human-readable PC uptime (e.g. \"3h 24m\") — legacy, prefer bootTime'),
  "bootTime": zod.string().nullish().describe('ISO 8601 timestamp of when the PC last booted'),
  "activityStartTime": zod.string().nullish().describe('ISO 8601 timestamp of when the current activity started'),
  "lastUpdated": zod.string().describe('ISO 8601 timestamp of last update'),
  "cpuPercent": zod.number().nullish().describe('CPU usage 0-100'),
  "ramPercent": zod.number().nullish().describe('RAM usage 0-100'),
  "gpuPercent": zod.number().nullish().describe('GPU usage 0-100')
})


/**
 * Updates the presence state. Intended to be called by a desktop application.
 * @summary Update presence
 */
export const UpdatePresenceBody = zod.object({
  "status": zod.enum(['online', 'idle', 'offline']),
  "currentApp": zod.string().nullish(),
  "currentApps": zod.array(zod.string()).optional(),
  "currentGame": zod.string().nullish(),
  "currentSong": zod.string().nullish(),
  "currentSongArtist": zod.string().nullish(),
  "currentSongAlbumArt": zod.string().nullish(),
  "timeSpent": zod.string().nullish(),
  "activityIcon": zod.string().nullish(),
  "uptime": zod.string().nullish(),
  "bootTime": zod.string().nullish().describe('ISO 8601 timestamp of when the PC last booted'),
  "activityStartTime": zod.string().nullish().describe('ISO 8601 timestamp of when the current activity started'),
  "cpuPercent": zod.number().nullish(),
  "ramPercent": zod.number().nullish(),
  "gpuPercent": zod.number().nullish()
})

export const UpdatePresenceResponse = zod.object({
  "status": zod.enum(['online', 'idle', 'offline']).describe('online | idle | offline'),
  "currentApp": zod.string().nullish().describe('Currently open application (legacy, prefer currentApps)'),
  "currentApps": zod.array(zod.string()).optional().describe('All currently open\/visible apps'),
  "currentGame": zod.string().nullish().describe('Currently playing game'),
  "currentSong": zod.string().nullish().describe('Currently listening to song'),
  "currentSongArtist": zod.string().nullish().describe('Artist of current song'),
  "currentSongAlbumArt": zod.string().nullish().describe('URL to album art'),
  "timeSpent": zod.string().nullish().describe('Human-readable time spent in current activity (e.g. \"2h 15m\") — legacy, prefer activityStartTime'),
  "activityIcon": zod.string().nullish().describe('Icon URL or emoji for current activity'),
  "uptime": zod.string().nullish().describe('Human-readable PC uptime (e.g. \"3h 24m\") — legacy, prefer bootTime'),
  "bootTime": zod.string().nullish().describe('ISO 8601 timestamp of when the PC last booted'),
  "activityStartTime": zod.string().nullish().describe('ISO 8601 timestamp of when the current activity started'),
  "lastUpdated": zod.string().describe('ISO 8601 timestamp of last update'),
  "cpuPercent": zod.number().nullish().describe('CPU usage 0-100'),
  "ramPercent": zod.number().nullish().describe('RAM usage 0-100'),
  "gpuPercent": zod.number().nullish().describe('GPU usage 0-100')
})


/**
 * @summary Get recently played Spotify tracks
 */
export const GetSpotifyRecentResponse = zod.object({
  "tracks": zod.array(zod.object({
  "name": zod.string(),
  "artist": zod.string(),
  "albumArt": zod.string().nullish(),
  "spotifyUrl": zod.string().nullish(),
  "playedAt": zod.string()
}))
})


