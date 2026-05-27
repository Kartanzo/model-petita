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
          500: '#3a5bec',
          700: '#1e4ba8',
          900: '#192e63',
        },
        cream: '#fff8ec',
        peach: '#ffd9c2',
        mint: '#cfeede',
        bg: '#f6f9ff',
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
