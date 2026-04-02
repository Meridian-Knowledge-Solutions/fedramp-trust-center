/**
 * Shared design system constants.
 * Single source of truth for colors, borders, and base path.
 */

export const THEME = {
  bg: 'bg-[#09090b]',
  panel: 'bg-[#121217]',
  border: 'border-white/10',
  hover: 'hover:bg-white/5',
  active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  text: {
    main: 'text-slate-200',
    muted: 'text-slate-500',
  },
};

export const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data/`
  : `${import.meta.env.BASE_URL}/data/`;
