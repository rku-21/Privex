// store/useThemeStore.js
import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("theme") || "dark",

  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    set({ theme: newTheme });
  },
}));