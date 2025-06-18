import { Options } from "$fresh/plugins/twind.ts";

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors: {
        // Custom color system
        primary: {
          bg: "#211E55", // Primary background (sidebar)
        },
        create: {
          DEFAULT: "#096148", // Create buttons regular
          hover: "#00AA90", // Create buttons hover
        },
        submit: {
          DEFAULT: "#4E4F97", // Submit buttons regular
          hover: "#8A6BBE", // Submit buttons hover
        },
        cancel: {
          DEFAULT: "#C73E3A", // Cancel buttons regular
          hover: "#D75455", // Cancel buttons hover
        },
      },
    },
  },
} as Options;
