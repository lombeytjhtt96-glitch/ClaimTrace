/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            colors: {
                bpjs: {
                    green: '#01A65A',
                    darkgreen: '#008D4C',
                    blue: '#0288D1',
                    navy: '#0C4A60',
                    light: '#F4F7F6',
                },
                health: {
                    dark: '#000c24',
                    card: '#00153A',
                    cardHover: '#002050',
                    navy: '#001D58',
                    blue: '#00308F',
                    accent: '#0052cc',
                    gold: '#FFCA40',
                    goldLight: '#FFE082',
                    emerald: '#10B981',
                    rose: '#F43F5E',
                    cyan: '#06B6D4',
                    border: 'rgba(255, 255, 255, 0.1)',
                },
                // Clean Light Enterprise Design Tokens
                surface: '#FFFFFF',
                'surface-dim': '#F8FAFC',
                'surface-container': '#F1F5F9',
                'surface-container-high': '#E2E8F0',
                'on-surface': '#0F172A',
                'on-surface-variant': '#475569',
                outline: '#CBD5E1',
                'outline-variant': '#E2E8F0',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'card': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
                'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
};
