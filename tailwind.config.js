/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,jsx}",
        "./src/components/**/*.{js,jsx}",
        "./src/app/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'shimmer': 'shimmer 2s infinite linear',
                'loading-bar': 'loadingBar 2s infinite',
                'bounce-delay-1': 'bounce 1s infinite',
                'bounce-delay-2': 'bounce 1s infinite 0.2s',
                'bounce-delay-3': 'bounce 1s infinite 0.4s',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '0% 0' },
                },
                loadingBar: {
                    '0%': { width: '0%', left: '0' },
                    '50%': { width: '100%', left: '0' },
                    '100%': { width: '0%', left: '100%' },
                },
            },
        },
    },
    plugins: [],
}