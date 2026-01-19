/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1a1a1a',
                    light: '#333333',
                    dark: '#000000',
                }
            },
            fontFamily: {
                sans: ['Noto Sans JP', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
