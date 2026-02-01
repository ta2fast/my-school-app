import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditStudentDrawer } from './EditStudentDrawer'
import { cn } from '@/lib/utils'

interface StudentCardProps {
    student: {
        id: string;
        name: string;
        furigana: string;
        monthly_fee: number;
        address?: string;
        gender?: string;
        birth_date?: string;
        emergency_contact?: string;
        emergency_relationship?: string;
    }
}

import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function StudentCard({ student }: StudentCardProps) {
    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return null;

        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(student.birth_date);

    const handleDelete = async () => {
        if (!confirm(`${student.name} さんの情報を削除してもよろしいですか？`)) return

        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', student.id)

            if (error) throw error
            window.location.reload()
        } catch (error: any) {
            console.error('Error deleting student:', error)
            alert(`削除に失敗しました。\nエラー内容: ${error.message || '不明なエラー'}`)
        }
    }

    return (
        <Card className={cn(
            "mb-2 overflow-hidden border shadow-sm hover:shadow-md transition-shadow rounded-xl",
            student.gender === 'male' ? 'bg-blue-500/5 border-blue-200/50' :
                student.gender === 'female' ? 'bg-pink-500/5 border-pink-200/50' :
                    'bg-background border-border'
        )}>
            <CardContent className="py-2 px-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div>
                            <p className="text-[10px] text-muted-foreground">{student.furigana}</p>
                            <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            {student.birth_date && (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-12 shrink-0">生年月日</span>
                                    <span className="text-foreground font-medium">
                                        {student.birth_date}
                                        {age !== null && <span className="ml-2 text-primary">({age}歳)</span>}
                                    </span>
                                </div>
                            )}
                            {student.emergency_contact && (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-12 shrink-0">緊急連絡</span>
                                    <span className="text-foreground font-medium">
                                        {student.emergency_contact}
                                        {student.emergency_relationship && ` (${student.emergency_relationship})`}
                                    </span>
                                </div>
                            )}
                            {student.address && (
                                <div className="flex items-start gap-2 col-span-full">
                                    <span className="text-muted-foreground w-12 shrink-0">住所</span>
                                    <span className="text-foreground font-medium line-clamp-1">{student.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                            <EditStudentDrawer student={student} />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete()
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
