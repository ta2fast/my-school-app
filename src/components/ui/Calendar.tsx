'use client'

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface CalendarProps {
    selected?: Date
    onSelect: (date: Date) => void
    className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [viewDate, setViewDate] = React.useState(selected || new Date())
    const [direction, setDirection] = React.useState(0)

    const viewYear = viewDate.getFullYear()
    const viewMonth = viewDate.getMonth()

    const monthName = new Intl.DateTimeFormat('ja-JP', { month: 'long', year: 'numeric' }).format(viewDate)

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()

    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()
    const daysFromPrevMonth = firstDayOfMonth

    const totalSlots = 42 // 6 rows
    const days = []

    // Previous month days
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        days.push({
            day: prevMonthDays - i,
            month: viewMonth - 1,
            year: viewYear,
            isCurrentMonth: false
        })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            day: i,
            month: viewMonth,
            year: viewYear,
            isCurrentMonth: true
        })
    }

    // Next month days
    const remainingSlots = totalSlots - days.length
    for (let i = 1; i <= remainingSlots; i++) {
        days.push({
            day: i,
            month: viewMonth + 1,
            year: viewYear,
            isCurrentMonth: false
        })
    }

    const nextMonth = () => {
        setDirection(1)
        setViewDate(new Date(viewYear, viewMonth + 1, 1))
    }

    const prevMonth = () => {
        setDirection(-1)
        setViewDate(new Date(viewYear, viewMonth - 1, 1))
    }

    const isSelected = (d: number, m: number, y: number) => {
        if (!selected) return false
        const date = new Date(y, m, d)
        return date.getTime() === selected.getTime()
    }

    const isToday = (d: number, m: number, y: number) => {
        const date = new Date(y, m, d)
        return date.getTime() === today.getTime()
    }

    const dayNames = ['日', '月', '火', '水', '木', '金', '土']

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 30 : -30,
            opacity: 0
        })
    }

    return (
        <div className={cn("p-3 bg-background/80 backdrop-blur-md rounded-2xl border border-border shadow-xl", className)}>
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-sm font-black italic tracking-tighter text-foreground">
                    {monthName}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((name, i) => (
                    <div key={name} className={cn(
                        "text-[10px] font-black text-center uppercase tracking-widest py-1",
                        i === 0 ? "text-red-500/70" : i === 6 ? "text-blue-500/70" : "text-muted-foreground"
                    )}>
                        {name}
                    </div>
                ))}
            </div>

            <div className="relative overflow-hidden h-[210px]">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={viewMonth + '-' + viewYear}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-7 gap-1 absolute inset-0"
                    >
                        {days.map((d, i) => {
                            const selectedState = isSelected(d.day, d.month, d.year)
                            const todayState = isToday(d.day, d.month, d.year)
                            const isWeekend = (i % 7 === 0) || (i % 7 === 6)

                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelect(new Date(d.year, d.month, d.day))}
                                    className={cn(
                                        "h-8 w-8 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center",
                                        d.isCurrentMonth ? "text-foreground" : "text-muted-foreground/30",
                                        selectedState ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10" :
                                            todayState ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                                "hover:bg-muted"
                                    )}
                                >
                                    {d.day}
                                    {todayState && !selectedState && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                                    )}
                                </button>
                            )
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center px-1">
                <button
                    onClick={() => {
                        onSelect(new Date())
                        setViewDate(new Date())
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    Today
                </button>
                <div className="text-[10px] font-bold text-muted-foreground italic">
                    Select a date
                </div>
            </div>
        </div>
    )
}
