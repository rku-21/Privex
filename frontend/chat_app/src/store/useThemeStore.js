import { create } from "zustand";

function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark-mode", theme === "dark");
}
export const useThemeStore = create((set) => ({
    theme: "dark", 
    setTheme: (theme) => {
       const forcedTheme = "dark";
        localStorage.setItem("chat-theme", forcedTheme);
        applyTheme(forcedTheme);
        set({ theme: forcedTheme });
    },
    toggleTheme: () => {
       
        return;
    },
}));
localStorage.setItem("chat-theme", "dark");
applyTheme("dark");