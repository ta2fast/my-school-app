'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, Table as TableIcon, CheckCircle2, X } from 'lucide-react'
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
            const [sRes, iRes, lRes] = await Promise.all([
                supabase.from('students').select('id, name, furigana').order('furigana', { ascending: true }),
                supabase.from('instructors').select('id, name, furigana').order('furigana', { ascending: true }),
                supabase.from('attendance').select('location').not('location', 'is', null)
            ])
            setStudents(sRes.data || [])
            setInstructors(iRes.data || [])

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
            const { data: fData, error: fError } = await supabase
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
        if (!editTarget) return

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
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-foreground">出欠管理</h1>
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
                                        className="bg-transparent border-none text-sm font-bold focus:ring-0 w-32 text-center text-foreground invert dark:invert-0"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
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
                                        className="bg-transparent border-none text-sm font-bold focus:ring-0 w-36 text-center text-foreground invert dark:invert-0"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
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
                                    />
                                    <datalist id="location-history">
                                        {locationHistory.map(loc => (
                                            <option key={loc} value={loc} />
                                        ))}
                                    </datalist>
                                </div>
                                {locationHistory.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {locationHistory.slice(0, 5).map(loc => (
                                            <button
                                                key={loc}
                                                type="button"
                                                className="text-[10px] bg-muted hover:bg-secondary text-muted-foreground px-2 py-0.5 rounded-full transition-colors"
                                                onClick={() => setDailyLocation(loc)}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                            <div className="flex justify-between items-center py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50/50 rounded-md border border-blue-100">
                                <span>生徒</span>
                                <span>出欠チェック</span>
                            </div>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
                            ) : students.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm italic">生徒が登録されていません</p>
                            ) : (
                                students.map(student => (
                                    key = { student.id }
                                        className = {
                                        cn(
                                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                                            !isFinalized && "cursor-pointer",
                                    dailyStudentAttendance[student.id]
                                        ? 'bg-green-500/10 border-green-500/50'
                                        : 'bg-background border-border grayscale-[0.5]'
                                )}
                            onClick={() => toggleDailyS(student.id)}
                                    >
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground truncate leading-tight">{student.furigana}</p>
                                <h3 className="font-bold text-foreground">{student.name}</h3>
                            </div>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${dailyStudentAttendance[student.id]
                                ? 'bg-green-600 border-green-600'
                                : 'bg-background border-border'
                                }`}>
                                {dailyStudentAttendance[student.id] && <CheckCircle2 className="h-5 w-5 text-white" />}
                            </div>
                        </div>
                        ))
                            )}
                    </div>

                        {/* Instructor Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 text-xs font-bold text-orange-700 bg-orange-50/50 rounded-md border border-orange-100">
                        <span>講師</span>
                        <span>出欠チェック</span>
                    </div>
                    {loading ? (
                        <Skeleton className="h-20 w-full rounded-xl" />
                    ) : instructors.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 border border-dashed rounded-xl">
                            <p className="text-gray-400 text-xs mb-2">講師が登録されていません</p>
                            <p className="text-[10px] text-muted-foreground italic">設定ページから登録してください</p>
                        </div>
                    ) : (
                        instructors.map(ins => {
                            const status = dailyInstructorStatus[ins.id] || 'absent'
                            return (
                                <div
                                    key={ins.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                                        !isFinalized && "cursor-pointer",
                                        status === 'present' ? 'bg-orange-500/10 border-orange-500/50' :
                                            status === 'late' ? 'bg-yellow-500/10 border-yellow-500/50' :
                                                'bg-background border-border grayscale-[0.8]'
                                    )}
                                    onClick={() => toggleDailyI(ins.id)}
                                >
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground truncate leading-tight">{ins.furigana}</p>
                                        <h3 className="font-bold text-foreground">{ins.name}</h3>
                                    </div>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${status === 'present' ? 'bg-orange-600 border-orange-600' :
                                        status === 'late' ? 'bg-yellow-600 border-yellow-600' :
                                            'bg-background border-border'
                                        }`}>
                                        {status === 'present' ? <CheckCircle2 className="h-5 w-5 text-white" /> :
                                            status === 'late' ? <span className="text-white font-bold text-sm">▲</span> : null}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
        </div>
    ) : (
        <div className="h-full flex flex-col pt-4 overflow-hidden">
            <div className="flex-1 overflow-auto border border-border rounded-xl mx-4 mb-4 bg-background shadow-sm">
                <table className="w-full border-collapse text-[10px]">
                    <thead className="sticky top-0 z-20 bg-muted shadow-sm">
                        <tr>
                            <th className="sticky left-0 z-30 bg-muted p-2 border border-border text-left font-bold min-w-[80px] text-foreground">氏名</th>
                            {gridData.activeDates.map(dateStr => (
                                <th key={dateStr} className="p-1 border border-border text-center font-medium min-w-[40px] text-foreground">
                                    {new Date(dateStr).getDate()}日
                                </th>
                            ))}
                            <th className="p-2 border border-border text-center font-bold bg-primary/20 text-primary min-w-[50px]">合計</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Student Header Rows */}
                        <tr className="bg-blue-500/10 font-bold text-[8px] text-blue-600 dark:text-blue-400">
                            <td colSpan={gridData.activeDates.length + 2} className="px-2 py-1 border border-border">生徒</td>
                        </tr>
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                <td className="sticky left-0 z-10 bg-background p-2 border border-border font-bold truncate max-w-[100px] border-r-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-foreground">
                                    {student.name}
                                </td>
                                {gridData.activeDates.map(dateStr => {
                                    const record = gridData.attendance[student.id]?.[dateStr]
                                    const status = record?.status
                                    return (
                                        key = { dateStr }
                                                        className = {
                                        cn(
                                                            "p-1 border border-border text-center",
                                                            !isFinalized && "cursor-pointer hover:bg-green-500/10"
                                                        )}
                                onClick={() => !isFinalized && setEditTarget({
                                    id: student.id,
                                    name: student.name,
                                    date: dateStr,
                                    status: record?.status || null,
                                    isInstructor: false
                                })}
                                                    >
                                {status === 'present' ? <span className="text-green-600 font-bold text-sm">●</span> : status === 'absent' ? <span className="text-muted-foreground/30">・</span> : null}
                            </td>
                        )
                                            })}
                        <td className="p-1 border border-border text-center font-bold bg-muted/30 text-foreground">{gridData.totals[student.id] || 0}</td>
                    </tr>
                                    ))}

                    {/* Instructor Header Rows */}
                    {instructors.length > 0 && (
                        <tr className="bg-orange-500/10 font-bold text-[8px] text-orange-600 dark:text-orange-400">
                            <td colSpan={gridData.activeDates.length + 2} className="px-2 py-1 border border-border">講師</td>
                        </tr>
                    )}
                    {instructors.map(ins => (
                        <tr key={ins.id} className="hover:bg-orange-500/10 transition-colors bg-orange-500/5">
                            <td className="sticky left-0 z-10 bg-background p-2 border border-border font-bold truncate max-w-[100px] border-r-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-foreground">
                                {ins.name}
                            </td>
                            {gridData.activeDates.map(dateStr => {
                                const record = gridData.attendance[ins.id]?.[dateStr]
                                const status = record?.status
                                return (
                                    <td
                                        key={dateStr}
                                        className={cn(
                                            "p-1 border border-border text-center",
                                            !isFinalized && "cursor-pointer hover:bg-orange-500/10"
                                        )}
                                        onClick={() => !isFinalized && setEditTarget({
                                            id: ins.id,
                                            name: ins.name,
                                            date: dateStr,
                                            status: record?.status || null,
                                            isInstructor: true
                                        })}
                                    >
                                        {status === 'present' ? <span className="text-orange-600 font-bold text-sm">●</span> :
                                            status === 'late' ? <span className="text-yellow-600 font-bold text-sm">▲</span> :
                                                status === 'absent' ? <span className="text-muted-foreground/30">・</span> : null}
                                    </td>
                                )
                            })}
                            <td className="p-1 border border-border text-center font-bold bg-muted/30 text-foreground">{gridData.totals[ins.id] || 0}</td>
                        </tr>
                    ))}

                    {/* Location Row */}
                    <tr className="bg-muted/50 text-foreground">
                        <td className="sticky left-0 z-10 bg-muted p-2 border border-border font-bold text-[8px] text-muted-foreground">実施場所</td>
                        {gridData.activeDates.map(dateStr => (
                            <td key={dateStr} className="p-1 border border-border text-center text-[8px] leading-tight text-muted-foreground">{gridData.locations[dateStr] || "-"}</td>
                        ))}
                        <td className="border border-border"></td>
                    </tr>
                </tbody>
            </table>
        </div>

                        {/* Finalization Action */ }
    {
        !isFinalized && gridData.activeDates.length > 0 && (
            <div className="px-4 pb-6">
                <Button
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-900/10"
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
                <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                    ※ 出欠を確定すると、月謝ページで金額が表示されます。
                </p>
            </div>
        )
    }
    {
        isFinalized && (
            <div className="px-4 pb-6">
                <div className="w-full py-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        出欠確定済み
                    </div>
                    <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">
                        月謝回収の準備ができています
                    </p>
                </div>
            </div>
        )
    }
                    </div >
                )
}
            </main >

    {/* Bottom Save Button (only for daily) */ }
{
    viewMode === 'daily' && (
        <div className="fixed bottom-20 inset-x-0 p-4 max-w-md mx-auto z-40">
            <Button
                className="w-full h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-lg font-bold flex items-center justify-center gap-2"
                onClick={handleSaveDaily}
                disabled={saving || loading}
            >
                {saving ? "保存中..." : (
                    <>
                        {isFinalized ? (
                            <>
                                <CheckCircle2 className="h-5 w-5" />
                                確定済み (編集不可)
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                出欠を保存する
                            </>
                        )}
                    </>
                )}
            </Button>
        </div>
    )
}

{/* Attendance Edit Drawer */ }
<Drawer open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
    <DrawerContent>
        <div className="mx-auto w-full max-w-sm p-6">
            <DrawerHeader className="px-0">
                <DrawerTitle className="text-center">
                    {editTarget?.name}
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                        {editTarget?.date.replace(/-/g, '/')} の出欠
                    </div>
                </DrawerTitle>
            </DrawerHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                    variant={editTarget?.status === 'present' ? 'default' : 'outline'}
                    className={`h-16 text-lg font-bold flex flex-col items-center justify-center gap-1 ${editTarget?.status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => handleUpdateStatus('present')}
                >
                    <span className="text-xl">●</span>
                    出席
                </Button>
                <Button
                    variant={editTarget?.status === 'absent' ? 'default' : 'outline'}
                    className="h-16 text-lg font-bold flex flex-col items-center justify-center gap-1"
                    onClick={() => handleUpdateStatus('absent')}
                >
                    <span className="text-xl">・</span>
                    欠席
                </Button>
                {editTarget?.isInstructor && (
                    <Button
                        variant={editTarget?.status === 'late' ? 'default' : 'outline'}
                        className={`h-16 text-lg font-bold flex flex-col items-center justify-center gap-1 col-span-2 ${editTarget?.status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                        onClick={() => handleUpdateStatus('late')}
                    >
                        <span className="text-xl">▲</span>
                        遅刻
                    </Button>
                )}
                <Button
                    variant="ghost"
                    className="h-12 text-muted-foreground col-span-2 mt-2"
                    onClick={() => handleUpdateStatus('none')}
                >
                    <X className="h-4 w-4 mr-2" />
                    記録を消去
                </Button>
            </div>
            <DrawerFooter className="px-0 mt-6 pb-8">
                <DrawerClose asChild>
                    <Button variant="outline" className="w-full h-12">キャンセル</Button>
                </DrawerClose>
            </DrawerFooter>
        </div>
    </DrawerContent>
</Drawer>
        </div >
    )
}
