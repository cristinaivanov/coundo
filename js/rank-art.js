// Each drawing fills a circle of radius 34 centered on 50,50.
export const RANK_ART = {
  Tourist: {
    face: '#6fb58a',
    art: `<path fill="#e96f5f" stroke="#e96f5f" stroke-width="3" stroke-linejoin="round" d="M41.500 39l3-6.500h11l3 6.500z"/>
      <rect x="31.500" y="34" width="8" height="6" rx="2" fill="#8a4b32"/>
      <rect x="27" y="37" width="46" height="33" rx="8" fill="#fff6e6"/>
      <path fill="#e96f5f" d="M27 45a8 8 0 018-8h30a8 8 0 018 8v1.500H27z"/>
      <circle cx="65.500" cy="42" r="2.500" fill="#f6c453"/>
      <circle cx="50" cy="54" r="13" fill="#fff6e6"/><circle cx="50" cy="54" r="11" fill="#27386b"/><circle cx="50" cy="54" r="7.500" fill="#8fd3ee"/><circle cx="50" cy="54" r="3.800" fill="#3f7fb5"/>
      <circle cx="47" cy="51" r="2.200" fill="#fff"/>`,
  },
  Backpacker: {
    face: '#e98b5f',
    art: `<path fill="none" stroke="#8a4b32" stroke-width="3.500" d="M43.500 34v-2.500a6.500 6.500 0 0113 0V34"/>
      <rect x="28" y="50" width="11" height="18" rx="5" fill="#e0a52f"/><rect x="61" y="50" width="11" height="18" rx="5" fill="#e0a52f"/>
      <rect x="33.500" y="33" width="33" height="41" rx="12" fill="#fff1dc"/>
      <path fill="#f6c453" d="M33.500 45a12 12 0 0112-12h9a12 12 0 0112 12v4.500a4 4 0 01-4 4h-25a4 4 0 01-4-4z"/>
      <rect x="46.800" y="48.500" width="6.400" height="9.500" rx="2.400" fill="#8a4b32"/>
      <rect x="39.500" y="61" width="21" height="9.500" rx="4" fill="#f3d7ab"/>`,
  },
  Traveler: {
    face: '#6f84d6',
    art: `<path fill="none" stroke="#fff" stroke-width="3.600" stroke-linejoin="round" d="M42.500 41v-6a4 4 0 014-4h7a4 4 0 014 4v6"/>
      <circle cx="38" cy="70" r="3.600" fill="#27386b"/><circle cx="62" cy="70" r="3.600" fill="#27386b"/>
      <rect x="28.500" y="40" width="43" height="29" rx="7" fill="#f6c453"/>
      <path fill="#dd9a35" d="M35 40h5v29h-5zM60 40h5v29h-5z"/>
      <path fill="#e96f5f" d="M50 62.500c-4.800-3.300-7.500-5.800-7.500-9a4 4 0 017.500-2 4 4 0 017.500 2c0 3.200-2.700 5.700-7.500 9z"/>`,
  },
  Explorer: {
    face: '#a9dfe0',
    art: `<circle cx="34" cy="37" r="6" fill="#f6c453"/>
      <path fill="#6fb08a" d="M10 78L37 44l27 34z"/><path fill="#3f8263" d="M28 78l28-42 30 42z"/>
      <path fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round" d="M56 36.500L47 50l5-2 4 4.500 4-4.500 5.500 2z"/>
      <path fill="none" stroke="#7a4a2e" stroke-width="2.400" stroke-linecap="round" d="M56 37V22"/>
      <path fill="#e96f5f" stroke="#e96f5f" stroke-width="1.500" stroke-linejoin="round" d="M57 23l11 3.700-11 3.700z"/>
      <path fill="#2f6b50" d="M10 73q20-7 40-1t40-1v25H10z"/>`,
  },
  Navigator: {
    face: 'var(--accent)',
    art: `<path fill="var(--lv3)" d="M63 37L54.500 54.500 45.500 45.500z"/><path fill="var(--on-accent)" d="M37 63L45.500 45.500 54.500 54.500z"/>
      <path fill="none" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round" opacity=".55" d="M50 21.500v5M50 73.500v5M21.500 50h5M73.500 50h5"/>`,
  },
  Globetrotter: {
    face: '#b283c6',
    art: `<circle cx="49" cy="53" r="20" fill="#8fd3ee"/>
      <path fill="#6db56f" d="M35 42c5-6 11-7 14-5s1 5-2 6.500-3 3-2.500 5.500-3 4.500-6 3-5-5.500-3.500-10zM52 51c4-3 11-2.500 13 1.500s-1 10-5.500 12.500-6-1-5.500-4.500-4.500-6.500-2-9.500zM37.500 60c2-1.500 5 0 5.500 3s-1.500 4.500-3.500 3-4-4.500-2-6z"/>
      <path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-dasharray=".5 4.500" d="M25 66C37 74 62 63 67 39"/>
      <path fill="#fff" stroke="#fff" stroke-width="1" stroke-linejoin="round" transform="translate(67.500 33) rotate(14) scale(.95)" d="M0-10c1.500 0 2 2.500 2 5l8.500 5.500V3.500L2 1.200 1.500 6 4 8v1.800L0 8.700l-4 1.100V8l2.500-2L-2 1.200l-8.500 2.300V.5L-2-5c0-2.500.5-5 2-5z"/>`,
  },
  Diplomat: {
    face: '#d98299',
    art: `<rect x="27" y="36" width="46" height="31" rx="5" fill="#fffaf0"/>
      <path fill="none" stroke="#ecd9b8" stroke-width="2.400" stroke-linecap="round" d="M30 64l13-12M70 64L57 52"/>
      <path fill="#fbe9c8" stroke="#ecd0a0" stroke-width="1.800" stroke-linejoin="round" d="M28.500 37.500h43L52 54.500a3 3 0 01-4 0z"/>
      <path fill="#a53c36" d="M45 58l-3.500 14 5-2.500 3 4 2-13zM55 58l3.500 14-5-2.500-3 4-2-13z"/>
      <circle cx="50" cy="54" r="9" fill="#cf5148"/><circle cx="50" cy="54" r="6.300" fill="none" stroke="#f0958c" stroke-width="1.300"/>
      <path fill="#ffe9e3" d="M50 58c-2.700-1.900-4-3.300-4-5a2.200 2.200 0 014-1.200A2.200 2.200 0 0154 53c0 1.700-1.300 3.100-4 5z"/>`,
  },
  Ambassador: {
    face: '#2f437f',
    art: `<path fill="#f6c453" stroke="#f6c453" stroke-width="3" stroke-linejoin="round" d="M33.500 60L30 41l11.500 8.500L50 34l8.500 15.500L70 41l-3.500 19z"/>
      <circle cx="29.500" cy="39" r="3.600" fill="#ffe09a"/><circle cx="50" cy="31.500" r="4" fill="#ffe09a"/><circle cx="70.500" cy="39" r="3.600" fill="#ffe09a"/>
      <rect x="31.500" y="59" width="37" height="9.500" rx="4" fill="#dd9a35"/>
      <circle cx="40" cy="63.700" r="2.500" fill="#8fd3ee"/><circle cx="50" cy="63.700" r="2.900" fill="#e96f5f"/><circle cx="60" cy="63.700" r="2.500" fill="#8fd3ee"/>
      <path fill="#fff" d="M67 24.500c.5 2.900 1.600 4 4.500 4.500-2.900.5-4 1.600-4.500 4.500-.5-2.900-1.600-4-4.500-4.500 2.900-.5 4-1.600 4.500-4.500zM33 70.500c.4 2 1.100 2.800 3.200 3.200-2.100.4-2.800 1.100-3.200 3.200-.4-2.100-1.100-2.800-3.200-3.200 2.100-.4 2.800-1.200 3.200-3.200z"/>`,
  },
};
