import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF9933',
          50: 'rgba(255,153,51,0.05)',
          100: 'rgba(255,153,51,0.1)',
          200: 'rgba(255,153,51,0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
