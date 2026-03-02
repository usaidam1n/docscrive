import { cn } from './lib/utils';

export { cn };

function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '');

  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = h * 60;
  }

  h = Math.round(h);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export type Theme = {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
    destructive: string;
    destructiveForeground: string;
    ring: string;
    darkPrimaryForeground: string;
    darkSecondaryForeground: string;
    darkAccentForeground: string;
    // Dark mode colors
    darkPrimary: string;
    darkSecondary: string;
    darkAccent: string;
    darkBackground: string;
    darkForeground: string;
    darkMuted: string;
    darkMutedForeground: string;
    darkBorder: string;
    darkCard: string;
    darkCardForeground: string;
    darkDestructive: string;
    darkDestructiveForeground: string;
    darkRing: string;
  };
};

// Royal Tech theme
export const royalTech: Theme = {
  name: 'Royal Tech',
  colors: {
    primary: '#7C3AED', // Royal Purple
    secondary: '#2563EB', // Electric Blue
    accent: '#F59E0B', // Amber

    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    ring: '#7C3AED',

    // Dark mode colors
    darkBackground: '#0F172A',
    darkForeground: '#F8FAFC',
    darkCard: '#1E293B',
    darkCardForeground: '#F8FAFC',
    darkPrimary: '#8B5CF6',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#3B82F6',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#FBBF24',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1E293B',
    darkMutedForeground: '#94A3B8',
    darkBorder: '#334155',
    darkRing: '#8B5CF6',
  },
};

// Ocean Vibes theme
export const oceanVibes: Theme = {
  name: 'Ocean Vibes',
  colors: {
    primary: '#06B6D4', // Cyan
    secondary: '#3B82F6', // Blue
    accent: '#EC4899', // Pink

    background: '#F0F9FF',
    foreground: '#0C4A6E',
    card: '#FFFFFF',
    cardForeground: '#0C4A6E',
    muted: '#E0F2FE',
    mutedForeground: '#0369A1',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#BAE6FD',
    ring: '#06B6D4',

    // Dark mode colors
    darkBackground: '#0C4A6E',
    darkForeground: '#E0F2FE',
    darkCard: '#075985',
    darkCardForeground: '#E0F2FE',
    darkPrimary: '#22D3EE',
    darkPrimaryForeground: '#0C4A6E',
    darkSecondary: '#60A5FA',
    darkSecondaryForeground: '#0C4A6E',
    darkAccent: '#F472B6',
    darkAccentForeground: '#0C4A6E',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#075985',
    darkMutedForeground: '#7DD3FC',
    darkBorder: '#0284C7',
    darkRing: '#22D3EE',
  },
};

// Forest theme
export const forestSage: Theme = {
  name: 'Forest & Sage',
  colors: {
    primary: '#059669', // Emerald
    secondary: '#4F46E5', // Indigo
    accent: '#F97316', // Orange

    background: '#F0FDF4',
    foreground: '#14532D',
    card: '#FFFFFF',
    cardForeground: '#14532D',
    muted: '#DCFCE7',
    mutedForeground: '#166534',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#86EFAC',
    ring: '#059669',

    // Dark mode colors
    darkBackground: '#052e16',
    darkForeground: '#ECFDF5',
    darkCard: '#14532D',
    darkCardForeground: '#ECFDF5',
    darkPrimary: '#10B981',
    darkPrimaryForeground: '#052e16',
    darkSecondary: '#818CF8',
    darkSecondaryForeground: '#052e16',
    darkAccent: '#FB923C',
    darkAccentForeground: '#052e16',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#14532D',
    darkMutedForeground: '#6EE7B7',
    darkBorder: '#047857',
    darkRing: '#10B981',
  },
};

// Elegant theme
export const elegantMonochrome: Theme = {
  name: 'Elegant Monochrome',
  colors: {
    primary: '#27272A', // Zinc
    secondary: '#71717A', // Lighter Zinc
    accent: '#F59E0B', // Amber

    background: '#FAFAFA',
    foreground: '#18181B',
    card: '#FFFFFF',
    cardForeground: '#18181B',
    muted: '#F4F4F5',
    mutedForeground: '#52525B',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E4E4E7',
    ring: '#27272A',

    // Dark mode colors
    darkBackground: '#18181B',
    darkForeground: '#FAFAFA',
    darkCard: '#27272A',
    darkCardForeground: '#FAFAFA',
    darkPrimary: '#D4D4D8',
    darkPrimaryForeground: '#18181B',
    darkSecondary: '#A1A1AA',
    darkSecondaryForeground: '#18181B',
    darkAccent: '#FBBF24',
    darkAccentForeground: '#18181B',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#27272A',
    darkMutedForeground: '#A1A1AA',
    darkBorder: '#3F3F46',
    darkRing: '#D4D4D8',
  },
};

// Linear-inspired theme
export const linearInspired: Theme = {
  name: 'Linear Inspired',
  colors: {
    primary: '#5E6AD2', // Linear Purple
    secondary: '#0C1E35', // Dark Blue
    accent: '#E1E1FC', // Light Purple

    background: '#FCFCFD',
    foreground: '#1D1D1F',
    card: '#FFFFFF',
    cardForeground: '#1D1D1F',
    muted: '#F7F7F8',
    mutedForeground: '#8A8A8F',
    destructive: '#F15D5D',
    destructiveForeground: '#FFFFFF',
    border: '#EDEDEF',
    ring: '#5E6AD2',

    // Dark mode colors
    darkBackground: '#16161A',
    darkForeground: '#FAFBFC',
    darkCard: '#1F1F23',
    darkCardForeground: '#FAFBFC',
    darkPrimary: '#6875F5',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#3A404C',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#E1E1FC',
    darkAccentForeground: '#16161A',
    darkDestructive: '#F15D5D',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1F1F23',
    darkMutedForeground: '#A9ABBD',
    darkBorder: '#2D2D35',
    darkRing: '#6875F5',
  },
};

// Best 5 themes - curated for optimal user experience
export const themes: Record<string, Theme> = {
  'royal-tech': royalTech,
  'ocean-vibes': oceanVibes,
  'forest-sage': forestSage,
  'elegant-monochrome': elegantMonochrome,
  'linear-inspired': linearInspired,
};

// Default theme
export const defaultTheme = 'royal-tech';

// Function to generate CSS variables for a theme
export function generateThemeVariables(themeName: string): string {
  const theme = themes[themeName] || themes[defaultTheme];
  if (!theme) {
    console.error(`Theme ${themeName} not found`);
    return '';
  }

  return `
    :root {
      --background: ${hexToHSL(theme.colors.background)};
      --foreground: ${hexToHSL(theme.colors.foreground)};
      --card: ${hexToHSL(theme.colors.card)};
      --card-foreground: ${hexToHSL(theme.colors.cardForeground)};
      --popover: ${hexToHSL(theme.colors.card)};
      --popover-foreground: ${hexToHSL(theme.colors.cardForeground)};
      --primary: ${hexToHSL(theme.colors.primary)};
      --primary-foreground: ${hexToHSL('#FFFFFF')};
      --secondary: ${hexToHSL(theme.colors.secondary)};
      --secondary-foreground: ${hexToHSL('#FFFFFF')};
      --muted: ${hexToHSL(theme.colors.muted)};
      --muted-foreground: ${hexToHSL(theme.colors.mutedForeground)};
      --accent: ${hexToHSL(theme.colors.accent)};
      --accent-foreground: ${hexToHSL('#FFFFFF')};
      --destructive: ${hexToHSL(theme.colors.destructive)};
      --destructive-foreground: ${hexToHSL(theme.colors.destructiveForeground)};
      --border: ${hexToHSL(theme.colors.border)};
      --input: ${hexToHSL(theme.colors.border)};
      --ring: ${hexToHSL(theme.colors.ring)};
      --radius: 0.5rem;
    }
    
    .dark {
      --background: ${hexToHSL(theme.colors.darkBackground)};
      --foreground: ${hexToHSL(theme.colors.darkForeground)};
      --card: ${hexToHSL(theme.colors.darkCard)};
      --card-foreground: ${hexToHSL(theme.colors.darkCardForeground)};
      --popover: ${hexToHSL(theme.colors.darkCard)};
      --popover-foreground: ${hexToHSL(theme.colors.darkCardForeground)};
      --primary: ${hexToHSL(theme.colors.darkPrimary)};
      --primary-foreground: ${hexToHSL('#FFFFFF')};
      --secondary: ${hexToHSL(theme.colors.darkSecondary)};
      --secondary-foreground: ${hexToHSL('#FFFFFF')};
      --muted: ${hexToHSL(theme.colors.darkMuted)};
      --muted-foreground: ${hexToHSL(theme.colors.darkMutedForeground)};
      --accent: ${hexToHSL(theme.colors.darkAccent)};
      --accent-foreground: ${hexToHSL('#FFFFFF')};
      --destructive: ${hexToHSL(theme.colors.darkDestructive)};
      --destructive-foreground: ${hexToHSL(
        theme.colors.darkDestructiveForeground
      )};
      --border: ${hexToHSL(theme.colors.darkBorder)};
      --input: ${hexToHSL(theme.colors.darkBorder)};
      --ring: ${hexToHSL(theme.colors.darkRing)};
    }
  `;
}

// Export theme color data for use in the UI
export const themeOptions = [
  // Put the default theme first
  {
    name: themes['royal-tech'].name,
    value: 'royal-tech',
    primaryColor: themes['royal-tech'].colors.primary,
  },
  // Then add all the other themes
  ...Object.entries(themes)
    .filter(([value]) => value !== 'royal-tech')
    .map(([value, theme]) => ({
      name: theme.name,
      value,
      primaryColor: theme.colors.primary,
    })),
];
