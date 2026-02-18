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
            {/* Main Balanced Card: F.A.S.T. Total Funds */}
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 rounded-[2rem] text-white shadow-2xl border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                    <Wallet className="h-5 w-5 text-indigo-400" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">F.A.S.T. 資金 (合計)</p>
                </div>
                <div className="relative z-10">
                    <h3 className="text-5xl font-black tracking-tighter font-mono tabular-nums leading-none mb-1">
                        {formatCurrency(balance)}
                    </h3>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Available Total Assets</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Wallet className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>
                {/* Subtle Glow Effect */}
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]"></div>
            </div>

            {/* Distribution Row: Smaller Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Event Distribution (Team Color: Indigo) */}
                <div className="relative overflow-hidden bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-3xl text-indigo-50 shadow-lg">
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <ArrowUpCircle className="h-3 w-3" />
                        <p className="text-[9px] font-black uppercase tracking-wider">A. 全員分配</p>
                    </div>
                    <h4 className="text-xl font-black tracking-tighter font-mono tabular-nums">
                        {formatCurrency(eventBalance)}
                    </h4>
                </div>

                {/* School Distribution (Secondary Color: Amber) */}
                <div className="relative overflow-hidden bg-amber-500/20 border border-amber-500/30 p-4 rounded-3xl text-amber-50 shadow-lg">
                    <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <ArrowUpCircle className="h-3 w-3" />
                        <p className="text-[9px] font-black uppercase tracking-wider">B. スクール分配</p>
                    </div>
                    <h4 className="text-xl font-black tracking-tighter font-mono tabular-nums">
                        {formatCurrency(schoolBalance)}
                    </h4>
                </div>
            </div>

            {/* Sub Info Row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 border border-border/50 p-2.5 rounded-2xl flex flex-col items-center justify-center">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-center">C. チーム蓄積</p>
                    <p className="text-sm font-bold font-mono text-zinc-400">{formatCurrency(poolBalance)}</p>
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
        </div>
    )

}
