'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AccountingDashboard } from '@/components/AccountingDashboard'
import { TransactionForm } from '@/components/TransactionForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Receipt, Calendar, Tag } from 'lucide-react'
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
    const [stats, setStats] = useState({ balance: 0, incomeTotal: 0, expenseTotal: 0 })

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

            // Calculate stats
            const balance = txs.reduce((acc, curr) =>
                curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)

            // This month's stats
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

            const thisMonthTxs = txs.filter(t => t.date >= startOfMonth)
            const incomeTotal = thisMonthTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
            const expenseTotal = thisMonthTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)

            setStats({ balance, incomeTotal, expenseTotal })
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleAddTransaction = async (data: any) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('transactions')
                .insert([data])

            if (error) throw error
            setShowForm(false)
            fetchTransactions()
        } catch (error: any) {
            console.error('Error adding transaction:', error)
            alert('保存に失敗しました: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円'
    }

    return (
        <div className="p-4 pt-6 min-h-screen bg-background text-foreground pb-24">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">Accounting</h1>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Team Treasury Management</p>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-12 w-12 p-0 shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                )}
            </header>

            <div className="space-y-6">
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
                    />
                )}

                {showForm && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <TransactionForm
                            onSubmit={handleAddTransaction}
                            onCancel={() => setShowForm(false)}
                            loading={loading}
                        />
                    </div>
                )}

                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Transaction History
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {loading && transactions.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} className="group flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/80 border border-border/50 rounded-2xl transition-all active:scale-[0.98]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                tx.type === 'income' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                                            )}>
                                                {tx.category}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {tx.date}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-sm leading-none">{tx.title}</h3>
                                        {tx.memo && <p className="text-xs text-muted-foreground italic truncate max-w-[150px]">{tx.memo}</p>}
                                    </div>
                                    <div className={cn(
                                        "text-lg font-mono font-black tabular-nums",
                                        tx.type === 'income' ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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
