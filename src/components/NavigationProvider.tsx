'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const routes = ['/', '/attendance', '/accounting', '/settings'];

const NavigationContext = createContext({
    direction: 0,
    navigateNext: () => { },
    navigatePrev: () => { }
});
export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [lastIndex, setLastIndex] = useState(-1);
    const [direction, setDirection] = useState(0);
    const [wasSwiped, setWasSwiped] = useState(false);

    useEffect(() => {
        const currentIndex = routes.indexOf(pathname);
        if (lastIndex !== -1 && currentIndex !== -1 && currentIndex !== lastIndex) {
            if (wasSwiped) {
                setDirection(currentIndex > lastIndex ? 1 : -1);
            } else {
                setDirection(0); // No slide for direct link clicks
            }
        }
        setLastIndex(currentIndex);
        setWasSwiped(false);
    }, [pathname, lastIndex, wasSwiped]);

    const navigateNext = () => {
        const currentIndex = routes.indexOf(pathname);
        if (currentIndex !== -1 && currentIndex < routes.length - 1) {
            setWasSwiped(true);
            router.push(routes[currentIndex + 1]);
        }
    };

    const navigatePrev = () => {
        const currentIndex = routes.indexOf(pathname);
        if (currentIndex !== -1 && currentIndex > 0) {
            setWasSwiped(true);
            router.push(routes[currentIndex - 1]);
        }
    };

    return (
        <NavigationContext.Provider value={{ direction, navigateNext, navigatePrev }}>
            {children}
        </NavigationContext.Provider>
    );
}
