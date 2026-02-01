'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

const routes = ['/', '/attendance', '/accounting', '/settings']

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [prevPath, setPrevPath] = useState(pathname)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const prevIndex = routes.indexOf(prevPath)
        const currentIndex = routes.indexOf(pathname)

        if (prevIndex !== -1 && currentIndex !== -1) {
            setDirection(currentIndex > prevIndex ? 1 : -1)
        }
        setPrevPath(pathname)
    }, [pathname, prevPath])

    const transition = {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
    }

    const variants = {
        initial: (direction: number) => ({
            x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                x: transition,
                opacity: { duration: 0.2 }
            }
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
            opacity: 0,
            transition: {
                x: transition,
                opacity: { duration: 0.2 }
            }
        })
    }

    return (
        <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
                key={pathname}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
