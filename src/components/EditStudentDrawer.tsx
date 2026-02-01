'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { supabase } from '@/lib/supabase'
import { StudentForm } from './StudentForm'

interface EditStudentDrawerProps {
    student: {
        id: string
        name: string
        furigana: string
        monthly_fee: number
        address?: string
        gender?: string
        birth_date?: string
        emergency_contact?: string
        emergency_relationship?: string
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditStudentDrawer({ student, open, onOpenChange, onSuccess }: EditStudentDrawerProps) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        if (!student) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('students')
                .update(data)
                .eq('id', student.id)

            if (error) throw error

            onOpenChange(false)
            if (onSuccess) onSuccess()
            else window.location.reload()
        } catch (error: any) {
            console.error('Error updating student:', error)
            alert(`修正に失敗しました。\nエラー内容: ${error.message || '不明なエラー'}`)
        } finally {
            setLoading(false)
        }
    }

    if (!student) return null

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm px-6 pb-12 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 20px)' }}>
                    <DrawerHeader className="px-0 text-left">
                        <DrawerTitle>生徒情報の修正</DrawerTitle>
                        <DrawerDescription>{student.name} さんの情報を修正します。</DrawerDescription>
                    </DrawerHeader>
                    <StudentForm
                        key={student.id}
                        initialData={student}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        loading={loading}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
