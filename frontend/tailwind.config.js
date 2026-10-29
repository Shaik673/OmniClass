import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Dark theme surfaces ──────────────────────────
        dark: {
          base:     '#0f1117',
          surface:  '#1a1d27',
          elevated: '#1e2235',
          overlay:  '#252a3a',
          sidebar:  '#13161f',
          border:   '#2a2f42',
        },
        // ── Light theme surfaces ─────────────────────────
        light: {
          base:     '#f1f3f7',
          surface:  '#ffffff',
          elevated: '#f8f9fc',
          overlay:  '#eef0f6',
          sidebar:  '#e8eaf2',
          border:   '#dde0e8',
        },
        // ── Accent palette ───────────────────────────────
        accent: {
          primary:   '#3b82f6',
          secondary: '#8b5cf6',
          ai:        '#06b6d4',
          success:   '#10b981',
          warning:   '#f59e0b',
          error:     '#ef4444',
          info:      '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in':        'fadeIn 0.2s ease-out',
        'slide-up':       'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'pulse-slow':     'pulse 3s ease-in-out infinite',
        'shimmer':        'shimmer 1.5s infinite',
        'spin-slow':      'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0 },                       to: { opacity: 1 } },
        slideUp:      { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
        'glow-blue':   '0 0 12px rgba(59,130,246,0.4)',
        'glow-ai':     '0 0 12px rgba(6,182,212,0.4)',
      },
    },
  },
  plugins: [forms, typography],
};
