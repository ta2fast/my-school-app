'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AccountingDashboard } from '@/components/AccountingDashboard'
import { TransactionForm } from '@/components/TransactionForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt, Calendar, Tag, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Transaction {
    id: string
    date: string
    type: 'income' | 'expense'
    category: string
    amount: number
    title: string
    memo?: string
}

export default function AccountingPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [defaultType, setDefaultType] = useState<'income' | 'expense'>('income')
    const [stats, setStats] = useState({ balance: 0, incomeTotal: 0, expenseTotal: 0 })
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])

    const fetchTransactions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            const txs = data || []
            setTransactions(txs)

            // 履歴から重複を除いたタイトルを取得
            const uniqueTitles = Array.from(new Set(txs.map(t => t.title))).filter(Boolean) as string[]
            setTitleSuggestions(uniqueTitles)

            // 全体の残高計算
            const balance = txs.reduce((acc, curr) =>
                curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)

            // 選択された月の集計
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
            const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

            const monthTxs = txs.filter(t => t.date >= startOfMonth && t.date <= endOfMonth)
            const incomeTotal = monthTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
            const expenseTotal = monthTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)

            setStats({ balance, incomeTotal, expenseTotal })
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }, [currentMonth])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleUpsertTransaction = async (data: any) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('transactions')
                .upsert([data])

            if (error) throw error
            setShowForm(false)
            setEditingTx(null)
            fetchTransactions()
        } catch (error: any) {
            console.error('Error saving transaction:', error)
            alert('保存に失敗しました: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('この取引を削除しますか？')) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            setShowForm(false)
            setEditingTx(null)
            fetchTransactions()
        } catch (error: any) {
            console.error('Error deleting transaction:', error)
            alert('削除に失敗しました: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円'
    }

    const changeMonth = (delta: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    }

    const openForAdd = (type: 'income' | 'expense') => {
        setEditingTx(null)
        setDefaultType(type)
        setShowForm(true)
        // Scroll to form
        setTimeout(() => {
            window.scrollTo({ top: 120, behavior: 'smooth' })
        }, 100)
    }

    const openForEdit = (tx: Transaction) => {
        setEditingTx(tx)
        setShowForm(true)
        setTimeout(() => {
            window.scrollTo({ top: 120, behavior: 'smooth' })
        }, 100)
    }

    const monthLabel = currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })

    // 表示用のフィルタリング
    const filteredTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()
    })

    return (
        <div className="p-4 pt-6 min-h-screen bg-background text-foreground pb-24">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">Accounting</h1>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Team Treasury Management</p>
                </div>
            </header>

            <div className="space-y-6">
                {/* 月の選択 UI */}
                <div className="flex items-center justify-between bg-muted/40 p-2 rounded-2xl border border-border/50">
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="font-black text-sm tracking-tight">{monthLabel}</span>
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {loading && transactions.length === 0 ? (
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full rounded-3xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                    </div>
                ) : (
                    <AccountingDashboard
                        balance={stats.balance}
                        incomeTotal={stats.incomeTotal}
                        expenseTotal={stats.expenseTotal}
                        onIncomeClick={() => openForAdd('income')}
                        onExpenseClick={() => openForAdd('expense')}
                    />
                )}

                {showForm && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <TransactionForm
                            onSubmit={handleUpsertTransaction}
                            onDelete={handleDeleteTransaction}
                            onCancel={() => {
                                setShowForm(false)
                                setEditingTx(null)
                            }}
                            loading={loading}
                            titleSuggestions={titleSuggestions}
                            initialData={editingTx}
                            defaultType={defaultType}
                        />
                    </div>
                )}

                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            {monthLabel} の履歴
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {loading && transactions.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <div key={tx.id} className="group flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 border border-border/30 rounded-2xl transition-all">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {tx.date}
                                        </span>
                                        <h3 className="font-bold text-sm leading-none">{tx.title}</h3>
                                        {tx.memo && <p className="text-xs text-muted-foreground italic truncate max-w-[150px]">{tx.memo}</p>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "text-lg font-mono font-black tabular-nums",
                                            tx.type === 'income' ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-indigo-400"
                                            onClick={() => openForEdit(tx)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-muted rounded-3xl flex flex-col items-center gap-3">
                                <Tag className="h-10 w-10 text-muted opacity-20" />
                                <p className="text-sm text-muted-foreground font-bold tracking-tight">
                                    まだ取引記録がありません。
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
