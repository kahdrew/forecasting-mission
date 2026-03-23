import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        factory: {
          bg: '#0a0a0a',
          card: '#141414',
          hover: '#1a1a1a',
          border: '#262626',
          accent: '#3b82f6',
          'accent-hover': '#2563eb',
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          text: '#fafafa',
          'text-muted': '#a1a1aa',
          'text-dim': '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
