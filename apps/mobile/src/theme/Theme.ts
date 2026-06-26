export const Theme = {
  colors: {
    background: '#0f0c29',
    surface: 'rgba(255, 255, 255, 0.05)',
    primary: '#8b5cf6',
    secondary: '#d946ef',
    accent: '#3b82f6',
    text: '#ffffff',
    textMuted: '#9ca3af',
    error: '#ef4444',
    border: 'rgba(255, 255, 255, 0.1)',
    glass: 'rgba(255, 255, 255, 0.08)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  gradients: {
    primary: ['#8b5cf6', '#d946ef'] as const,
    dark: ['#0f0c29', '#302b63', '#24243e'] as const,
  }
};
