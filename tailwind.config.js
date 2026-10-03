/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          sidebar: '#17203A',
          hover: '#1F2A48',
          active: '#2A3659',
          accent: '#4C7DF0',
          text: '#AEB8D0',
          activeText: '#FFFFFF',
          label: '#7C89A8'
        },
        canvas: '#F5F6FA',
        surface: {
          DEFAULT: '#FFFFFF',
          inset: '#F6F7FB'
        },
        border: {
          subtle: '#E3E7EF',
          strong: '#CDD3E0'
        },
        ink: {
          primary: '#141B2D',
          secondary: '#4B5568',
          muted: '#7A8499'
        },
        accent: {
          DEFAULT: '#2F5FE3',
          hover: '#2650C7',
          pressed: '#1F44AA',
          soft: '#E8EEFD',
          text: '#2447B8'
        },
        status: {
          success: '#1E9E5A',
          'success-soft': '#E4F5EC',
          warning: '#C77D0A',
          'warning-soft': '#FDF1DC',
          danger: '#D1383D',
          'danger-soft': '#FCE9EA',
          dot: '#E5484D'
        },
        backdrop: '#0B0F1A'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace']
      },
      fontSize: {
        'title-page': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'title-panel': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'body': ['13px', { lineHeight: '19px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'micro': ['10px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '600' }],
        'mono-val': ['11px', { lineHeight: '16px' }]
      },
      borderRadius: {
        chip: '4px',
        btn: '6px',
        panel: '8px'
      }
    },
  },
  plugins: [],
}
