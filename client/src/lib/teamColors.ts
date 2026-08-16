// Team color palette resolver — maps team names to their official colors
// Used by the Infographic renderer to auto-theme output

export interface TeamPalette {
  primary: string;    // main color (jersey/flag primary)
  secondary: string;  // secondary color
  accent: string;     // gold/highlight color
  bg: string;         // dark background
  text: string;       // text on dark bg
  flag: string;       // emoji flag
  gradient: string;   // CSS gradient string
}

const TEAM_PALETTES: Record<string, TeamPalette> = {
  // ── National Teams ──────────────────────────────────────────────────────────
  egypt: { primary: '#C8102E', secondary: '#000000', accent: '#D4AF37', bg: '#1a0a0a', text: '#ffffff', flag: '🇪🇬', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  مصر: { primary: '#C8102E', secondary: '#000000', accent: '#D4AF37', bg: '#1a0a0a', text: '#ffffff', flag: '🇪🇬', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  argentina: { primary: '#74ACDF', secondary: '#FFFFFF', accent: '#F6B40E', bg: '#0a1628', text: '#ffffff', flag: '🇦🇷', gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #0a1628 100%)' },
  الأرجنتين: { primary: '#74ACDF', secondary: '#FFFFFF', accent: '#F6B40E', bg: '#0a1628', text: '#ffffff', flag: '🇦🇷', gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #0a1628 100%)' },
  brazil: { primary: '#009C3B', secondary: '#FFDF00', accent: '#FFDF00', bg: '#0a1a0a', text: '#ffffff', flag: '🇧🇷', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  البرازيل: { primary: '#009C3B', secondary: '#FFDF00', accent: '#FFDF00', bg: '#0a1a0a', text: '#ffffff', flag: '🇧🇷', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  france: { primary: '#002395', secondary: '#ED2939', accent: '#FFFFFF', bg: '#0a0a1a', text: '#ffffff', flag: '🇫🇷', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  فرنسا: { primary: '#002395', secondary: '#ED2939', accent: '#FFFFFF', bg: '#0a0a1a', text: '#ffffff', flag: '🇫🇷', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  spain: { primary: '#AA151B', secondary: '#F1BF00', accent: '#F1BF00', bg: '#1a0a0a', text: '#ffffff', flag: '🇪🇸', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  إسبانيا: { primary: '#AA151B', secondary: '#F1BF00', accent: '#F1BF00', bg: '#1a0a0a', text: '#ffffff', flag: '🇪🇸', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  germany: { primary: '#000000', secondary: '#DD0000', accent: '#FFCE00', bg: '#0a0a0a', text: '#ffffff', flag: '🇩🇪', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  ألمانيا: { primary: '#000000', secondary: '#DD0000', accent: '#FFCE00', bg: '#0a0a0a', text: '#ffffff', flag: '🇩🇪', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  england: { primary: '#FFFFFF', secondary: '#CF081F', accent: '#CF081F', bg: '#0a0a1a', text: '#ffffff', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  إنجلترا: { primary: '#FFFFFF', secondary: '#CF081F', accent: '#CF081F', bg: '#0a0a1a', text: '#ffffff', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  portugal: { primary: '#006600', secondary: '#FF0000', accent: '#FFD700', bg: '#0a1a0a', text: '#ffffff', flag: '🇵🇹', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  البرتغال: { primary: '#006600', secondary: '#FF0000', accent: '#FFD700', bg: '#0a1a0a', text: '#ffffff', flag: '🇵🇹', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  morocco: { primary: '#C1272D', secondary: '#006233', accent: '#D4AF37', bg: '#1a0a0a', text: '#ffffff', flag: '🇲🇦', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  المغرب: { primary: '#C1272D', secondary: '#006233', accent: '#D4AF37', bg: '#1a0a0a', text: '#ffffff', flag: '🇲🇦', gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)' },
  senegal: { primary: '#00853F', secondary: '#FDEF42', accent: '#E31B23', bg: '#0a1a0a', text: '#ffffff', flag: '🇸🇳', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  السنغال: { primary: '#00853F', secondary: '#FDEF42', accent: '#E31B23', bg: '#0a1a0a', text: '#ffffff', flag: '🇸🇳', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  nigeria: { primary: '#008751', secondary: '#FFFFFF', accent: '#008751', bg: '#0a1a0a', text: '#ffffff', flag: '🇳🇬', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  نيجيريا: { primary: '#008751', secondary: '#FFFFFF', accent: '#008751', bg: '#0a1a0a', text: '#ffffff', flag: '🇳🇬', gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 50%, #0a1a0a 100%)' },
  // ── Club Teams ───────────────────────────────────────────────────────────────
  'al ahly': { primary: '#CC0000', secondary: '#000000', accent: '#D4AF37', bg: '#1a0000', text: '#ffffff', flag: '🦅', gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)' },
  الأهلي: { primary: '#CC0000', secondary: '#000000', accent: '#D4AF37', bg: '#1a0000', text: '#ffffff', flag: '🦅', gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)' },
  zamalek: { primary: '#FFFFFF', secondary: '#000000', accent: '#D4AF37', bg: '#0a0a0a', text: '#ffffff', flag: '⚪', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  الزمالك: { primary: '#FFFFFF', secondary: '#000000', accent: '#D4AF37', bg: '#0a0a0a', text: '#ffffff', flag: '⚪', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  'real madrid': { primary: '#FFFFFF', secondary: '#00529F', accent: '#D4AF37', bg: '#0a0a1a', text: '#ffffff', flag: '👑', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  'ريال مدريد': { primary: '#FFFFFF', secondary: '#00529F', accent: '#D4AF37', bg: '#0a0a1a', text: '#ffffff', flag: '👑', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  barcelona: { primary: '#A50044', secondary: '#004D98', accent: '#EDBB00', bg: '#1a0a1a', text: '#ffffff', flag: '🔵🔴', gradient: 'linear-gradient(135deg, #1a0a1a 0%, #2d0d2d 50%, #1a0a1a 100%)' },
  برشلونة: { primary: '#A50044', secondary: '#004D98', accent: '#EDBB00', bg: '#1a0a1a', text: '#ffffff', flag: '🔵🔴', gradient: 'linear-gradient(135deg, #1a0a1a 0%, #2d0d2d 50%, #1a0a1a 100%)' },
  liverpool: { primary: '#C8102E', secondary: '#00B2A9', accent: '#F6EB61', bg: '#1a0000', text: '#ffffff', flag: '🔴', gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)' },
  ليفربول: { primary: '#C8102E', secondary: '#00B2A9', accent: '#F6EB61', bg: '#1a0000', text: '#ffffff', flag: '🔴', gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)' },
  'manchester city': { primary: '#6CABDD', secondary: '#1C2C5B', accent: '#FFFFFF', bg: '#0a0a1a', text: '#ffffff', flag: '🔵', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
  'مانشستر سيتي': { primary: '#6CABDD', secondary: '#1C2C5B', accent: '#FFFFFF', bg: '#0a0a1a', text: '#ffffff', flag: '🔵', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2a 50%, #0a0a1a 100%)' },
};

// Default dark palette for unknown teams
const DEFAULT_PALETTE: TeamPalette = {
  primary: '#E63946',
  secondary: '#457B9D',
  accent: '#D4AF37',
  bg: '#0d1117',
  text: '#ffffff',
  flag: '⚽',
  gradient: 'linear-gradient(135deg, #0d1117 0%, #1a2030 50%, #0d1117 100%)',
};

export function getTeamPalette(teamName: string): TeamPalette {
  if (!teamName) return DEFAULT_PALETTE;
  const key = teamName.toLowerCase().trim();
  // Direct match
  if (TEAM_PALETTES[key]) return TEAM_PALETTES[key];
  // Partial match
  for (const [k, v] of Object.entries(TEAM_PALETTES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_PALETTE;
}

export function getMatchPalette(ourTeam: string, oppTeam: string) {
  return {
    our: getTeamPalette(ourTeam),
    opp: getTeamPalette(oppTeam),
  };
}
