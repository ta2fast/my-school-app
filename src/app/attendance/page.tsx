'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, Table as TableIcon, CheckCircle2, X, Bike } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer'

interface Student {
    id: string
    name: string
    furigana: string
    daily_rate: number
    has_bike_rental: boolean
}

interface Instructor {
    id: string
    name: string
    furigana: string
}

interface AttendanceRecord {
    id?: string
    student_id?: string
    instructor_id?: string
    date: string
    status: 'present' | 'absent' | 'late'
    location?: string
}

type ViewMode = 'daily' | 'monthly'

export default function AttendancePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AttendanceContent />
        </Suspense>
    )
}

function AttendanceContent() {
    const [students, setStudents] = useState<Student[]>([])
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('monthly')
    const [globalSettings, setGlobalSettings] = useState({ default_daily_rate: 2000, bike_rental_fee: 5000 })

    // Dates
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

    // Data for Daily
    const [dailyStudentAttendance, setDailyStudentAttendance] = useState<Record<string, boolean>>({})
    const [dailyInstructorStatus, setDailyInstructorStatus] = useState<Record<string, 'present' | 'late' | 'absent'>>({})
    const [dailyLocation, setDailyLocation] = useState('')
    const [locationHistory, setLocationHistory] = useState<string[]>([])

    // Data for Monthly
    const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([])
    const [editTarget, setEditTarget] = useState<{
        id: string;
        name: string;
        date: string;
        status: string | null;
        isInstructor: boolean;
    } | null>(null)
    const [editingDate, setEditingDate] = useState<string | null>(null)
    const [newDateValue, setNewDateValue] = useState('')
    const [isFinalized, setIsFinalized] = useState(false)
    const [finalizing, setFinalizing] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        const monthParam = searchParams.get('month')
        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            setSelectedMonth(monthParam)
            setViewMode('monthly')
        }
    }, [searchParams])

    // Fetch Master Data
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [sRes, iRes, lRes, setRes] = await Promise.all([
                supabase.from('students').select('id, name, furigana, daily_rate, has_bike_rental').order('furigana', { ascending: true }),
                supabase.from('instructors').select('id, name, furigana').order('furigana', { ascending: true }),
                supabase.from('attendance').select('location').not('location', 'is', null),
                supabase.from('settings').select('*')
            ])
            setStudents(sRes.data || [])
            setInstructors(iRes.data || [])

            if (setRes.data) {
                const dr = setRes.data.find(s => s.key === 'default_daily_rate')
                const bf = setRes.data.find(s => s.key === 'bike_rental_fee')
                setGlobalSettings({
                    default_daily_rate: parseInt(dr?.value || '2000'),
                    bike_rental_fee: parseInt(bf?.value || '5000')
                })
            }

            // Extract unique locations for history
            const locs = Array.from(new Set(lRes.data?.map(d => d.location).filter(Boolean) as string[]))
            setLocationHistory(locs)
        } catch (error) {
            console.error('Error fetching master data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch Daily Attendance
    const fetchDailyData = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('id, student_id, instructor_id, status, location')
                .eq('date', selectedDate)
            if (error) throw error

            const sMapping: Record<string, boolean> = {}
            const iMapping: Record<string, 'present' | 'late' | 'absent'> = {}
            if (data && data.length > 0) {
                setDailyLocation(data[0].location || '')
                data.forEach(r => {
                    if (r.student_id && r.status === 'present') sMapping[r.student_id] = true
                    if (r.instructor_id) iMapping[r.instructor_id] = r.status as 'present' | 'late' | 'absent'
                })
            } else {
                setDailyLocation('')
            }
            setDailyStudentAttendance(sMapping)
            setDailyInstructorStatus(iMapping)

            // Check if this date's month is finalized
            const monthOfDate = selectedDate.slice(0, 7)
            const { data: fData } = await supabase
                .from('monthly_finalizations')
                .select('is_finalized')
                .eq('month', monthOfDate)
                .single()

            setIsFinalized(fData?.is_finalized || false)
        } catch (error) {
            console.error('Error fetching daily data:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    // Fetch Monthly Attendance
    const fetchMonthlyData = useCallback(async () => {
        setLoading(true)
        try {
            const startOfMonth = `${selectedMonth}-01`
            const nextMonth = new Date(selectedMonth + '-01')
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            const endOfMonth = nextMonth.toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('attendance')
                .select('id, student_id, instructor_id, date, status, location')
                .gte('date', startOfMonth)
                .lt('date', endOfMonth)
            if (error) throw error
            setMonthlyRecords(data || [])

            // Fetch finalization status
            const { data: fData } = await supabase
                .from('monthly_finalizations')
                .select('is_finalized')
                .eq('month', selectedMonth)
                .single()

            setIsFinalized(fData?.is_finalized || false)
        } catch (error) {
            console.error('Error fetching monthly data:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (viewMode === 'daily') fetchDailyData()
        else fetchMonthlyData()
    }, [viewMode, fetchDailyData, fetchMonthlyData])

    // Save Daily
    const handleSaveDaily = async () => {
        if (isFinalized) return
        setSaving(true)
        try {
            // Prepare records
            const sRecords = students.map(s => ({
                student_id: s.id,
                date: selectedDate,
                status: dailyStudentAttendance[s.id] ? 'present' : 'absent',
                location: dailyLocation
            }))
            const iRecords = instructors.map(i => ({
                instructor_id: i.id,
                date: selectedDate,
                status: dailyInstructorStatus[i.id] || 'absent',
                location: dailyLocation
            }))

            const records = [...sRecords, ...iRecords]

            const { error: deleteError } = await supabase
                .from('attendance')
                .delete()
                .eq('date', selectedDate)
            if (deleteError) throw deleteError

            const { error: insertError } = await supabase
                .from('attendance')
                .insert(records)
            if (insertError) throw insertError

            alert('出欠を保存しました。')
            fetchDailyData()
        } catch (error) {
            console.error('Error saving daily attendance:', error)
            alert('保存に失敗しました。')
        } finally {
            setSaving(false)
        }
    }

    // Unified Grid Helper for Monthly
    const gridData = useMemo(() => {
        const grid: Record<string, Record<string, AttendanceRecord>> = {}
        const dates = new Set<string>()
        const locationMap: Record<string, string> = {}
        const totals: Record<string, number> = {}

        monthlyRecords.forEach(r => {
            const id = r.student_id || r.instructor_id
            if (id) {
                if (!grid[id]) grid[id] = {}
                grid[id][r.date] = r
                dates.add(r.date)
                if (r.location) locationMap[r.date] = r.location

                if (r.status === 'present') {
                    totals[id] = (totals[id] || 0) + 1
                } else if (r.status === 'late') {
                    totals[id] = (totals[id] || 0) + 0.5
                }
            }
        })

        return {
            attendance: grid,
            activeDates: Array.from(dates).sort(),
            locations: locationMap,
            totals
        }
    }, [monthlyRecords])

    const handleUpdateStatus = async (status: 'present' | 'late' | 'absent' | 'none') => {
        if (!editTarget || isFinalized) return

        const { id, date, isInstructor } = editTarget
        const record = gridData.attendance[id]?.[date]

        try {
            if (status === 'none') {
                if (record?.id) {
                    await supabase.from('attendance').delete().eq('id', record.id)
                }
            } else {
                const existingLocation = gridData.locations[date] || ""
                const newRecord = {
                    ...(record?.id ? { id: record.id } : {}),
                    date,
                    status: status as any,
                    location: existingLocation,
                    ...(isInstructor ? { instructor_id: id } : { student_id: id })
                }
                await supabase.from('attendance').upsert(newRecord)
            }
            fetchMonthlyData()
            setEditTarget(null)
        } catch (error) {
            console.error('Error updating status:', error)
            alert('更新に失敗しました。')
        }
    }

    const handleUpdateDate = async () => {
        if (!editingDate || !newDateValue || isFinalized) return
        if (editingDate === newDateValue) {
            setEditingDate(null)
            return
        }

        try {
            const { error } = await supabase
                .from('attendance')
                .update({ date: newDateValue })
                .eq('date', editingDate)

            if (error) throw error

            alert('日付を更新しました。')
            fetchMonthlyData()
            setEditingDate(null)
        } catch (error) {
            console.error('Error updating date:', error)
            alert('日付の更新に失敗しました。')
        }
    }

    const handleFinalize = async () => {
        if (!confirm(`${selectedMonth}の出欠を確定しますか？\n確定すると月謝の計算・集金が可能になります。`)) return

        setFinalizing(true)
        try {
            const { error } = await supabase
                .from('monthly_finalizations')
                .upsert({
                    month: selectedMonth,
                    is_finalized: true,
                    finalized_at: new Date().toISOString()
                }, { onConflict: 'month' })

            if (error) throw error
            setIsFinalized(true)
            alert('出欠を確定しました。月謝ページで集金作業を行ってください。')
        } catch (error) {
            console.error('Error finalizing month:', error)
            alert('確定に失敗しました。')
        } finally {
            setFinalizing(false)
        }
    }

    const toggleDailyS = (id: string) => {
        if (isFinalized) return
        setDailyStudentAttendance(prev => ({ ...prev, [id]: !prev[id] }))
    }
    const toggleDailyI = (id: string) => {
        if (isFinalized) return
        setDailyInstructorStatus(prev => {
            const current = prev[id] || 'absent'
            let next: 'present' | 'late' | 'absent' = 'present'
            if (current === 'present') next = 'late'
            else if (current === 'late') next = 'absent'
            else if (current === 'absent') next = 'present'
            return { ...prev, [id]: next }
        })
    }

    const changeDate = (days: number) => {
        const d = new Date(selectedDate)
        d.setDate(d.getDate() + days)
        setSelectedDate(d.toISOString().split('T')[0])
    }

    const changeMonth = (months: number) => {
        const d = new Date(selectedMonth + '-01')
        d.setMonth(d.getMonth() + months)
        setSelectedMonth(d.toISOString().slice(0, 7))
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24 text-foreground">
            {/* Header / Tabs */}
            <div className="bg-background border-b sticky top-0 z-30 pt-4 px-4 shadow-sm">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-foreground">
                            <h1 className="text-xl font-black italic uppercase tracking-tighter">Attendance</h1>
                            {viewMode === 'monthly' && (
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                    isFinalized
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}>
                                    <span className={cn("w-2 h-2 rounded-full animate-pulse", isFinalized ? "bg-emerald-500" : "bg-amber-500")} />
                                    {isFinalized ? "確定済み" : "未確定"}
                                </div>
                            )}
                        </div>
                        <div className="flex p-1 bg-muted rounded-lg">
                            <Button
                                variant={viewMode === 'daily' ? 'outline' : 'ghost'}
                                size="sm"
                                className={`rounded-md h-8 ${viewMode === 'daily' ? 'bg-background shadow-sm' : ''}`}
                                onClick={() => setViewMode('daily')}
                            >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                入力
                            </Button>
                            <Button
                                variant={viewMode === 'monthly' ? 'outline' : 'ghost'}
                                size="sm"
                                className={`rounded-md h-8 ${viewMode === 'monthly' ? 'bg-background shadow-sm' : ''}`}
                                onClick={() => setViewMode('monthly')}
                            >
                                <TableIcon className="h-4 w-4 mr-2" />
                                まとめ
                            </Button>
                        </div>
                    </div>

                    {/* Date/Month Selectors */}
                    <div className="flex flex-col items-center gap-2 pb-3">
                        <div className="flex items-center justify-center gap-4">
                            {viewMode === 'daily' ? (
                                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 border border-border">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeDate(-1)}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-sm font-bold focus:ring-0 w-32 text-center text-foreground dark:invert-0"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        disabled={loading}
                                    />
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeDate(1)}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 border border-border">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeMonth(-1)}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <input
                                        type="month"
                                        className="bg-transparent border-none text-sm font-bold focus:ring-0 w-36 text-center text-foreground dark:invert-0"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        disabled={loading}
                                    />
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeMonth(1)}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {viewMode === 'daily' && (
                            <div className="w-full max-w-sm space-y-2">
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        list="location-history"
                                        placeholder="実施場所を入力 (例: 公園、スタジオ)"
                                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                                        value={dailyLocation}
                                        onChange={(e) => setDailyLocation(e.target.value)}
                                        disabled={isFinalized}
                                    />
                                    <datalist id="location-history">
                                        {locationHistory.map(loc => (
                                            <option key={loc} value={loc} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
                {viewMode === 'daily' ? (
                    <div className="p-4 space-y-6">
                        {/* Student Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50/50 rounded-md border border-blue-100 uppercase tracking-widest">
                                <span>生徒 / Students</span>
                                <span>出席状況</span>
                            </div>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
                            ) : students.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground text-sm italic">生徒が登録されていません</p>
                            ) : (
                                students.map(student => (
                                    <div
                                        key={student.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                            !isFinalized && "cursor-pointer active:scale-[0.98]",
                                            dailyStudentAttendance[student.id]
                                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                                                : 'bg-background border-border opacity-60'
                                        )}
                                        onClick={() => toggleDailyS(student.id)}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground truncate leading-tight font-mono">{student.furigana}</p>
                                            <h3 className="font-black text-foreground text-lg tracking-tight">{student.name}</h3>
                                        </div>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${dailyStudentAttendance[student.id]
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'bg-background border-border/50'
                                            }`}>
                                            {dailyStudentAttendance[student.id] && <CheckCircle2 className="h-6 w-6 text-white" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Instructor Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 px-3 text-xs font-bold text-orange-700 bg-orange-50/50 rounded-md border border-orange-100 uppercase tracking-widest">
                                <span>講師 / Instructors</span>
                                <span>出勤状況</span>
                            </div>
                            {loading ? (
                                <Skeleton className="h-24 w-full rounded-2xl" />
                            ) : instructors.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-muted rounded-2xl">
                                    <p className="text-muted-foreground text-sm italic">講師が登録されていません</p>
                                </div>
                            ) : (
                                instructors.map(ins => {
                                    const status = dailyInstructorStatus[ins.id] || 'absent'
                                    return (
                                        <div
                                            key={ins.id}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                !isFinalized && "cursor-pointer active:scale-[0.98]",
                                                status === 'present' ? 'bg-orange-500/10 border-orange-500/50' :
                                                    status === 'late' ? 'bg-yellow-500/10 border-yellow-500/50' :
                                                        'bg-background border-border opacity-40'
                                            )}
                                            onClick={() => toggleDailyI(ins.id)}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground truncate leading-tight font-mono">{ins.furigana}</p>
                                                <h3 className="font-black text-foreground text-lg tracking-tight">{ins.name}</h3>
                                            </div>
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${status === 'present' ? 'bg-orange-500 border-orange-500' :
                                                status === 'late' ? 'bg-yellow-500 border-yellow-500' :
                                                    'bg-background border-border/50'
                                                }`}>
                                                {status === 'present' ? <CheckCircle2 className="h-6 w-6 text-white" /> :
                                                    status === 'late' ? <span className="text-white font-black text-xl">▲</span> : null}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col pt-4 overflow-hidden">
                        <div className="flex-1 overflow-auto border border-border rounded-2xl mx-4 mb-4 bg-background shadow-sm">
                            <table className="w-full border-collapse text-[10px]">
                                <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm">
                                    <tr>
                                        <th className="sticky left-0 z-30 bg-muted px-1.5 py-2 border border-border text-left font-black min-w-[70px] text-foreground uppercase tracking-wider">氏名</th>
                                        <th className="px-1 py-1.5 border border-border text-center font-black bg-primary/5 text-primary min-w-[32px]">計</th>
                                        {isFinalized && (
                                            <th className="px-1 py-1.5 border border-border text-center font-black bg-emerald-500/5 text-emerald-600 min-w-[60px]">月謝</th>
                                        )}
                                        {gridData.activeDates.map(dateStr => (
                                            <th
                                                key={dateStr}
                                                className={cn(
                                                    "px-0.5 py-1.5 border border-border text-center font-bold min-w-[24px] text-foreground transition-colors",
                                                    !isFinalized && "cursor-pointer hover:bg-primary/20 hover:text-primary active:scale-95"
                                                )}
                                                onClick={() => {
                                                    if (!isFinalized) {
                                                        setEditingDate(dateStr)
                                                        setNewDateValue(dateStr)
                                                    }
                                                }}
                                            >
                                                {parseInt(dateStr.split('-')[2] || "0")}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-blue-500/5 font-black text-[8px] text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-loose">
                                        <td colSpan={gridData.activeDates.length + (isFinalized ? 3 : 2)} className="px-3 py-0.5 border border-border">生徒 / Students</td>
                                    </tr>
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="sticky left-0 z-10 bg-background px-1.5 py-2 border border-border font-black truncate max-w-[80px] border-r-border shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)] text-foreground">
                                                <div className="flex items-center gap-1">
                                                    {student.name}
                                                    {student.has_bike_rental && <Bike className="h-2.5 w-2.5 text-orange-500 shrink-0" />}
                                                </div>
                                            </td>
                                            <td className="px-1 py-1.5 border border-border text-center font-black bg-muted/20 text-foreground tabular-nums">{gridData.totals[student.id] || 0}</td>
                                            {isFinalized && (() => {
                                                const daysCount = gridData.totals[student.id] || 0
                                                const effectiveDailyRate = student.daily_rate > 0 ? student.daily_rate : globalSettings.default_daily_rate
                                                const baseAmount = daysCount * effectiveDailyRate
                                                const bikeAmount = student.has_bike_rental ? globalSettings.bike_rental_fee : 0
                                                const totalAmount = baseAmount + bikeAmount

                                                return (
                                                    <td className="px-1 py-1.5 border border-border text-right font-black bg-emerald-500/5 text-emerald-600 tabular-nums text-[9px]">
                                                        {new Intl.NumberFormat('ja-JP').format(totalAmount)}
                                                    </td>
                                                )
                                            })()}
                                            {gridData.activeDates.map(dateStr => {
                                                const record = gridData.attendance[student.id]?.[dateStr]
                                                const status = record?.status
                                                return (
                                                    <td
                                                        key={dateStr}
                                                        className={cn(
                                                            "px-0.5 py-1.5 border border-border text-center transition-colors",
                                                            !isFinalized && "cursor-pointer hover:bg-emerald-500/20"
                                                        )}
                                                        onClick={() => !isFinalized && setEditTarget({
                                                            id: student.id,
                                                            name: student.name,
                                                            date: dateStr,
                                                            status: record?.status || null,
                                                            isInstructor: false
                                                        })}
                                                    >
                                                        {status === 'present' ? <span className="text-emerald-600 font-black text-sm drop-shadow-sm">●</span> : status === 'absent' ? <span className="text-muted-foreground/20">・</span> : null}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}

                                    {instructors.length > 0 && (
                                        <tr className="bg-orange-500/5 font-black text-[8px] text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-loose">
                                            <td colSpan={gridData.activeDates.length + (isFinalized ? 3 : 2)} className="px-3 py-0.5 border border-border">講師 / Instructors</td>
                                        </tr>
                                    )}
                                    {instructors.map(ins => (
                                        <tr key={ins.id} className="hover:bg-orange-500/5 transition-colors">
                                            <td className="sticky left-0 z-10 bg-background px-1.5 py-2 border border-border font-black truncate max-w-[80px] border-r-border shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)] text-foreground">
                                                {ins.name}
                                            </td>
                                            <td className="px-1 py-1.5 border border-border text-center font-black bg-muted/20 text-foreground tabular-nums">{gridData.totals[ins.id] || 0}</td>
                                            {isFinalized && (
                                                <td className="px-1 py-1.5 border border-border bg-emerald-500/5"></td>
                                            )}
                                            {gridData.activeDates.map(dateStr => {
                                                const record = gridData.attendance[ins.id]?.[dateStr]
                                                const status = record?.status
                                                return (
                                                    <td
                                                        key={dateStr}
                                                        className={cn(
                                                            "px-0.5 py-1.5 border border-border text-center transition-colors",
                                                            !isFinalized && "cursor-pointer hover:bg-orange-500/20"
                                                        )}
                                                        onClick={() => !isFinalized && setEditTarget({
                                                            id: ins.id,
                                                            name: ins.name,
                                                            date: dateStr,
                                                            status: record?.status || null,
                                                            isInstructor: true
                                                        })}
                                                    >
                                                        {status === 'present' ? <span className="text-orange-600 font-black text-sm drop-shadow-sm">●</span> :
                                                            status === 'late' ? <span className="text-yellow-600 font-black text-sm drop-shadow-sm">▲</span> :
                                                                status === 'absent' ? <span className="text-muted-foreground/20">・</span> : null}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}

                                    <tr className="bg-muted text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                        <td className="sticky left-0 z-10 bg-muted px-1.5 py-2 border border-border">場所</td>
                                        <td className="border border-border"></td>
                                        {isFinalized && (
                                            <td className="border border-border bg-emerald-500/5"></td>
                                        )}
                                        {gridData.activeDates.map(dateStr => (
                                            <td key={dateStr} className="px-0.5 py-1.5 border border-border text-center truncate italic max-w-[24px] overflow-hidden">{gridData.locations[dateStr] || "-"}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Finalization Action */}
                        {!isFinalized && gridData.activeDates.length > 0 && (
                            <div className="px-4 pb-6">
                                <Button
                                    className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-900/10 transition-transform active:scale-[0.98]"
                                    onClick={handleFinalize}
                                    disabled={finalizing || loading}
                                >
                                    {finalizing ? "確定中..." : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            {selectedMonth.split('-')[1]}月分の出欠を確定する
                                        </>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground mt-2 font-bold italic">
                                    ※ 出欠を確定すると、月謝ページで合計金額が表示されます。
                                </p>
                            </div>
                        )}
                        {isFinalized && (
                            <div className="px-4 pb-6">
                                <div className="w-full py-4 rounded-2xl bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                                        <CheckCircle2 className="h-5 w-5" />
                                        出欠確定済み / LOCKED
                                    </div>
                                    <p className="text-[10px] text-emerald-600/70 font-black uppercase tracking-widest">
                                        月謝回収の準備ができています
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Save Button (only for daily) */}
            {viewMode === 'daily' && (
                <div className="fixed bottom-20 inset-x-0 p-4 max-w-lg mx-auto z-40">
                    <Button
                        className={cn(
                            "w-full h-14 rounded-full shadow-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            isFinalized
                                ? "bg-muted text-muted-foreground border-2 border-border"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20"
                        )}
                        onClick={handleSaveDaily}
                        disabled={saving || loading || isFinalized}
                    >
                        {saving ? "保存中..." : (
                            <>
                                {isFinalized ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6" />
                                        確定済み (編集不可)
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-6 w-6" />
                                        出欠を保存する
                                    </>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Attendance Edit Drawer */}
            <Drawer open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm p-6">
                        <DrawerHeader className="px-0">
                            <DrawerTitle className="text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Attendance Update</div>
                                <div className="text-2xl font-black italic tracking-tighter">{editTarget?.name}</div>
                                <div className="text-xs font-bold text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {editTarget?.date.replace(/-/g, '/')}
                                </div>
                            </DrawerTitle>
                        </DrawerHeader>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button
                                variant={editTarget?.status === 'present' ? 'default' : 'outline'}
                                className={cn(
                                    "h-20 text-lg font-black flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all",
                                    editTarget?.status === 'present'
                                        ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-500/20'
                                        : 'hover:bg-emerald-50 border-border'
                                )}
                                onClick={() => handleUpdateStatus('present')}
                            >
                                <span className="text-2xl">●</span>
                                出席
                            </Button>
                            <Button
                                variant={editTarget?.status === 'absent' ? 'default' : 'outline'}
                                className={cn(
                                    "h-20 text-lg font-black flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all",
                                    editTarget?.status === 'absent'
                                        ? 'bg-muted-foreground text-white border-muted-foreground'
                                        : 'hover:bg-muted border-border'
                                )}
                                onClick={() => handleUpdateStatus('absent')}
                            >
                                <span className="text-2xl">・</span>
                                欠席
                            </Button>
                            {editTarget?.isInstructor && (
                                <Button
                                    variant={editTarget?.status === 'late' ? 'default' : 'outline'}
                                    className={cn(
                                        "h-20 text-lg font-black flex flex-col items-center justify-center gap-1 col-span-2 rounded-2xl border-2 transition-all",
                                        editTarget?.status === 'late'
                                            ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600 shadow-lg shadow-yellow-500/20 text-white'
                                            : 'hover:bg-yellow-50 border-border'
                                    )}
                                    onClick={() => handleUpdateStatus('late')}
                                >
                                    <span className="text-2xl font-black">▲</span>
                                    遅刻 / LATE
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="h-14 text-muted-foreground font-black text-xs uppercase tracking-widest col-span-2 mt-4 rounded-xl border-2 border-dashed border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all"
                                onClick={() => handleUpdateStatus('none')}
                            >
                                <X className="h-4 w-4 mr-2" />
                                記録を消去 / CLEAR
                            </Button>
                        </div>
                        <DrawerFooter className="px-0 mt-8 pb-10">
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest">Cancel</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
            {/* Date Edit Drawer */}
            <Drawer open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm p-6">
                        <DrawerHeader className="px-0">
                            <DrawerTitle className="text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Date Correction</div>
                                <div className="text-2xl font-black italic tracking-tighter uppercase">日付の修正</div>
                                <p className="text-xs font-bold text-muted-foreground mt-2">
                                    対象日: {editingDate?.replace(/-/g, '/')}
                                </p>
                            </DrawerTitle>
                        </DrawerHeader>
                        <div className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">新しい日付</label>
                                <input
                                    type="date"
                                    className="w-full bg-muted/50 border border-border/50 rounded-2xl h-14 px-4 font-black text-lg focus:ring-4 focus:ring-primary/10 outline-none"
                                    value={newDateValue}
                                    onChange={(e) => setNewDateValue(e.target.value)}
                                />
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                <p className="text-[10px] font-bold text-amber-600 leading-relaxed italic">
                                    ※ この操作により、{editingDate?.replace(/-/g, '/')} の全ての出欠記録（生徒・講師）が新しい日付に移動します。
                                </p>
                            </div>
                            <div className="space-y-3 pb-8">
                                <Button
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
                                    onClick={handleUpdateDate}
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    日付を更新する
                                </Button>
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground font-bold italic">CANCEL</Button>
                                </DrawerClose>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
