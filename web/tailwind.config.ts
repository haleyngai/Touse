import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Raw Form palette */
        rf: {
          base:    '#E4E2DD',
          primary: '#1E1E1E',
          accent:  '#DB4A2B',
          warm:    '#F8A348',
          pink:    '#FF89A9',
          muted:   '#D9D6D0',
          dark:    '#1E1E1E',
        },
        /* Legacy brand alias */
        brand: {
          50:  '#fdf4f2',
          100: '#fce8e4',
          200: '#f8d0c8',
          300: '#f1a898',
          400: '#e87060',
          500: '#DB4A2B',
          600: '#c03d22',
          700: '#a0321c',
          800: '#842c1c',
          900: '#6e291d',
          950: '#3c120b',
        },
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans:    ['"Satoshi"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"Fira Code"', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
      lineHeight: {
        display: '0.85',
      },
      animation: {
        'slide-up':   'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) both',
        'blob':       'blobPulse 12s ease-in-out infinite',
        'blob-2':     'blobPulse2 15s ease-in-out infinite',
        'spin-slow':  'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
