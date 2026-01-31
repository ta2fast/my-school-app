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
        birth_date?: string
        emergency_contact?: string
    }
}

export function EditStudentDrawer({ student }: EditStudentDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('students')
                .update(data)
                .eq('id', student.id)

            if (error) throw error

            setOpen(false)
            window.location.reload()
        } catch (error: any) {
            console.error('Error updating student:', error)
            alert(`修正に失敗しました。\nエラー内容: ${error.message || '不明なエラー'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Edit className="h-4 w-4" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm overflow-y-auto max-h-[calc(80vh-2rem)] px-4">
                    <DrawerHeader className="px-0 text-left">
                        <DrawerTitle>生徒情報の修正</DrawerTitle>
                        <DrawerDescription>{student.name} さんの情報を修正します。</DrawerDescription>
                    </DrawerHeader>
                    <StudentForm
                        initialData={student}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                        loading={loading}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
