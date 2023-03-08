/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#282c34', 
        secondary: '#21252b', 
        error: '#503939',
        warningHover: '#e56865',
        warning: '#c23e45',
        good3: '#96c561',
        good2: '#4889fe',
        good: '#2563eb',
        hover: '#2b3038',
        hover2: '#333943',
        chat: '#454c5a',
      },
            opacity: {
        'hover': '.2',
      }
    }
  },
  plugins: []
};
