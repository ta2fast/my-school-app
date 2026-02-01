'use client'

import { NavOrderSettings } from '@/components/NavOrderSettings'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Layout } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ReorderPage() {
    const router = useRouter()

    return (
        <div className="p-4 pb-24">
            <header className="mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mb-2 -ml-2"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Layout className="w-6 h-6" />
                    メニューの並び替え
                </h1>
                <p className="text-sm text-muted-foreground">
                    各項目を上下に入れ替えて、表示順序やスワイプの順番をカスタマイズできます。
                </p>
            </header>

            <div className="bg-card border border-border rounded-xl p-4">
                <NavOrderSettings />
            </div>

            <div className="mt-8">
                <Button
                    className="w-full"
                    onClick={() => router.back()}
                >
                    設定に戻る
                </Button>
            </div>
        </div>
    )
}
