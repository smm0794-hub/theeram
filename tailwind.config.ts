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
        bg: '#F4F5F3',
        text: '#111211',
        accent: '#173B13',
        lime: '#78E040',
        'lime-dark': '#58C922',
        'lime-pill': '#C4F596',
        olive: '#173B13',
        'olive-deep': '#0F290C',
        butter: '#FCE08B',
        'butter-soft': '#FEF3D1',
        lavender: '#E5DDF5',
        mint: '#EDFCE6',
        pin: '#58C922',
        kasavu: '#FCE08B',
        wa: '#25D366',
        border: '#DCE0D8',
        avail: '#58C922',
      },
      fontFamily: {
        display: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        georgia: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
