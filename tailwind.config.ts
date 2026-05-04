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
        bg: '#FAF7F2',
        text: '#2C1A0E',
        accent: '#7C5C3E',
        pin: '#D4735E',
        kasavu: '#C9A84C',
        wa: '#25D366',
        border: '#D6C9B8',
        avail: '#6B8F71',
      },
      fontFamily: {
        georgia: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
