/** 动森设计 token（自手写 UI 迁出；色值对齐 sa2kit-ui animal-island） */

export const ai = {
  primary: '#19c8b9',
  primaryHover: '#3dd4c6',
  primaryActive: '#11a89b',
  primaryBg: '#e6f9f6',

  text: '#794f27',
  textBody: '#725d42',
  textSecondary: '#9f927d',
  textMuted: '#8a7b66',
  textDisabled: '#c4b89e',

  border: '#aaa69d',
  borderLight: '#e8e2d6',
  borderInput: '#c4b89e',
  borderInputHover: '#a89878',

  bg: '#f8f8f0',
  bgContent: '#f7f3df',
  bgSecondary: '#f0e8d8',
  bgDisabled: '#f0ece2',
  bgInput: '#f7f3df',
  bgPanel: '#ffffff',

  success: '#6fba2c',
  successActive: '#5a9e1e',
  warning: '#f5c31c',
  error: '#e05a5a',
  errorActive: '#c94444',
  errorHover: '#e87878',

  focusYellow: '#ffcc00',
  shadowBtn: '#bdaea0',
  shadowInput: '#d4c9b4',
  shadowSwitch: '#725d42',

  titleTeal: '#82d5bb',
  chipBg: '#e6f9f6',
  chipBorder: '#b8e8df',
  chipText: '#11a89b',

  progressTrack: '#e8e2d6',
  progressFill: '#19c8b9',
  lessonDoneBorder: '#9ae6b4',
  lessonDoneBg: '#f0fff4',

  modalBg: '#f7f3df',
  modalText: '#807359',
} as const;

export type AiColor = keyof typeof ai;
