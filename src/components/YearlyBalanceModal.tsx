'use client'

import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
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

    const annualSummary = useMemo(() => {
        // 年初の繰越金を計算
        const previousTransactions = transactions.filter(t => {
            const d = new Date(t.date)
            return d.getFullYear() < viewYear
        })
        const carryoverBalance = previousTransactions.reduce((acc, curr) =>
            curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)

        // 当年の取引
        const currentYearTxs = transactions
            .filter(t => {
                const d = new Date(t.date)
                return d.getFullYear() === viewYear
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const totalIncome = currentYearTxs
            .filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + curr.amount, 0) + carryoverBalance

        const totalExpense = currentYearTxs
            .filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0)

        return {
            carryoverBalance,
            transactions: currentYearTxs,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        }
    }, [viewYear, transactions])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount)
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return `${d.getMonth() + 1}月${d.getDate()}日`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white text-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-zinc-200">
                {/* Header */}
                <header className="p-4 border-b-2 border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                            年間総まとめ <span className="text-indigo-600">{viewYear}</span>
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Annual Financial Ledger</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-200 text-zinc-500">
                        <X className="h-5 w-5" />
                    </Button>
                </header>

                {/* Year Selector */}
                <div className="px-6 py-2 flex items-center justify-between border-b border-zinc-100 bg-white">
                    <Button variant="ghost" size="icon" onClick={() => setViewYear(v => v - 1)} className="text-zinc-400 h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg text-zinc-800">{viewYear}年</span>
                    <Button variant="ghost" size="icon" onClick={() => setViewYear(v => v + 1)} className="text-zinc-400 h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Scrollable Table Area */}
                <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-white">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="sticky top-0 bg-zinc-50 z-10 shadow-sm">
                            <tr className="border-b border-zinc-200">
                                <th className="py-2 px-4 font-bold text-zinc-500 w-24">日付</th>
                                <th className="py-2 px-4 font-bold text-zinc-500 w-28 text-right">収入</th>
                                <th className="py-2 px-4 font-bold text-rose-500 w-28 text-right">支出</th>
                                <th className="py-2 px-4 font-bold text-zinc-500">備考</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {/* Carryover Row */}
                            <tr className="bg-zinc-50/50">
                                <td className="py-3 px-4 font-medium text-zinc-400"></td>
                                <td className="py-3 px-4 text-right font-bold text-zinc-800">
                                    {formatCurrency(annualSummary.carryoverBalance)}
                                </td>
                                <td className="py-3 px-4 text-right"></td>
                                <td className="py-3 px-4 font-bold text-zinc-800">
                                    {viewYear}年 繰越
                                </td>
                            </tr>

                            {/* Transactions */}
                            {annualSummary.transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="py-2.5 px-4 tabular-nums text-zinc-500 font-medium">
                                        {formatDate(tx.date)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-medium text-zinc-800">
                                        {tx.type === 'income' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-rose-500">
                                        {tx.type === 'expense' ? formatCurrency(tx.amount) : ''}
                                    </td>
                                    <td className="py-2.5 px-4 text-zinc-700 font-medium max-w-xs truncate">
                                        {tx.title}
                                    </td>
                                </tr>
                            ))}

                            {/* Empty state */}
                            {annualSummary.transactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-zinc-400 font-bold italic">
                                        No data found for this year.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Totals */}
                <footer className="p-4 bg-zinc-50 border-t-2 border-zinc-200">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="font-black text-lg">
                                <td className="w-24 px-4"></td>
                                <td className="w-28 px-4 text-right tabular-nums text-zinc-800">
                                    {formatCurrency(annualSummary.totalIncome)}
                                </td>
                                <td className="w-28 px-4 text-right tabular-nums text-rose-500">
                                    {formatCurrency(annualSummary.totalExpense)}
                                </td>
                                <td className="px-4 text-right text-indigo-600">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">合計残高</span>
                                        {formatCurrency(annualSummary.balance)}円
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </footer>
            </div>
        </div>
    )
}
