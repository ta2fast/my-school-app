'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CalendarCheck, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useNavigation } from './NavigationProvider'
import { useMemo } from 'react'

const ALL_NAV_ITEMS = [
    { label: '名簿', icon: Users, href: '/students' },
    { label: '出欠', icon: CalendarCheck, href: '/attendance' },
    { label: '会計', icon: Wallet, href: '/accounting' },
    { label: '設定', icon: Settings, href: '/settings' },
]

export function BottomNav() {
    const pathname = usePathname()
    const { order } = useNavigation()

    const sortedItems = useMemo(() => {
        return [...ALL_NAV_ITEMS].sort((a, b) => {
            return order.indexOf(a.href) - order.indexOf(b.href)
        })
    }, [order])

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16">
                {sortedItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
