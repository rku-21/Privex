import { create } from "zustand";

function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark-mode", theme === "dark");
}

export const useThemeStore = create((set) => ({
    theme: "dark", // Always dark mode
    setTheme: (theme) => {
        // Force dark mode only
        const forcedTheme = "dark";
        localStorage.setItem("chat-theme", forcedTheme);
        applyTheme(forcedTheme);
        set({ theme: forcedTheme });
    },
    toggleTheme: () => {
        // Disable theme toggle - always stay dark
        return;
    },
}));

// Force dark mode on load
localStorage.setItem("chat-theme", "dark");
applyTheme("dark");