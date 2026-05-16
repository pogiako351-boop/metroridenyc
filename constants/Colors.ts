export const Colors = {
  bg: '#121212',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  cardHigh: '#2A2A2A',
  gold: '#FFD700',
  goldDark: '#D4AF37',
  white: '#FFFFFF',
  muted: '#888888',
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#F44336',
  blue: '#2196F3',
  border: '#2E2E2E',
  overlay: 'rgba(0,0,0,0.7)',
  // Semantic aliases for consistency
  warning: '#FFC107',   // Amber — used for warnings
  error: '#F44336',     // Red — used for errors
  success: '#4CAF50',   // Green — used for success states
} as const;

export const SubwayLines: Record<string, { bg: string; text: string }> = {
  A: { bg: '#2850AD', text: '#FFFFFF' },
  C: { bg: '#2850AD', text: '#FFFFFF' },
  E: { bg: '#2850AD', text: '#FFFFFF' },
  B: { bg: '#FF6319', text: '#FFFFFF' },
  D: { bg: '#FF6319', text: '#FFFFFF' },
  F: { bg: '#FF6319', text: '#FFFFFF' },
  M: { bg: '#FF6319', text: '#FFFFFF' },
  G: { bg: '#6CBE45', text: '#FFFFFF' },
  J: { bg: '#996633', text: '#FFFFFF' },
  Z: { bg: '#996633', text: '#FFFFFF' },
  L: { bg: '#A7A9AC', text: '#000000' },
  N: { bg: '#FCCC0A', text: '#000000' },
  Q: { bg: '#FCCC0A', text: '#000000' },
  R: { bg: '#FCCC0A', text: '#000000' },
  W: { bg: '#FCCC0A', text: '#000000' },
  '1': { bg: '#EE352E', text: '#FFFFFF' },
  '2': { bg: '#EE352E', text: '#FFFFFF' },
  '3': { bg: '#EE352E', text: '#FFFFFF' },
  '4': { bg: '#00933C', text: '#FFFFFF' },
  '5': { bg: '#00933C', text: '#FFFFFF' },
  '6': { bg: '#00933C', text: '#FFFFFF' },
  '7': { bg: '#B933AD', text: '#FFFFFF' },
  S: { bg: '#808183', text: '#FFFFFF' },
};
