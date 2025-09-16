import { create } from "zustand";

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
}

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("chat-theme") || "light",
    setTheme: (theme) => {
        localStorage.setItem("chat-theme", theme);
        applyTheme(theme);
        set({ theme });
    },
    toggleTheme: () =>
        set((state) => {
            const newTheme = state.theme === "dark" ? "light" : "dark";
            localStorage.setItem("chat-theme", newTheme);
            applyTheme(newTheme);
            return { theme: newTheme };
        }),
}));

// On load, apply the theme from localStorage
applyTheme(localStorage.getItem("chat-theme") || "light");