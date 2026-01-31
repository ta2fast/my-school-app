'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
} from '@/components/ui/drawer'
import { UserPlus, Trash2, Users } from 'lucide-react'

export function InstructorManagementDrawer() {
    const [open, setOpen] = useState(false)
    const [instructors, setInstructors] = useState<any[]>([])
    const [name, setName] = useState('')
    const [furigana, setFurigana] = useState('')
    const [loading, setLoading] = useState(false)

    const fetchInstructors = async () => {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .order('furigana', { ascending: true })
        if (error) console.error('Error fetching instructors:', error)
        else setInstructors(data || [])
    }

    useEffect(() => {
        if (open) fetchInstructors()
    }, [open])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase
                .from('instructors')
                .insert([{ name, furigana }])
            if (error) throw error
            setName('')
            setFurigana('')
            fetchInstructors()
        } catch (error: any) {
            alert('講師の登録に失敗しました: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} 講師を削除してもよろしいですか？`)) return
        try {
            const { error } = await supabase
                .from('instructors')
                .delete()
                .eq('id', id)
            if (error) throw error
            fetchInstructors()
        } catch (error: any) {
            alert('削除に失敗しました: ' + error.message)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    講師管理
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-md h-[80vh] flex flex-col">
                    <DrawerHeader>
                        <DrawerTitle>講師管理</DrawerTitle>
                        <DrawerDescription>
                            出欠確認を行う講師の登録・削除ができます。
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto px-4 space-y-6">
                        {/* Add Form */}
                        <form onSubmit={handleAdd} className="space-y-4 bg-gray-50 p-4 rounded-xl border">
                            <div className="space-y-2">
                                <Label htmlFor="ins-name">講師名</Label>
                                <Input
                                    id="ins-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="山田 太郎"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ins-furigana">ふりがな</Label>
                                <Input
                                    id="ins-furigana"
                                    value={furigana}
                                    onChange={(e) => setFurigana(e.target.value)}
                                    placeholder="やまだ たろう"
                                />
                            </div>
                            <Button type="submit" className="w-full gap-2" disabled={loading}>
                                <UserPlus className="h-4 w-4" />
                                {loading ? '追加中...' : '講師を追加'}
                            </Button>
                        </form>

                        {/* List */}
                        <div className="space-y-2 pb-10">
                            <h3 className="text-sm font-bold text-gray-500 px-1">講師一覧</h3>
                            {instructors.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm italic">登録されている講師はいません</p>
                            ) : (
                                instructors.map((ins) => (
                                    <div key={ins.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground leading-none">{ins.furigana}</p>
                                            <p className="font-bold">{ins.name}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-600 h-8 w-8"
                                            onClick={() => handleDelete(ins.id, ins.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <DrawerFooter className="border-t bg-white">
                        <Button variant="outline" onClick={() => setOpen(false)}>閉じる</Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
