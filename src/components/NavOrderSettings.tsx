'use client'

import { useNavigation } from './NavigationProvider'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react'

const NAV_LABELS: Record<string, string> = {
    '/students': '名簿',
    '/attendance': '出欠',
    '/accounting': '会計',
    '/settings': '設定'
}

export function NavOrderSettings() {
    const { order, updateOrder } = useNavigation()

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...order]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newOrder.length) return

        const [removed] = newOrder.splice(index, 1)
        newOrder.splice(targetIndex, 0, removed)
        updateOrder(newOrder)
    }

    return (
        <div className="space-y-2">
            {order.map((path, index) => (
                <div key={path} className="flex items-center gap-3 p-3 bg-background border rounded-lg shadow-sm">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium">{NAV_LABELS[path]}</span>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === 0}
                            onClick={() => moveItem(index, 'up')}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === order.length - 1}
                            onClick={() => moveItem(index, 'down')}
                        >
                            <ArrowDown className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
