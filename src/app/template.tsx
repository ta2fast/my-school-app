'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useNavigation } from '@/components/NavigationProvider'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: ReactNode }) {
    const { direction } = useNavigation()
    const pathname = usePathname()

    const variants = {
        initial: (dir: number) => ({
            x: dir > 0 ? '30%' : dir < 0 ? '-30%' : 0,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
        },
    }

    return (
        <motion.div
            key={pathname}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }}
            className="w-full"
        >
            {children}
        </motion.div>
    )
}
