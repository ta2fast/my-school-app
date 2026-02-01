'use client'

import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface AccountingDashboardProps {
    balance: number
    incomeTotal: number
    expenseTotal: number
    onIncomeClick?: () => void
    onExpenseClick?: () => void
}

export function AccountingDashboard({ balance, incomeTotal, expenseTotal, onIncomeClick, onExpenseClick }: AccountingDashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', currencyDisplay: 'name' })
            .format(amount)
            .replace('日本円', '円');
    };

    return (
        <div className="grid grid-cols-1 gap-3">
            {/* Balance Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                <Wallet className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
                <p className="text-sm font-medium opacity-80 mb-1">現在の残高</p>
                <h3 className="text-4xl font-black tracking-tight font-mono">
                    {formatCurrency(balance)}
                </h3>
            </div>

            {/* Income & Expense Tiny Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
                <button
                    onClick={onIncomeClick}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                >
                    <ArrowDownCircle className="h-5 w-5 text-emerald-500 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-emerald-500/70">今月の収入</p>
                    <p className="text-lg font-bold text-emerald-400">+{formatCurrency(incomeTotal)}</p>
                </button>
                <button
                    onClick={onExpenseClick}
                    className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer"
                >
                    <ArrowUpCircle className="h-5 w-5 text-rose-500 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-rose-500/70">今月の支出</p>
                    <p className="text-lg font-bold text-rose-400">-{formatCurrency(expenseTotal)}</p>
                </button>
            </div>
        </div>
    )
}
