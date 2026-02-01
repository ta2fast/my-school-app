'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StudentFormProps {
    initialData?: {
        name: string
        furigana: string
        monthly_fee: number
        address?: string
        gender?: string
        birth_date?: string
        emergency_contact?: string
        emergency_relationship?: string
    }
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export function StudentForm({ initialData, onSubmit, onCancel, loading }: StudentFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [furigana, setFurigana] = useState(initialData?.furigana || '')
    const [address, setAddress] = useState(initialData?.address || '')
    const [gender, setGender] = useState(initialData?.gender || '')

    // 日付の正規化 (01 -> 1)
    const parsePart = (val?: string) => val ? String(Number(val)) : ''
    const dateParts = initialData?.birth_date?.split('-') || []

    const [birthYear, setBirthYear] = useState(parsePart(dateParts[0]))
    const [birthMonth, setBirthMonth] = useState(parsePart(dateParts[1]))
    const [birthDay, setBirthDay] = useState(parsePart(dateParts[2]))

    const [emergencyContact, setEmergencyContact] = useState(initialData?.emergency_contact || '')
    const [emergencyRelationship, setEmergencyRelationship] = useState(initialData?.emergency_relationship || '')

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 101 }, (_, i) => String(currentYear - i))
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1))
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 年月日を合体 (例: 2015-01-01)
        const bDate = birthYear && birthMonth && birthDay
            ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
            : initialData?.birth_date || null

        await onSubmit({
            name,
            furigana,
            gender: gender || null,
            monthly_fee: 0,
            address: address || null,
            birth_date: bDate,
            emergency_contact: emergencyContact || null,
            emergency_relationship: emergencyRelationship || null
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                    id="name"
                    placeholder="山田 太郎"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="furigana">フリガナ</Label>
                <Input
                    id="furigana"
                    placeholder="ヤマダ タロウ"
                    value={furigana}
                    onChange={(e) => setFurigana(e.target.value)}
                    required
                    className="h-12"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                    id="address"
                    placeholder="〇〇県〇〇市..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12"
                />
            </div>

            <div className="space-y-2">
                <Label>性別</Label>
                <div className="flex gap-2">
                    {[
                        { label: '男性', value: 'male' },
                        { label: '女性', value: 'female' },
                        { label: '未設定', value: '' }
                    ].map((item) => (
                        <Button
                            key={item.label}
                            type="button"
                            variant={gender === item.value ? 'default' : 'outline'}
                            className="flex-1 h-12"
                            onClick={() => setGender(item.value)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <span className="text-sm font-medium">生年月日</span>
                <div className="flex gap-2">
                    <div className="flex-[2]">
                        <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">年</option>
                            {years.map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">月</option>
                            {months.map(m => <option key={m} value={m}>{m}月</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <select
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">日</option>
                            {days.map(d => <option key={d} value={d}>{d}日</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <span className="text-sm font-medium">緊急連絡先 (電話番号)</span>
                <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="09000000000"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="h-12"
                    autoComplete="off"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="relationship">緊急連絡先 (続柄)</Label>
                <div className="grid grid-cols-3 gap-2">
                    {['母', '父', '本人', '祖母', '祖父'].map((rel) => (
                        <Button
                            key={rel}
                            type="button"
                            variant={emergencyRelationship === rel ? 'default' : 'outline'}
                            className="h-10 text-xs"
                            onClick={() => setEmergencyRelationship(rel)}
                        >
                            {rel}
                        </Button>
                    ))}
                    <Input
                        placeholder="その他"
                        value={['母', '父', '本人', '祖母', '祖父'].includes(emergencyRelationship) ? '' : emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        className="h-10 text-xs"
                    />
                </div>
            </div>
            <div className="flex gap-3 pt-4 pb-8">
                <Button type="submit" className="flex-1 h-12 text-lg font-bold" disabled={loading}>
                    {loading ? '保存中...' : '登録する'}
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-12 text-lg" onClick={onCancel}>
                    キャンセル
                </Button>
            </div>
        </form>
    )
}
