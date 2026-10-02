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
      aria-pressed={isDark}
      className={`icon-button ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0 text-foreground" />
      )}
    </button>
  );
}
