import * as React from "react"
import { cn, getJapaneseEra } from "@/lib/utils"
import { Calendar } from "./Calendar"
import { CalendarIcon } from "lucide-react"

interface DatePickerProps {
    value: string // YYYY-MM-DD or YYYY-MM
    onChange: (value: string) => void
    type?: "date" | "month"
    mode?: "calendar" | "dropdown"
    className?: string
    id?: string
    required?: boolean
}

export function DatePicker({
    value,
    onChange,
    type = "date",
    mode = "dropdown",
    className,
    id: providedId,
    required
}: DatePickerProps) {
    const generatedId = React.useId()
    const id = providedId || generatedId
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Close calendar on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Parse current value
    const parts = value.split("-")
    const currentYear = parts[0] || ""
    const currentMonth = parts[1] ? String(parseInt(parts[1])) : ""
    const currentDay = parts[2] ? String(parseInt(parts[2])) : ""

    const years = React.useMemo(() => {
        const nowYear = new Date().getFullYear()
        const startYear = nowYear - 100 // Allow up to 100 years ago (birthdays)
        const endYear = nowYear + 5
        const arr = []
        for (let i = endYear; i >= startYear; i--) arr.push(String(i))
        return arr
    }, [])

    const months = Array.from({ length: 12 }, (_, i) => String(i + 1))

    const days = React.useMemo(() => {
        if (type === "month" || !currentYear || !currentMonth) return []
        const lastDay = new Date(parseInt(currentYear), parseInt(currentMonth), 0).getDate()
        return Array.from({ length: lastDay }, (_, i) => String(i + 1))
    }, [currentYear, currentMonth, type])

    const handleYearChange = (year: string) => {
        if (type === "date") {
            const m = currentMonth.padStart(2, "0") || "01"
            const d = currentDay.padStart(2, "0") || "01"
            onChange(`${year}-${m}-${d}`)
        } else {
            const m = currentMonth.padStart(2, "0") || "01"
            onChange(`${year}-${m}`)
        }
    }

    const handleMonthChange = (month: string) => {
        const mStr = month.padStart(2, "0")
        const y = currentYear || String(new Date().getFullYear())
        if (type === "date") {
            const d = currentDay.padStart(2, "0") || "01"
            // Ensure day is valid for the new month
            const lastDay = new Date(parseInt(y), parseInt(month), 0).getDate()
            const safeDay = Math.min(parseInt(d) || 1, lastDay).toString().padStart(2, "0")
            onChange(`${y}-${mStr}-${safeDay}`)
        } else {
            onChange(`${y}-${mStr}`)
        }
    }

    const handleDayChange = (day: string) => {
        const dStr = day.padStart(2, "0")
        const y = currentYear || String(new Date().getFullYear())
        const m = currentMonth.padStart(2, "0") || "01"
        onChange(`${y}-${m}-${dStr}`)
    }

    const handleCalendarSelect = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, "0")
        const d = String(date.getDate()).padStart(2, "0")
        onChange(`${y}-${m}-${d}`)
        setIsCalendarOpen(false)
    }

    const formattedDisplayDate = React.useMemo(() => {
        if (!value) return "日付を選択"
        const d = new Date(value)
        if (isNaN(d.getTime())) return value
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        }).format(d)
    }, [value])

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {mode === "calendar" ? (
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-black shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50 transition-colors italic tracking-tighter"
                    >
                        <CalendarIcon className="h-4 w-4 text-indigo-600" />
                        <span className="flex-1 text-left truncate">{formattedDisplayDate}</span>
                    </button>

                    {isCalendarOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-[280px]">
                            <Calendar
                                selected={value ? new Date(value) : undefined}
                                onSelect={handleCalendarSelect}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2 w-full">
                    <div className="flex gap-2">
                        {/* Year Select */}
                        <div className="flex-[3]">
                            <select
                                value={currentYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                required={required}
                            >
                                <option value="">年</option>
                                {years.map(y => {
                                    const era = getJapaneseEra(Number(y));
                                    return (
                                        <option key={y} value={y}>
                                            {y}年 {era ? `(${era})` : ''}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        {/* Month Select */}
                        <div className="flex-[2]">
                            <select
                                value={currentMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                required={required}
                            >
                                <option value="">月</option>
                                {months.map(m => <option key={m} value={m}>{m}月</option>)}
                            </select>
                        </div>

                        {/* Day Select */}
                        {type === "date" && (
                            <div className="flex-[2]">
                                <select
                                    value={currentDay}
                                    onChange={(e) => handleDayChange(e.target.value)}
                                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    required={required}
                                >
                                    <option value="">日</option>
                                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Hidden native input for form compatibility */}
            <input
                id={id}
                type="hidden"
                value={value}
                required={required}
            />
        </div>
    )
}
