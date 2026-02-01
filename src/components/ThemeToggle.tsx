"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("theme");
        if (stored === "light") {
            setIsDark(false);
            document.documentElement.classList.remove("dark");
        } else {
            // Default to dark
            setIsDark(true);
            document.documentElement.classList.add("dark");
            if (!stored) localStorage.setItem("theme", "dark");
        }
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);

        if (newIsDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    // SSRでのハイドレーションエラー防止
    if (!mounted) {
        return (
            <button
                className="p-2 rounded-full bg-muted hover:bg-accent transition-colors"
                aria-label="テーマ切り替え"
            >
                <div className="w-5 h-5" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
                <Moon className="w-5 h-5 text-slate-700" />
            )}
        </button>
    );
}
