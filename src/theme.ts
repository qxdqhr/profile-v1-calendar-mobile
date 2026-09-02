import { ai } from './ui/tokens';

export const calColors = {
  bg: ai.bg,
  text: ai.text,
  textMuted: ai.textSecondary,
  textBody: ai.textBody,
  link: ai.primary,
  accent: '#0cc0b5',
  border: '#9f927d',
  borderSoft: '#e8dcc8',
  panel: '#f7f3df',
  danger: ai.error,
} as const;

export const calScreen = 'flex-1 bg-[#f8f8f0]';
export const calTitle = 'text-2xl font-bold text-[#794f27]';
export const calDesc = 'text-[15px] leading-relaxed text-[#9f927d]';
export const calPanel = 'rounded-[20px] border-2 border-[#9f927d] bg-[#f7f3df]';
export const calTopbar = 'border-b border-[#e8dcc8] bg-white/95 px-4 py-3';
export const calInput =
  'rounded-[50px] border-[2.5px] border-[#c4b89e] bg-[#f7f3df] px-[18px] py-2.5 text-[15px] text-[#725d42]';
