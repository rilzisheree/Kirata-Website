
export type PresenceInputStatus = typeof PresenceInputStatus[keyof typeof PresenceInputStatus];


export const PresenceInputStatus = {
  online: 'online',
  idle: 'idle',
  offline: 'offline',
} as const;
