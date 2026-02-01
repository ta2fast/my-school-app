'use client'

import { useState } from 'react'
import { PlusCircle, MinusCircle, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const INCOME_CATEGORIES = ['イベントギャラ', 'スクール月謝', '物販', 'その他']
const EXPENSE_CATEGORIES = ['会場代', '備品購入', '広告費', '交通費', 'その他']

interface TransactionFormProps {
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export function TransactionForm({ onSubmit, onCancel, loading }: TransactionFormProps) {
    const [type, setType] = useState<'income' | 'expense'>('income')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState(INCOME_CATEGORIES[0])
    const [memo, setMemo] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            date,
            type,
            title,
            amount: parseInt(amount),
            category,
            memo
        })
        // Reset form on success
        setTitle('')
        setAmount('')
        setMemo('')
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 p-6 rounded-2xl border border-border mt-4">
            <div className="flex gap-2 p-1 bg-background border border-border rounded-xl mb-4">
                <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'ghost'}
                    className={`flex-1 gap-2 h-10 rounded-lg ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => {
                        setType('income')
                        setCategory(INCOME_CATEGORIES[0])
                    }}
                >
                    <PlusCircle className="h-4 w-4" />
                    収入
                </Button>
                <Button
                    type="button"
                    variant={type === 'expense' ? 'destructive' : 'ghost'}
                    className={`flex-1 gap-2 h-10 rounded-lg ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                    onClick={() => {
                        setType('expense')
                        setCategory(EXPENSE_CATEGORIES[0])
                    }}
                >
                    <MinusCircle className="h-4 w-4" />
                    支出
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="t-date">日付</Label>
                    <Input
                        id="t-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="t-amount">金額 (円)</Label>
                    <Input
                        id="t-amount"
                        type="number"
                        placeholder="50,000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="h-11 font-mono"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-title">項目名</Label>
                <Input
                    id="t-title"
                    placeholder="2月分月謝 / 〇〇イベント出演"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-category">カテゴリ</Label>
                <select
                    id="t-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="t-memo">メモ (任意)</Label>
                <Input
                    id="t-memo"
                    placeholder="詳細など"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="h-11"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-12 text-lg font-bold bg-foreground text-background" disabled={loading}>
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? '保存中...' : '記録を保存'}
                </Button>
                <Button type="button" variant="outline" className="h-12 w-12" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
        </form>
    )
}
