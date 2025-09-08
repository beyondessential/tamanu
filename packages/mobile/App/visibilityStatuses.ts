export const VisibilityStatus = {
  Current: 'current',
  Historical: 'historical',
} as const;

export type VisibilityStatus = (typeof VisibilityStatus)[keyof typeof VisibilityStatus];
