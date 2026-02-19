import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
    value: string // YYYY-MM-DD or YYYY-MM
    onChange: (value: string) => void
    type?: "date" | "month"
    className?: string
    id?: string
    required?: boolean
}

export function DatePicker({
    value,
    onChange,
    type = "date",
    className,
    id: providedId,
    required
}: DatePickerProps) {
    const generatedId = React.useId()
    const id = providedId || generatedId

    // Parse current value
    const parts = value.split("-")
    const currentYear = parseInt(parts[0]) || new Date().getFullYear()
    const currentMonth = parseInt(parts[1]) || new Date().getMonth() + 1
    const currentDay = type === "date" ? (parseInt(parts[2]) || new Date().getDate()) : 1

    const years = React.useMemo(() => {
        const startYear = new Date().getFullYear() - 2
        const endYear = new Date().getFullYear() + 2
        const arr = []
        for (let i = startYear; i <= endYear; i++) arr.push(i)
        // Ensure currentYear is in the list
        if (!arr.includes(currentYear)) arr.push(currentYear)
        return arr.sort((a, b) => b - a)
    }, [currentYear])

    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    const days = React.useMemo(() => {
        if (type === "month") return []
        const lastDay = new Date(currentYear, currentMonth, 0).getDate()
        return Array.from({ length: lastDay }, (_, i) => i + 1)
    }, [currentYear, currentMonth, type])

    const updateDate = (y: number, m: number, d: number) => {
        const yStr = y.toString()
        const mStr = m.toString().padStart(2, "0")
        if (type === "date") {
            const lastDayOfNewMonth = new Date(y, m, 0).getDate()
            const safeDay = Math.min(d, lastDayOfNewMonth)
            const dStr = safeDay.toString().padStart(2, "0")
            onChange(`${yStr}-${mStr}-${dStr}`)
        } else {
            onChange(`${yStr}-${mStr}`)
        }
    }

    const handleToday = () => {
        const now = new Date()
        updateDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
    }

    const handleYesterday = () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        updateDate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())
    }

    const handlePrev = () => {
        const d = new Date(type === "date" ? value : `${value}-01`)
        if (type === "date") {
            d.setDate(d.getDate() - 1)
            updateDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
        } else {
            d.setMonth(d.getMonth() - 1)
            updateDate(d.getFullYear(), d.getMonth() + 1, 1)
        }
    }

    const handleNext = () => {
        const d = new Date(type === "date" ? value : `${value}-01`)
        if (type === "date") {
            d.setDate(d.getDate() + 1)
            updateDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
        } else {
            d.setMonth(d.getMonth() + 1)
            updateDate(d.getFullYear(), d.getMonth() + 1, 1)
        }
    }

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <div className="flex flex-col gap-2">
                {/* Selection Row */}
                <div className="flex gap-1.5 items-center">
                    {/* Year Select */}
                    <div className="flex-1 relative">
                        <select
                            value={currentYear}
                            onChange={(e) => updateDate(parseInt(e.target.value), currentMonth, currentDay)}
                            className="w-full h-12 bg-background/50 border border-border/50 rounded-2xl px-3 font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none text-center"
                        >
                            {years.map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                    </div>

                    <span className="text-muted-foreground font-black text-xs">/</span>

                    {/* Month Select */}
                    <div className="flex-1 relative">
                        <select
                            value={currentMonth}
                            onChange={(e) => updateDate(currentYear, parseInt(e.target.value), currentDay)}
                            className="w-full h-12 bg-background/50 border border-border/50 rounded-2xl px-2 font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none text-center"
                        >
                            {months.map(m => <option key={m} value={m}>{m}月</option>)}
                        </select>
                    </div>

                    {type === "date" && (
                        <>
                            <span className="text-muted-foreground font-black text-xs">/</span>
                            {/* Day Select */}
                            <div className="flex-1 relative">
                                <select
                                    value={currentDay}
                                    onChange={(e) => updateDate(currentYear, currentMonth, parseInt(e.target.value))}
                                    className="w-full h-12 bg-background/50 border border-border/50 rounded-2xl px-2 font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none text-center"
                                >
                                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation & Shortcut Row */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1 bg-muted/30 p-1 rounded-xl border border-border/30">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handlePrev}
                            className="h-9 flex-1 rounded-lg hover:bg-background/80"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleNext}
                            className="h-9 flex-1 rounded-lg hover:bg-background/80"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {type === "date" && (
                        <div className="flex flex-[2] gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleToday}
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 bg-background/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-500 transition-all"
                            >
                                今日
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleYesterday}
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 bg-background/50 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 transition-all"
                            >
                                昨日
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {/* Hidden native input for form compatibility, but without UI trigger */}
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                required={required}
            />
        </div>
    )
}
