'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentCard } from '@/components/StudentCard'
import { EditStudentDrawer } from '@/components/EditStudentDrawer'
import { Skeleton } from '@/components/ui/skeleton'

interface Student {
    id: string
    name: string
    furigana: string
    monthly_fee: number
    address?: string
    gender?: string
    birth_date?: string
    emergency_contact?: string
    emergency_relationship?: string
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    useEffect(() => {
        async function fetchStudents() {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .order('furigana', { ascending: true })

                if (error) throw error
                setStudents(data || [])
            } catch (error) {
                console.error('Error fetching students:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStudents()
    }, [])

    const handleEdit = (student: Student) => {
        setSelectedStudent(student)
        setIsEditOpen(true)
    }

    return (
        <div className="p-4 pt-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">名簿一覧</h1>
                <p className="text-sm text-muted-foreground">{students.length} 名の生徒</p>
            </header>

            <div className="space-y-1 pb-20">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full mb-3 rounded-xl" />
                    ))
                ) : students.length > 0 ? (
                    students.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onEdit={handleEdit}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                        生徒が登録されていません。<br />
                        設定ページから追加してください。
                    </div>
                )}
            </div>

            <EditStudentDrawer
                student={selectedStudent}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
        </div>
    )
}
