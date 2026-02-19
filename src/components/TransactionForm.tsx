'use client'

import { useState } from 'react'
import { PlusCircle, MinusCircle, Save, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'

const GROUPS = [
    { id: 'event', label: '全員対象(イベント)', color: 'bg-indigo-500' },
    { id: 'school', label: '講師対象(スクール)', color: 'bg-amber-500' },
    { id: 'pool', label: 'チーム蓄積(プール)', color: 'bg-zinc-500' }
]

const CATEGORIES_BY_GROUP: Record<string, string[]> = {
    event: ['イベント出演費'],
    school: ['スクール月謝'],
    pool: [
        'イベント参加費',
        '体験会参加費',
        '会場・施設利用料',
        '備品・消耗品',
        '交通費',
        '講師報酬',
        'スポーツ保険代',
        '用具・備品費',
        '広告宣伝費',
        'チームプール金',
        'チーム備品購入',
        '大会エントリー費',
        '積立・その他'
    ]
}

interface TransactionFormProps {
    onSubmit: (data: any) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    onCancel: () => void
    loading: boolean
    titleSuggestions: string[]
    initialData?: any // For editing
    defaultType?: 'income' | 'expense'
}

export function TransactionForm({ onSubmit, onDelete, onCancel, loading, titleSuggestions, initialData, defaultType }: TransactionFormProps) {
    const [type, setType] = useState<'income' | 'expense'>(initialData?.type || defaultType || 'income')
    const [group, setGroup] = useState<'event' | 'school' | 'pool'>(initialData?.group || 'event')
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])
    const [title, setTitle] = useState(initialData?.title || '')
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
    const [category, setCategory] = useState(initialData?.category || CATEGORIES_BY_GROUP['event'][0])
    const [memo, setMemo] = useState(initialData?.memo || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload: any = {
            date,
            type,
            title,
            amount: parseInt(amount),
            category,
            memo
        }

        if (initialData?.id) {
            payload.id = initialData.id
        }

        await onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 p-6 rounded-3xl border border-border mt-4 shadow-xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-black uppercase tracking-tighter text-indigo-500 flex items-center gap-2">
                    {initialData ? <Edit2 className="h-4 w-4" /> : (type === 'income' ? <PlusCircle className="h-4 w-4 text-emerald-500" /> : <MinusCircle className="h-4 w-4 text-rose-500" />)}
                    {initialData ? '取引を編集' : (type === 'income' ? '収入を記録' : '支出を記録')}
                </h3>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2 p-1 bg-background/50 border border-border rounded-2xl mb-2">
                <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'ghost'}
                    className={`flex-1 gap-2 h-10 rounded-xl transition-all ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20' : ''}`}
                    onClick={() => setType('income')}
                >
                    収入
                </Button>
                <Button
                    type="button"
                    variant={type === 'expense' ? 'destructive' : 'ghost'}
                    className={`flex-1 gap-2 h-10 rounded-xl transition-all ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-900/20' : ''}`}
                    onClick={() => setType('expense')}
                >
                    支出
                </Button>
            </div>

            {/* Group Selector */}
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">対象グループ</Label>
                <div className="grid grid-cols-3 gap-2">
                    {GROUPS.map((g) => (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                                setGroup(g.id as any)
                                setCategory(CATEGORIES_BY_GROUP[g.id][0])
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-2xl border transition-all h-16",
                                group === g.id
                                    ? `bg-foreground text-background border-foreground shadow-md`
                                    : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full mb-1.5", g.color)}></span>
                            <span className="text-[9px] font-black leading-tight text-center">{g.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="t-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">日付</Label>
                    <DatePicker
                        id="t-date"
                        value={date}
                        onChange={setDate}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="t-amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">金額 (円)</Label>
                    <Input
                        id="t-amount"
                        type="number"
                        placeholder="50,000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-12 rounded-2xl font-mono text-lg bg-background/50 border-border/50 focus:bg-background"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">カテゴリ</Label>
                <select
                    id="t-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-background/50 border border-border/50 px-4 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                    {CATEGORIES_BY_GROUP[group].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                {group === 'school' && (
                    <p className="text-[10px] font-bold text-amber-500 ml-1 mt-1">
                        ※スクール月謝は「月謝」ページから自動で登録されます。
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">項目名</Label>
                <Input
                    id="t-title"
                    placeholder="2月分月謝 / 〇〇イベント出演"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-background/50 border-border/50 focus:bg-background"
                    list="title-suggestions"
                />
                <datalist id="title-suggestions">
                    {titleSuggestions.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                    ))}
                </datalist>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-memo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">メモ (任意)</Label>
                <Input
                    id="t-memo"
                    placeholder="詳細など"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="h-12 rounded-2xl bg-background/50 border-border/50 focus:bg-background"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-12 text-lg font-bold bg-foreground text-background" disabled={loading}>
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? '保存中...' : '保存'}
                </Button>

                {initialData && onDelete && (
                    <Button
                        type="button"
                        variant="destructive"
                        className="h-12 px-6 font-bold"
                        onClick={() => onDelete(initialData.id)}
                        disabled={loading}
                    >
                        削除
                    </Button>
                )}

                <Button type="button" variant="outline" className="h-12 w-12" onClick={onCancel}>
                    {!initialData ? <X className="h-5 w-5" /> : '閉じる'}
                </Button>
            </div>
        </form>
    )
}
