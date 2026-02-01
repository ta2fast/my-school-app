'use client'

import { motion, PanInfo } from 'framer-motion'
import { ReactNode } from 'react'
import { useNavigation } from './NavigationProvider'

export function SwipeWrapper({ children }: { children: ReactNode }) {
    const { navigateNext, navigatePrev } = useNavigation()

    const onDragEnd = (event: any, info: PanInfo) => {
        const threshold = 50
        const velocityThreshold = 500

        if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            navigateNext()
        } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            navigatePrev()
        }
    }

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="min-h-screen w-full touch-pan-y"
        >
            {children}
        </motion.div>
    )
}
