'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentCard } from '@/components/StudentCard'
import { AddStudentDrawer } from '@/components/AddStudentDrawer'
import { Skeleton } from '@/components/ui/skeleton'

interface StudentCardProps {
  student: {
    name: string;
    furigana: string;
    monthly_fee: number;
    address?: string;
    birth_date?: string;
    emergency_contact?: string;
  }
}

interface Student {
  id: string
  name: string
  furigana: string
  monthly_fee: number
  address?: string
  birth_date?: string
  emergency_contact?: string
  emergency_relationship?: string
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="p-4 pt-16">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">名簿一覧</h1>
        <p className="text-sm text-muted-foreground">{students.length} 名の生徒</p>
      </header>

      <AddStudentDrawer />

      <div className="space-y-1 pb-20">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full mb-3 rounded-xl" />
          ))
        ) : students.length > 0 ? (
          students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            生徒が登録されていません。<br />
            右上の＋ボタンから追加してください。
          </div>
        )}
      </div>
    </div>
  )
}
