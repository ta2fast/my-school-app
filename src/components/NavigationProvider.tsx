'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const DEFAULT_ORDER = ['/attendance', '/', '/accounting', '/settings'];

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

    // Initialize order from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('nav_order');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) {
                    setOrder(parsed);
                }
            } catch (e) {
                console.error('Failed to parse nav_order', e);
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
