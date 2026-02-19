'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Wallet, CheckCircle2, User, CalendarDays, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'

interface Student {
    id: string
    name: string
    furigana: string
    daily_rate: number
    has_bike_rental: boolean
}

interface AttendanceRecord {
    student_id: string
    date: string
    status: 'present' | 'absent' | 'late'
}

interface PaymentRecord {
    id: string
    student_id: string
    month: string
    is_paid: boolean
    amount: number
}

export default function TuitionPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [globalSettings, setGlobalSettings] = useState<{ default_daily_rate: number, bike_rental_fee: number }>({ default_daily_rate: 2000, bike_rental_fee: 5000 })
    const [isFinalized, setIsFinalized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return now.toISOString().slice(0, 7) // YYYY-MM
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const startOfMonth = `${selectedMonth}-01`
            const nextMonthDate = new Date(selectedMonth + '-01')
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
            const endOfMonth = nextMonthDate.toISOString().split('T')[0]

            const [sRes, aRes, pRes, setRes, fRes] = await Promise.all([
                supabase.from('students').select('id, name, furigana, daily_rate, has_bike_rental').order('furigana', { ascending: true }),
                supabase.from('attendance')
                    .select('student_id, date, status')
                    .gte('date', startOfMonth)
                    .lt('date', endOfMonth)
                    .not('student_id', 'is', null),
                supabase.from('tuition_payments')
                    .select('*')
                    .eq('month', selectedMonth),
                supabase.from('settings').select('*'),
                supabase.from('monthly_finalizations').select('is_finalized').eq('month', selectedMonth).single()
            ])

            if (setRes.data) {
                const dr = setRes.data.find(s => s.key === 'default_daily_rate')
                const bf = setRes.data.find(s => s.key === 'bike_rental_fee')
                setGlobalSettings({
                    default_daily_rate: parseInt(dr?.value || '2000'),
                    bike_rental_fee: parseInt(bf?.value || '5000')
                })
            }

            setIsFinalized(fRes.data?.is_finalized || false)

            setStudents(sRes.data || [])
            setAttendance(aRes.data as AttendanceRecord[] || [])
            setPayments(pRes.data || [])
        } catch (error) {
            console.error('Error fetching tuition data:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const studentStats = useMemo(() => {
        return students.map(student => {
            const studentAttendance = attendance.filter(a => a.student_id === student.id && a.status === 'present')
            const payment = payments.find(p => p.student_id === student.id)
            const daysCount = studentAttendance.length

            const effectiveDailyRate = student.daily_rate > 0 ? student.daily_rate : globalSettings.default_daily_rate
            const baseAmount = daysCount * effectiveDailyRate
            const bikeAmount = student.has_bike_rental ? globalSettings.bike_rental_fee : 0

            // Only calculate total if finalized
            const calculatedAmount = isFinalized ? (baseAmount + bikeAmount) : 0

            return {
                ...student,
                daysCount,
                effectiveDailyRate,
                baseAmount,
                bikeAmount,
                calculatedAmount,
                isPaid: payment?.is_paid || false,
                paymentId: payment?.id
            }
        })
    }, [students, attendance, payments, globalSettings, isFinalized])

    const handleMarkAsPaid = useCallback(async (student: any) => {
        if (student.calculatedAmount <= 0) return
        if (!confirm(`${student.name}さんの月謝 ${student.calculatedAmount.toLocaleString()}円を回収済みにしますか？\n会計ページにも自動で記録されます。`)) return

        setProcessingId(student.id)
        try {
            // Check if transaction already exists for this student and month to prevent duplicates
            const txTitle = `月謝受領: ${student.name}`
            const txMemo = `${selectedMonth.split('-')[1]}月分 (出席: ${student.daysCount}日)`

            const { data: existingTx } = await supabase
                .from('transactions')
                .select('id')
                .eq('title', txTitle)
                .eq('memo', txMemo)
                .eq('amount', student.calculatedAmount)
                .maybeSingle()

            if (existingTx) {
                console.log('Transaction already exists, skipping transaction creation.')
            } else {
                // 1. Add income result to transactions
                const { error: txError } = await supabase
                    .from('transactions')
                    .insert({
                        date: new Date().toISOString().split('T')[0],
                        type: 'income',
                        category: 'スクール月謝',
                        amount: student.calculatedAmount,
                        title: txTitle,
                        memo: txMemo
                    })

                if (txError) throw txError
            }

            // 2. Update/Insert tuition_payments
            const { error: paymentError } = await supabase
                .from('tuition_payments')
                .upsert({
                    student_id: student.id,
                    month: selectedMonth,
                    amount: student.calculatedAmount,
                    is_paid: true,
                    paid_at: new Date().toISOString()
                }, { onConflict: 'student_id,month' })

            if (paymentError) throw paymentError

            alert('会計にも反映されました')
            fetchData()
        } catch (error) {
            console.error('Error processing payment:', error)
            alert('処理に失敗しました。')
        } finally {
            setProcessingId(null)
        }
    }, [selectedMonth, fetchData])

    const handleUnmarkAsPaid = useCallback(async (student: any) => {
        if (!confirm(`${student.name}さんの月謝回収記録を取り消しますか？\n会計ページの記録も削除されます。`)) return

        setProcessingId(student.id)
        try {
            // 1. Delete from tuition_payments
            const { error: paymentError } = await supabase
                .from('tuition_payments')
                .delete()
                .eq('student_id', student.id)
                .eq('month', selectedMonth)

            if (paymentError) throw paymentError

            // 2. Delete corresponding transaction
            const txTitle = `月謝受領: ${student.name}`
            const txMemo = `${selectedMonth.split('-')[1]}月分 (出席: ${student.daysCount}日)`

            const { error: txError } = await supabase
                .from('transactions')
                .delete()
                .eq('title', txTitle)
                .eq('memo', txMemo)
                .in('category', ['スクール月謝', 'スクール月謝収入'])

            if (txError) throw txError

            alert('取り消しました')
            fetchData()
        } catch (error) {
            console.error('Error unmarking payment:', error)
            alert('処理に失敗しました。')
        } finally {
            setProcessingId(null)
        }
    }, [selectedMonth, fetchData])

    const changeMonth = (months: number) => {
        const d = new Date(selectedMonth + '-01')
        d.setMonth(d.getMonth() + months)
        setSelectedMonth(d.toISOString().slice(0, 7))
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円'
    }

    const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24 text-foreground">
            <div className="bg-background border-b sticky top-0 z-30 pt-4 px-4 shadow-sm">
                <div className="max-w-4xl mx-auto space-y-4">
                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Tuition</h1>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">月謝回収状況</p>
                        </div>
                        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 border border-border">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="w-32 text-center font-black tracking-tight text-sm">
                                {selectedMonth.replace('-', '年')}月
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => changeMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </header>
                    <div className="pb-3 overflow-x-auto">
                        <div className="flex gap-4 min-w-max">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                    <Coins className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600/70 uppercase">回収済み合計</p>
                                    <p className="text-lg font-mono font-black">{formatCurrency(studentStats.filter(s => s.isPaid).reduce((acc, curr) => acc + curr.calculatedAmount, 0))}</p>
                                </div>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-rose-600/70 uppercase">残り未回収</p>
                                    <p className="text-lg font-mono font-black">{formatCurrency(studentStats.filter(s => !s.isPaid).reduce((acc, curr) => acc + curr.calculatedAmount, 0))}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-hidden">
                {!loading && !isFinalized ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 py-12 px-6 text-center">
                        <div className="bg-amber-100 dark:bg-amber-900/20 p-6 rounded-full">
                            <CalendarDays className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black italic uppercase tracking-tight">出欠確定が必要です</h2>
                            <p className="text-sm text-muted-foreground font-medium">
                                {selectedMonth.split('-')[1]}月分の出欠がまだ確定されていません。<br />
                                出欠ページで「今月の出欠を確定する」ボタンを押してください。
                            </p>
                        </div>
                        <Button
                            asChild
                            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-6 h-auto"
                        >
                            <a href={`/attendance?month=${selectedMonth}`}>出欠を確認しに行く</a>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))
                        ) : studentStats.length > 0 ? (
                            studentStats.map((student) => (
                                <div key={student.id} className={cn(
                                    "p-4 rounded-3xl border transition-all flex items-center justify-between",
                                    student.isPaid ? "bg-muted/30 border-border/50 opacity-80" : "bg-card border-border shadow-sm"
                                )}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-mono text-muted-foreground">{student.furigana}</p>
                                            {student.isPaid && <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">PAID</span>}
                                        </div>
                                        <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {student.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" />
                                                出席: {student.daysCount}日
                                            </span>
                                            {student.has_bike_rental && (
                                                <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full">
                                                    バイク込
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right space-y-2">
                                        <p className={cn(
                                            "text-xl font-mono font-black tabular-nums",
                                            student.isPaid ? "text-muted-foreground" : "text-foreground"
                                        )}>
                                            {formatCurrency(student.calculatedAmount)}
                                        </p>
                                        {!student.isPaid ? (
                                            <Button
                                                size="sm"
                                                disabled={processingId === student.id || student.calculatedAmount <= 0}
                                                onClick={() => handleMarkAsPaid(student)}
                                                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-8 px-4 shadow-lg shadow-indigo-900/20"
                                            >
                                                {processingId === student.id ? "..." : "回収済にする"}
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleUnmarkAsPaid(student)}
                                                    disabled={processingId === student.id}
                                                    className="text-[9px] font-bold text-muted-foreground hover:text-rose-500 underline underline-offset-2 transition-colors"
                                                >
                                                    取り消す
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-muted rounded-3xl">
                                <p className="text-sm font-bold text-muted-foreground italic">生徒が登録されていません</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
