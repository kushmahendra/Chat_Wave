// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: "Inter",
        "public-sans": "'Public Sans'",
      },
      
      fontSize: {
        xs: "12px",
        base: "16px",
        sm: "14px",
        xl: "20px",
        "13xl": "32px",
        lgi: "19px",
        "7xl": "26px",
        inherit: "inherit",
      },




    },
  },
  plugins: [
   function ({ addUtilities }) {
  const newUtilities = {
    ".no-scrollbar::-webkit-scrollbar": {
      display: "block",
      width: "8px", // Wrap the value in quotes
    },
    ".no-scrollbar": {
      "-ms-overflow-style": "none",
      "scrollbar-width": "thin",
    },
  };
  addUtilities(newUtilities);
}
,
  ],
}
