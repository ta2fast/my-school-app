'use client'

import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface AccountingDashboardProps {
    balance: number
    eventBalance: number
    schoolBalance: number
    poolBalance: number
    incomeTotal: number
    expenseTotal: number
    onIncomeClick?: () => void
    onExpenseClick?: () => void
}

export function AccountingDashboard({ balance, eventBalance, schoolBalance, poolBalance, incomeTotal, expenseTotal, onIncomeClick, onExpenseClick }: AccountingDashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円';
    };

    return (
        <div className="space-y-4">
            {/* Top Grid: Two Main Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Event Balance Card (Team Color: Indigo) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Wallet className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">A. 全員分配（イベント）</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black tracking-tighter font-mono tabular-nums">
                            {formatCurrency(eventBalance)}
                        </h3>
                    </div>
                    <Wallet className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
                </div>

                {/* School Balance Card (Secondary Color: Amber) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 p-5 rounded-3xl text-white shadow-xl shadow-amber-500/20">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Wallet className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">B. 講師分配（スクール）</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black tracking-tighter font-mono tabular-nums">
                            {formatCurrency(schoolBalance)}
                        </h3>
                    </div>
                    <Wallet className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
                </div>
            </div>

            {/* Sub Info Row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 border border-border/50 p-2.5 rounded-2xl flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">C. チーム蓄積</p>
                    <p className="text-sm font-bold font-mono">{formatCurrency(poolBalance)}</p>
                </div>
                <button
                    onClick={onIncomeClick}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                >
                    <p className="text-[9px] uppercase font-black text-emerald-500/70 tracking-widest leading-none mb-1">今月の収入</p>
                    <p className="text-sm font-black text-emerald-400">+{formatCurrency(incomeTotal)}</p>
                </button>
                <button
                    onClick={onExpenseClick}
                    className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer"
                >
                    <p className="text-[9px] uppercase font-black text-rose-500/70 tracking-widest leading-none mb-1">今月の支出</p>
                    <p className="text-sm font-black text-rose-400">-{formatCurrency(expenseTotal)}</p>
                </button>
            </div>

            <div className="px-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                    Total Balance: {formatCurrency(balance)}
                </p>
            </div>
        </div>
    )
}
