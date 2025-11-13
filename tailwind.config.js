const colors = require('tailwindcss/colors');

// Reizor Hosting Gray Palette
const gray = {
    50: '#f5f5f5',
    100: '#e0e0e0',
    200: '#bdbdbd',
    300: '#9e9e9e',
    400: '#757575',
    500: '#616161',
    600: '#9e9e9e',
    700: '#424242',
    800: '#303030',
    900: '#212121', // Primary background color
};

// Reizor Hosting Red Palette (Primary Brand Color)
const red = {
    50: '#f7c9cd',
    100: '#ef9aa2',
    200: '#e76c77',
    300: '#de3e4c',
    400: '#b92a3c',
    500: '#d32f42', // PRIMARY BRAND RED
    600: '#9f2536',
    700: '#851f30',
    800: '#6b1a2a',
    900: '#511523',
};

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                header: ['"Oswald"', '"IBM Plex Sans"', '"Roboto"', 'system-ui', 'sans-serif'],
            },
            colors: {
                black: '#212121',
                // "primary" and "neutral" are deprecated, prefer the use of "red" and "gray"
                // in new code.
                primary: red,
                gray: gray,
                neutral: gray,
                cyan: colors.cyan,
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};
