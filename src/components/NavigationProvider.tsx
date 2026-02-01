'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

const routes = ['/', '/attendance', '/accounting', '/settings'];

const NavigationContext = createContext({ direction: 0 });
export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [lastIndex, setLastIndex] = useState(-1);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const currentIndex = routes.indexOf(pathname);
        if (lastIndex !== -1 && currentIndex !== -1 && currentIndex !== lastIndex) {
            setDirection(currentIndex > lastIndex ? 1 : -1);
        }
        setLastIndex(currentIndex);
    }, [pathname, lastIndex]);

    return (
        <NavigationContext.Provider value={{ direction }}>
            {children}
        </NavigationContext.Provider>
    );
}
