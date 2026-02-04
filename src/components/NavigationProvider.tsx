'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const DEFAULT_ORDER = ['/attendance', '/students', '/tuition', '/accounting', '/settings'];

const NavigationContext = createContext({
    direction: 0,
    order: DEFAULT_ORDER,
    updateOrder: (newOrder: string[]) => { },
    navigateNext: () => { },
    navigatePrev: () => { }
});
export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
    const [lastIndex, setLastIndex] = useState(-1);
    const [direction, setDirection] = useState(0);
    const [wasSwiped, setWasSwiped] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('nav_order');
        if (stored) {
            try {
                let parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Migrate / to /students
                    parsed = parsed.map((p: string) => p === '/' ? '/students' : p);

                    // 新しいルートが含まれていない場合は追加（マージ）
                    const missingItems = DEFAULT_ORDER.filter((item: string) => !parsed.includes(item));
                    if (missingItems.length > 0) {
                        const newOrder = [...parsed, ...missingItems].filter((item: string) => DEFAULT_ORDER.includes(item));
                        setOrder(newOrder);
                        localStorage.setItem('nav_order', JSON.stringify(newOrder));
                    } else if (parsed.length === DEFAULT_ORDER.length) {
                        setOrder(parsed);
                    } else {
                        // 不要な項目が含まれている場合は削除
                        const cleanedOrder = parsed.filter((item: string) => DEFAULT_ORDER.includes(item));
                        setOrder(cleanedOrder);
                        localStorage.setItem('nav_order', JSON.stringify(cleanedOrder));
                    }
                }
            } catch (e) {
                console.error('Failed to parse nav_order', e);
                // パース失敗時はデフォルトを使用
                setOrder(DEFAULT_ORDER);
            }
        }
    }, []);

    const updateOrder = (newOrder: string[]) => {
        setOrder(newOrder);
        localStorage.setItem('nav_order', JSON.stringify(newOrder));
    };

    useEffect(() => {
        const currentIndex = order.indexOf(pathname);
        if (lastIndex !== -1 && currentIndex !== -1 && currentIndex !== lastIndex) {
            if (wasSwiped) {
                setDirection(currentIndex > lastIndex ? 1 : -1);
            } else {
                setDirection(0);
            }
        }
        setLastIndex(currentIndex);
        setWasSwiped(false);
    }, [pathname, lastIndex, wasSwiped, order]);

    const navigateNext = () => {
        const currentIndex = order.indexOf(pathname);
        if (currentIndex !== -1 && currentIndex < order.length - 1) {
            setWasSwiped(true);
            router.push(order[currentIndex + 1]);
        }
    };

    const navigatePrev = () => {
        const currentIndex = order.indexOf(pathname);
        if (currentIndex !== -1 && currentIndex > 0) {
            setWasSwiped(true);
            router.push(order[currentIndex - 1]);
        }
    };

    return (
        <NavigationContext.Provider value={{ direction, order, updateOrder, navigateNext, navigatePrev }}>
            {children}
        </NavigationContext.Provider>
    );
}
