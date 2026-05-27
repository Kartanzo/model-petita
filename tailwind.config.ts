import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bccffd',
          300: '#8cabfa',
          400: '#5b80f4',
          500: '#3a5bec',
          600: '#2942d8',
          700: '#1e4ba8',
          800: '#1a3a82',
          900: '#192e63',
        },
        cream: '#fff8ec',
        peach: '#ffd9c2',
        mint: '#cfeede',
        sand: '#fbfaf6',
        bg: '#fbfaf6',
        panel: '#ffffff',
        border: '#e5ebf5',
        text: '#192e63',
        muted: '#5d6b8a',
        success: '#16a07c',
        warning: '#d88514',
        danger: '#dc2626',
        info: '#2aa3d9',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 12px -4px rgba(30,75,168,0.10)',
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
    },
  },
  plugins: [],
};
export default config;
