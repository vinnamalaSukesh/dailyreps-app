import { DarkTheme } from 'expo-router';

/** Hex values for places that can't take Tailwind classes (navigation, spinners). Keep in sync with tailwind.config.js. */
export const C = {
  bg: '#0B0B17',
  surface: '#11111F',
  border: '#222238',
  text: '#F1F5F9',
  muted: '#94A3B8',
  brand: '#7C7BFF',
  // Section accents
  dsa: '#A78BFA', // violet
  topics: '#22D3EE', // cyan
  workout: '#34D399', // emerald
  insights: '#FBBF24', // amber
  today: '#F472B6', // pink
};

export const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: C.brand,
    background: C.bg,
    card: C.surface,
    text: C.text,
    border: C.border,
    notification: C.today,
  },
};
