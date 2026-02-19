import * as React from "react"
import { cn, getJapaneseEra } from "@/lib/utils"

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
        if (type === "date") {
            const y = currentYear || String(new Date().getFullYear())
            const d = currentDay.padStart(2, "0") || "01"
            // Ensure day is valid for the new month
            const lastDay = new Date(parseInt(y), parseInt(month), 0).getDate()
            const safeDay = Math.min(parseInt(d), lastDay).toString().padStart(2, "0")
            onChange(`${y}-${mStr}-${safeDay}`)
        } else {
            const y = currentYear || String(new Date().getFullYear())
            onChange(`${y}-${mStr}`)
        }
    }

    const handleDayChange = (day: string) => {
        const dStr = day.padStart(2, "0")
        const y = currentYear || String(new Date().getFullYear())
        const m = currentMonth.padStart(2, "0") || "01"
        onChange(`${y}-${m}-${dStr}`)
    }

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <div className="flex gap-2">
                {/* Year Select */}
                <div className="flex-[2]">
                    <select
                        value={currentYear}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="flex-1">
                    <select
                        value={currentMonth}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        required={required}
                    >
                        <option value="">月</option>
                        {months.map(m => <option key={m} value={m}>{m}月</option>)}
                    </select>
                </div>

                {/* Day Select */}
                {type === "date" && (
                    <div className="flex-1">
                        <select
                            value={currentDay}
                            onChange={(e) => handleDayChange(e.target.value)}
                            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            required={required}
                        >
                            <option value="">日</option>
                            {days.map(d => <option key={d} value={d}>{d}日</option>)}
                        </select>
                    </div>
                )}
            </div>
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
