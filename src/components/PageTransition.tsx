'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'

const routes = ['/', '/attendance', '/accounting', '/settings']

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [lastPath, setLastPath] = useState(pathname)
    const [direction, setDirection] = useState(0)

    // Calculate direction when pathname changes
    if (pathname !== lastPath) {
        const prevIndex = routes.indexOf(lastPath)
        const currentIndex = routes.indexOf(pathname)

        if (prevIndex !== -1 && currentIndex !== -1) {
            const nextDirection = currentIndex > prevIndex ? 1 : -1
            if (nextDirection !== direction) {
                setDirection(nextDirection)
            }
        }
        setLastPath(pathname)
    }

    const variants = {
        initial: (dir: number) => ({
            x: dir > 0 ? '30%' : dir < 0 ? '-30%' : 0,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '-30%' : dir < 0 ? '30%' : 0,
            opacity: 0,
        })
    }

    return (
        <AnimatePresence mode="wait" initial={true}>
            <motion.div
                key={pathname}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.15 }
                }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
