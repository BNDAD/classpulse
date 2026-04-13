import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Joby Aviation 스타일 컬러 팔레트
        cream: {
          DEFAULT: '#F5F0E8',
          light: '#FAF7F2',
          dark: '#EDE6D8',
          white: '#FDFBF7',
        },
        sky: {
          DEFAULT: '#4A90D9',
          light: '#7AB8F5',
          deep: '#1B3A5C',
          soft: '#A8CBE8',
        },
        earth: {
          DEFAULT: '#B89B71',
          light: '#D4BC96',
        },
        charcoal: '#1A1A1A',
        // 기존 primary/accent도 sky/earth로 매핑
        primary: {
          50: '#E8F0FA',
          100: '#D1E1F5',
          200: '#A8CBE8',
          300: '#7AB8F5',
          400: '#4A90D9',
          500: '#1B3A5C',
          600: '#162F4A',
          700: '#112438',
          800: '#0C1926',
          900: '#070D14',
        },
        accent: {
          50: '#F5F0E8',
          100: '#EDE6D8',
          200: '#D4BC96',
          300: '#B89B71',
          400: '#A68A5B',
          500: '#8B7348',
          600: '#705C3A',
          700: '#56462C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'joby': '20px',
        'joby-sm': '12px',
        'joby-lg': '28px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
