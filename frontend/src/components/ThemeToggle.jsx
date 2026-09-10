import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      aria-label="Đổi giao diện sáng/tối"
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
        isDark
          ? "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700/80 shadow-xs"
          : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80 shadow-xs"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0 text-slate-700" />
      )}
    </button>
  );
}
