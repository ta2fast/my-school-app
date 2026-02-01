'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/NavigationProvider'

export default function Redirector() {
  const { order } = useNavigation()
  const router = useRouter()

  useEffect(() => {
    if (order && order.length > 0) {
      router.replace(order[0])
    }
  }, [order, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

