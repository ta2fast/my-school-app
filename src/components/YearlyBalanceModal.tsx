'use client'

import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Transaction {
    id: string
    date: string
    type: 'income' | 'expense'
    category: string
    amount: number
    title: string
}

interface YearlyBalanceModalProps {
    isOpen: boolean
    onClose: () => void
    transactions: Transaction[]
}

export function YearlyBalanceModal({ isOpen, onClose, transactions }: YearlyBalanceModalProps) {
    const [viewYear, setViewYear] = useState(new Date().getFullYear())

    const yearlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i + 1)
        let cumulativeBalance = 0

        // 一年前までの全取引を集計して、年初の繰越金を計算
        const previousTransactions = transactions.filter(t => {
            const d = new Date(t.date)
            return d.getFullYear() < viewYear
        })
        cumulativeBalance = previousTransactions.reduce((acc, curr) =>
            curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)

        const startOfYearBalance = cumulativeBalance

        const data = months.map(month => {
            const yearStr = String(viewYear)
            const monthStr = String(month).padStart(2, '0')
            const prefix = `${yearStr}-${monthStr}`

            const currentMonthTxs = transactions.filter(t => t.date.startsWith(prefix))

            const income = currentMonthTxs
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + curr.amount, 0)

            const expense = currentMonthTxs
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + curr.amount, 0)

            const balance = income - expense
            cumulativeBalance += balance

            return {
                month,
                income,
                expense,
                balance,
                cumulative: cumulativeBalance
            }
        })

        return {
            months: data,
            startOfYearBalance,
            annualProfit: cumulativeBalance - startOfYearBalance
        }
    }, [viewYear, transactions])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <header className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white uppercase italic flex items-center gap-2">
                            Annual Ledger <span className="text-indigo-500">{viewYear}</span>
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Yearly Balance Statement</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-800 text-zinc-400">
                        <X className="h-5 w-5" />
                    </Button>
                </header>

                {/* Year Selector */}
                <div className="px-6 py-4 flex items-center justify-between bg-zinc-800/30">
                    <Button variant="ghost" size="icon" onClick={() => setViewYear(v => v - 1)} className="text-zinc-400">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="font-mono font-black text-xl text-white">{viewYear}年</span>
                    <Button variant="ghost" size="icon" onClick={() => setViewYear(v => v + 1)} className="text-zinc-400">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-3">
                                <th className="px-3 pb-2 text-center">月</th>
                                <th className="px-3 pb-2">収入</th>
                                <th className="px-3 pb-2">支出</th>
                                <th className="px-3 pb-2 text-right">累計</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yearlyData.months.map((data) => (
                                <tr key={data.month} className="group bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors">
                                    <td className="py-3 px-3 rounded-l-2xl text-center border-l border-t border-b border-zinc-800/50">
                                        <span className="font-mono font-black text-zinc-400">{data.month}月</span>
                                    </td>
                                    <td className="py-3 px-3 border-t border-b border-zinc-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-bold text-emerald-500">+{formatCurrency(data.income)}</span>
                                            <span className="text-[9px] text-zinc-600 font-mono">INCOME</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 border-t border-b border-zinc-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-bold text-rose-500">-{formatCurrency(data.expense)}</span>
                                            <span className="text-[9px] text-zinc-600 font-mono">EXPENSE</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 rounded-r-2xl text-right border-r border-t border-b border-zinc-800/50">
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-sm font-mono font-black tabular-nums",
                                                data.cumulative >= 0 ? "text-white" : "text-rose-400"
                                            )}>
                                                {formatCurrency(data.cumulative)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {data.balance > 0 ? (
                                                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                                                ) : data.balance < 0 ? (
                                                    <TrendingDown className="h-2.5 w-2.5 text-rose-500" />
                                                ) : (
                                                    <Minus className="h-2.5 w-2.5 text-zinc-600" />
                                                )}
                                                <span className={cn(
                                                    "text-[9px] font-mono font-bold",
                                                    data.balance >= 0 ? "text-zinc-500" : "text-rose-500"
                                                )}>
                                                    {data.balance >= 0 ? '+' : ''}{formatCurrency(data.balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Summary */}
                <footer className="p-6 bg-zinc-950/50 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Year-End Balance</p>
                            <h3 className="text-2xl font-black text-white font-mono tracking-tighter">
                                {formatCurrency(yearlyData.months[11].cumulative)}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Annual Profit/Loss</p>
                            <p className={cn(
                                "text-lg font-black font-mono",
                                yearlyData.annualProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {yearlyData.annualProfit >= 0 ? '+' : ''}
                                {formatCurrency(yearlyData.annualProfit)}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
