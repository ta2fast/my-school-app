'use client'

import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

import { StudentForm } from './StudentForm'

interface AddStudentDrawerProps {
    variant?: 'default' | 'settings'
}

export function AddStudentDrawer({ variant = 'default' }: AddStudentDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setLoading(true)

        try {
            const { error } = await supabase
                .from('students')
                .insert([data])

            if (error) throw error

            setOpen(false)
            window.location.reload()
        } catch (error: any) {
            console.error('Error adding student:', error)
            alert(`生徒の追加に失敗しました。\nエラー内容: ${error.message || '不明なエラー'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {variant === 'settings' ? (
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                        追加
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button size="icon" className="rounded-full w-12 h-12 shadow-lg fixed top-4 right-4 z-40">
                        <Plus className="w-6 h-6" />
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm overflow-y-auto max-h-[calc(80vh-2rem)] px-4">
                    <DrawerHeader className="px-0">
                        <DrawerTitle>新規生徒追加</DrawerTitle>
                        <DrawerDescription>新しい生徒の情報を入力してください。</DrawerDescription>
                    </DrawerHeader>
                    <StudentForm
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                        loading={loading}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

