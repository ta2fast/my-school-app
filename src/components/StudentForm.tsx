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
    const [birthDate, setBirthDate] = useState(initialData?.birth_date || '')
    const [emergencyContact, setEmergencyContact] = useState(initialData?.emergency_contact || '')
    const [emergencyRelationship, setEmergencyRelationship] = useState(initialData?.emergency_relationship || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            name,
            furigana,
            monthly_fee: 0, // No longer used but kept for schema compatibility
            address: address || null,
            birth_date: birthDate || null,
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
                <Label htmlFor="dob">生年月日</Label>
                <Input
                    id="dob"
                    type="text"
                    inputMode="numeric"
                    placeholder="1990-01-01"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="emergency">緊急連絡先 (電話番号)</Label>
                <Input
                    id="emergency"
                    type="text"
                    inputMode="numeric"
                    placeholder="090-0000-0000"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="h-12"
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
