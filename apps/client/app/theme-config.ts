import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// Coral theme
export const coralTurquoise: Theme = {
  name: 'Coral & Turquoise',
  colors: {
    primary: '#F43F5E', // Rose/Coral
    secondary: '#0EA5E9', // Sky Blue
    accent: '#F59E0B', // Amber

    background: '#FFFFFF',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    ring: '#F43F5E',

    // Dark mode colors
    darkBackground: '#0F172A',
    darkForeground: '#F8FAFC',
    darkCard: '#1E293B',
    darkCardForeground: '#F8FAFC',
    darkPrimary: '#FB7185',
    darkPrimaryForeground: '#0F172A',
    darkSecondary: '#38BDF8',
    darkSecondaryForeground: '#0F172A',
    darkAccent: '#FBBF24',
    darkAccentForeground: '#0F172A',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1E293B',
    darkMutedForeground: '#94A3B8',
    darkBorder: '#334155',
    darkRing: '#FB7185',
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

// Gradient Fusion theme
export const gradientFusion: Theme = {
  name: 'Gradient Fusion',
  colors: {
    primary: '#8B5CF6', // Purple
    secondary: '#EC4899', // Pink
    accent: '#F59E0B', // Amber

    background: '#FFFFFF',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    ring: '#8B5CF6',

    // Dark mode colors
    darkBackground: '#0F172A',
    darkForeground: '#F8FAFC',
    darkCard: '#1E293B',
    darkCardForeground: '#F8FAFC',
    darkPrimary: '#A78BFA',
    darkPrimaryForeground: '#0F172A',
    darkSecondary: '#F472B6',
    darkSecondaryForeground: '#0F172A',
    darkAccent: '#FBBF24',
    darkAccentForeground: '#0F172A',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1E293B',
    darkMutedForeground: '#94A3B8',
    darkBorder: '#334155',
    darkRing: '#A78BFA',
  },
};

// Futuristic Neon theme
export const futuristicNeon: Theme = {
  name: 'Futuristic Neon',
  colors: {
    primary: '#6D28D9', // Violet
    secondary: '#10B981', // Emerald
    accent: '#FB7185', // Light Red

    background: '#0F172A',
    foreground: '#E2E8F0',
    card: '#1E293B',
    cardForeground: '#E2E8F0',
    muted: '#1E293B',
    mutedForeground: '#94A3B8',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#334155',
    ring: '#6D28D9',

    // Light mode colors (reversed for this theme)
    darkBackground: '#FFFFFF',
    darkForeground: '#0F172A',
    darkCard: '#F1F5F9',
    darkCardForeground: '#0F172A',
    darkPrimary: '#8B5CF6',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#34D399',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#FDA4AF',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#F1F5F9',
    darkMutedForeground: '#64748B',
    darkBorder: '#E2E8F0',
    darkRing: '#8B5CF6',
  },
};

// Sunset theme
export const sunset: Theme = {
  name: 'Sunset',
  colors: {
    primary: '#F97316', // Orange
    secondary: '#EC4899', // Pink
    accent: '#6366F1', // Indigo

    background: '#FFFBF5',
    foreground: '#431407',
    card: '#FFFFFF',
    cardForeground: '#431407',
    muted: '#FEF3C7',
    mutedForeground: '#92400E',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#FED7AA',
    ring: '#F97316',

    // Dark mode colors
    darkBackground: '#431407',
    darkForeground: '#FEF3C7',
    darkCard: '#7C2D12',
    darkCardForeground: '#FEF3C7',
    darkPrimary: '#FB923C',
    darkPrimaryForeground: '#431407',
    darkSecondary: '#F472B6',
    darkSecondaryForeground: '#431407',
    darkAccent: '#818CF8',
    darkAccentForeground: '#431407',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#7C2D12',
    darkMutedForeground: '#FDBA74',
    darkBorder: '#C2410C',
    darkRing: '#FB923C',
  },
};

// Deep Space theme
export const deepSpace: Theme = {
  name: 'Deep Space',
  colors: {
    primary: '#4F46E5', // Indigo
    secondary: '#EC4899', // Pink
    accent: '#84CC16', // Lime

    background: '#030712',
    foreground: '#E5E7EB',
    card: '#111827',
    cardForeground: '#E5E7EB',
    muted: '#111827',
    mutedForeground: '#9CA3AF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#1F2937',
    ring: '#4F46E5',

    // Light mode colors (reversed for this dark theme)
    darkBackground: '#F9FAFB',
    darkForeground: '#111827',
    darkCard: '#FFFFFF',
    darkCardForeground: '#111827',
    darkPrimary: '#6366F1',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#F472B6',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#A3E635',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#F3F4F6',
    darkMutedForeground: '#4B5563',
    darkBorder: '#E5E7EB',
    darkRing: '#6366F1',
  },
};

// Neo Mint theme
export const neoMint: Theme = {
  name: 'Neo Mint',
  colors: {
    primary: '#14B8A6', // Teal
    secondary: '#C084FC', // Purple
    accent: '#F59E0B', // Amber

    background: '#F0FDFA',
    foreground: '#134E4A',
    card: '#FFFFFF',
    cardForeground: '#134E4A',
    muted: '#CCFBF1',
    mutedForeground: '#0F766E',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#99F6E4',
    ring: '#14B8A6',

    // Dark mode colors
    darkBackground: '#042F2E',
    darkForeground: '#CCFBF1',
    darkCard: '#134E4A',
    darkCardForeground: '#CCFBF1',
    darkPrimary: '#2DD4BF',
    darkPrimaryForeground: '#042F2E',
    darkSecondary: '#D8B4FE',
    darkSecondaryForeground: '#042F2E',
    darkAccent: '#FBBF24',
    darkAccentForeground: '#042F2E',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#134E4A',
    darkMutedForeground: '#5EEAD4',
    darkBorder: '#0F766E',
    darkRing: '#2DD4BF',
  },
};

// Scandinavian theme
export const scandinavian: Theme = {
  name: 'Scandinavian',
  colors: {
    primary: '#0369A1', // Blue
    secondary: '#A3A3A3', // Gray
    accent: '#EF4444', // Red

    background: '#FFFFFF',
    foreground: '#262626',
    card: '#FFFFFF',
    cardForeground: '#262626',
    muted: '#F5F5F5',
    mutedForeground: '#525252',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E5E5E5',
    ring: '#0369A1',

    // Dark mode colors
    darkBackground: '#171717',
    darkForeground: '#FAFAFA',
    darkCard: '#262626',
    darkCardForeground: '#FAFAFA',
    darkPrimary: '#0EA5E9',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#D4D4D4',
    darkSecondaryForeground: '#171717',
    darkAccent: '#F87171',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#262626',
    darkMutedForeground: '#A3A3A3',
    darkBorder: '#404040',
    darkRing: '#0EA5E9',
  },
};

// Electric Sapphire theme
export const electricSapphire: Theme = {
  name: 'Electric Sapphire',
  colors: {
    primary: '#1D4ED8', // Royal Blue
    secondary: '#4338CA', // Indigo
    accent: '#EAB308', // Yellow

    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#475569',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E2E8F0',
    ring: '#1D4ED8',

    // Dark mode colors
    darkBackground: '#0F172A',
    darkForeground: '#F8FAFC',
    darkCard: '#1E293B',
    darkCardForeground: '#F8FAFC',
    darkPrimary: '#3B82F6',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#6366F1',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#FACC15',
    darkAccentForeground: '#0F172A',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1E293B',
    darkMutedForeground: '#94A3B8',
    darkBorder: '#334155',
    darkRing: '#3B82F6',
  },
};

// Neo Brutalism theme
export const neoBrutalism: Theme = {
  name: 'Neo Brutalism',
  colors: {
    primary: '#000000', // Black
    secondary: '#FFFFFF', // White
    accent: '#FF8A00', // Bright Orange

    background: '#FFFBEB',
    foreground: '#000000',
    card: '#FFFFFF',
    cardForeground: '#000000',
    muted: '#FBBF24',
    mutedForeground: '#000000',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#000000',
    ring: '#000000',

    // Dark mode colors
    darkBackground: '#000000',
    darkForeground: '#FFFFFF',
    darkCard: '#262626',
    darkCardForeground: '#FFFFFF',
    darkPrimary: '#FFFFFF',
    darkPrimaryForeground: '#000000',
    darkSecondary: '#000000',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#FF8A00',
    darkAccentForeground: '#000000',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#FBBF24',
    darkMutedForeground: '#000000',
    darkBorder: '#FFFFFF',
    darkRing: '#FFFFFF',
  },
};

// Aurora theme
export const aurora: Theme = {
  name: 'Aurora',
  colors: {
    primary: '#6D28D9', // Purple
    secondary: '#059669', // Emerald
    accent: '#2563EB', // Blue

    background: '#F8F9FA',
    foreground: '#101828',
    card: '#FFFFFF',
    cardForeground: '#101828',
    muted: '#F0F1F3',
    mutedForeground: '#667085',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E4E7EC',
    ring: '#6D28D9',

    // Dark mode colors
    darkBackground: '#101828',
    darkForeground: '#F8F9FA',
    darkCard: '#1D2939',
    darkCardForeground: '#F8F9FA',
    darkPrimary: '#8B5CF6',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#10B981',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#3B82F6',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1D2939',
    darkMutedForeground: '#98A2B3',
    darkBorder: '#344054',
    darkRing: '#8B5CF6',
  },
};

// Soft Pastels theme
export const softPastels: Theme = {
  name: 'Soft Pastels',
  colors: {
    primary: '#5EAEEA', // Soft Blue - serenity, friendliness, trust
    secondary: '#F7B3C7', // Soft Pink - kindness, nurturing, comfort
    accent: '#FFD166', // Soft Yellow - optimism, clarity, cheerfulness

    background: '#FDFCFA', // Warm white background
    foreground: '#333333', // Dark gray text for good contrast
    card: '#FFFFFF', // White card background
    cardForeground: '#333333', // Dark gray card text
    muted: '#F5F3F0', // Light warm gray for muted areas
    mutedForeground: '#666666', // Medium gray for muted text
    destructive: '#EF4444', // Red for destructive actions
    destructiveForeground: '#FFFFFF', // White text on destructive buttons
    border: '#E8E6E1', // Light warm gray for borders
    ring: '#5EAEEA', // Soft blue for focus rings

    // Dark mode colors
    darkBackground: '#333333', // Dark gray background
    darkForeground: '#FDFCFA', // Off-white text
    darkCard: '#4D4D4D', // Medium gray card background
    darkCardForeground: '#FDFCFA', // Off-white card text
    darkPrimary: '#85C1E9', // Lighter blue for dark mode
    darkPrimaryForeground: '#333333', // Dark gray text on primary
    darkSecondary: '#F7B3C7', // Soft pink
    darkSecondaryForeground: '#333333', // Dark gray text on secondary
    darkAccent: '#FFD166', // Soft yellow
    darkAccentForeground: '#333333', // Dark gray text on accent
    darkDestructive: '#EF4444', // Red for destructive actions
    darkDestructiveForeground: '#FFFFFF', // White text on destructive
    darkMuted: '#4D4D4D', // Medium gray for muted areas
    darkMutedForeground: '#CCCCCC', // Light gray for muted text
    darkBorder: '#666666', // Medium gray for borders
    darkRing: '#85C1E9', // Light blue for focus rings
  },
};

// Mojave theme
export const mojave: Theme = {
  name: 'Mojave',
  colors: {
    primary: '#8856EB', // Purple
    secondary: '#FF8F61', // Coral
    accent: '#09ACCE', // Turquoise

    background: '#FCFAFC',
    foreground: '#2D2532',
    card: '#FFFFFF',
    cardForeground: '#2D2532',
    muted: '#F5F2F7',
    mutedForeground: '#645973',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#E9E3EE',
    ring: '#8856EB',

    // Dark mode colors
    darkBackground: '#2D2532',
    darkForeground: '#F5F2F7',
    darkCard: '#463A4E',
    darkCardForeground: '#F5F2F7',
    darkPrimary: '#A47EFF',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#FF8F61',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#71D3E6',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#EF4444',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#463A4E',
    darkMutedForeground: '#ADA4B3',
    darkBorder: '#645973',
    darkRing: '#A47EFF',
  },
};

// New YC-backed dev tool inspired themes

// Vercel-inspired theme
export const vercelInspired: Theme = {
  name: 'Vercel Inspired',
  colors: {
    primary: '#000000', // Black
    secondary: '#FFFFFF', // White
    accent: '#0070F3', // Blue

    background: '#FAFAFA',
    foreground: '#000000',
    card: '#FFFFFF',
    cardForeground: '#000000',
    muted: '#F1F1F1',
    mutedForeground: '#666666',
    destructive: '#FF0000',
    destructiveForeground: '#FFFFFF',
    border: '#EAEAEA',
    ring: '#0070F3',

    // Dark mode colors
    darkBackground: '#000000',
    darkForeground: '#FFFFFF',
    darkCard: '#111111',
    darkCardForeground: '#FFFFFF',
    darkPrimary: '#FFFFFF',
    darkPrimaryForeground: '#000000',
    darkSecondary: '#000000',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#0070F3',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#FF0000',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#111111',
    darkMutedForeground: '#888888',
    darkBorder: '#333333',
    darkRing: '#0070F3',
  },
};

// Stripe-inspired theme
export const stripeInspired: Theme = {
  name: 'Stripe Inspired',
  colors: {
    primary: '#635BFF', // Stripe Purple
    secondary: '#32325D', // Slate
    accent: '#00D4FF', // Cyan

    background: '#F6F9FC',
    foreground: '#32325D',
    card: '#FFFFFF',
    cardForeground: '#32325D',
    muted: '#E3E8EE',
    mutedForeground: '#525F7F',
    destructive: '#FF5252',
    destructiveForeground: '#FFFFFF',
    border: '#E3E8EE',
    ring: '#635BFF',

    // Dark mode colors
    darkBackground: '#0A2540',
    darkForeground: '#F6F9FC',
    darkCard: '#1A1F36',
    darkCardForeground: '#F6F9FC',
    darkPrimary: '#7A73FF',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#A5B4FC',
    darkSecondaryForeground: '#0A2540',
    darkAccent: '#00D4FF',
    darkAccentForeground: '#0A2540',
    darkDestructive: '#FF5252',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#1A1F36',
    darkMutedForeground: '#A3ACB9',
    darkBorder: '#2D354A',
    darkRing: '#7A73FF',
  },
};

// Github-inspired theme
export const githubInspired: Theme = {
  name: 'Github Inspired',
  colors: {
    primary: '#2DA44E', // Green
    secondary: '#0969DA', // Blue
    accent: '#8250DF', // Purple

    background: '#FFFFFF',
    foreground: '#24292F',
    card: '#F6F8FA',
    cardForeground: '#24292F',
    muted: '#F6F8FA',
    mutedForeground: '#57606A',
    destructive: '#CF222E',
    destructiveForeground: '#FFFFFF',
    border: '#D0D7DE',
    ring: '#2DA44E',

    // Dark mode colors
    darkBackground: '#0D1117',
    darkForeground: '#C9D1D9',
    darkCard: '#161B22',
    darkCardForeground: '#C9D1D9',
    darkPrimary: '#3FB950',
    darkPrimaryForeground: '#0D1117',
    darkSecondary: '#58A6FF',
    darkSecondaryForeground: '#0D1117',
    darkAccent: '#A371F7',
    darkAccentForeground: '#0D1117',
    darkDestructive: '#F85149',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#161B22',
    darkMutedForeground: '#8B949E',
    darkBorder: '#30363D',
    darkRing: '#3FB950',
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

// Notion-inspired theme
export const notionInspired: Theme = {
  name: 'Notion Inspired',
  colors: {
    primary: '#000000', // Black
    secondary: '#787774', // Gray
    accent: '#EA4C89', // Pink

    background: '#FFFFFF',
    foreground: '#37352F',
    card: '#FFFFFF',
    cardForeground: '#37352F',
    muted: '#F7F6F3',
    mutedForeground: '#787774',
    destructive: '#E03E3E',
    destructiveForeground: '#FFFFFF',
    border: '#E9E9E7',
    ring: '#000000',

    // Dark mode colors
    darkBackground: '#2F3437',
    darkForeground: '#FFFFFF',
    darkCard: '#373C3F',
    darkCardForeground: '#FFFFFF',
    darkPrimary: '#FFFFFF',
    darkPrimaryForeground: '#2F3437',
    darkSecondary: '#9B9A97',
    darkSecondaryForeground: '#2F3437',
    darkAccent: '#EA4C89',
    darkAccentForeground: '#2F3437',
    darkDestructive: '#E03E3E',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#373C3F',
    darkMutedForeground: '#9B9A97',
    darkBorder: '#4A4F52',
    darkRing: '#FFFFFF',
  },
};

// Figma-inspired theme
export const figmaInspired: Theme = {
  name: 'Figma Inspired',
  colors: {
    primary: '#0D99FF', // Blue
    secondary: '#FF7262', // Red
    accent: '#A259FF', // Purple

    background: '#FFFFFF',
    foreground: '#1E1E1E',
    card: '#FFFFFF',
    cardForeground: '#1E1E1E',
    muted: '#F5F5F5',
    mutedForeground: '#6E6E6E',
    destructive: '#F24822',
    destructiveForeground: '#FFFFFF',
    border: '#E5E5E5',
    ring: '#0D99FF',

    // Dark mode colors
    darkBackground: '#2C2C2C',
    darkForeground: '#FFFFFF',
    darkCard: '#383838',
    darkCardForeground: '#FFFFFF',
    darkPrimary: '#0D99FF',
    darkPrimaryForeground: '#FFFFFF',
    darkSecondary: '#FF7262',
    darkSecondaryForeground: '#FFFFFF',
    darkAccent: '#A259FF',
    darkAccentForeground: '#FFFFFF',
    darkDestructive: '#F24822',
    darkDestructiveForeground: '#FFFFFF',
    darkMuted: '#383838',
    darkMutedForeground: '#B3B3B3',
    darkBorder: '#4D4D4D',
    darkRing: '#0D99FF',
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
