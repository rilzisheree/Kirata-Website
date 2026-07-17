
/**
 * online | idle | offline
 */
export type PresenceStatus = typeof PresenceStatus[keyof typeof PresenceStatus];


export const PresenceStatus = {
  online: 'online',
  idle: 'idle',
  offline: 'offline',
} as const;
