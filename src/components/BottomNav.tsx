'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CalendarCheck, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { label: '名簿', icon: Users, href: '/' },
    { label: '出欠', icon: CalendarCheck, href: '/attendance' },
    { label: '会計', icon: Wallet, href: '/accounting' },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
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
