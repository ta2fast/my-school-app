'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Ticket,
    Plus,
    Calculator,
    AlertCircle,
    Calendar as CalendarIcon,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Save,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer'
import { DatePicker } from '@/components/ui/DatePicker'

interface Event {
    id: string
    date: string
    name: string
    trial_participants: number
    trial_fee: number
    contest_entries: number
    contest_fee: number
    actual_revenue: number
    remarks: string
    transaction_id?: string
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [saving, setSaving] = useState(false)

    // Form states
    const [formData, setFormData] = useState<Partial<Event>>({
        date: new Date().toISOString().split('T')[0],
        name: '',
        trial_participants: 0,
        trial_fee: 2000,
        contest_entries: 0,
        contest_fee: 1000,
        actual_revenue: 0,
        remarks: ''
    })

    const fetchEvents = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error
            setEvents(data || [])
        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const calculatedRevenue = useMemo(() => {
        return (formData.trial_participants || 0) * (formData.trial_fee || 0) +
            (formData.contest_entries || 0) * (formData.contest_fee || 0)
    }, [formData])

    const handleOpenForm = (event?: Event) => {
        if (event) {
            setEditingEvent(event)
            setFormData(event)
        } else {
            setEditingEvent(null)
            setFormData({
                date: new Date().toISOString().split('T')[0],
                name: '',
                trial_participants: 0,
                trial_fee: 2000,
                contest_entries: 0,
                contest_fee: 1000,
                actual_revenue: 0,
                remarks: ''
            })
        }
        setIsFormOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.date) {
            alert('イベント名と日付を入力してください。')
            return
        }

        setSaving(true)
        try {
            // 1. Transaction upsert
            let transactionId = formData.transaction_id

            const txData = {
                date: formData.date,
                type: 'income',
                category: 'イベント',
                amount: formData.actual_revenue || 0,
                title: `${formData.name} 収支`,
                memo: `参加体験: ${formData.trial_participants}人, エントリー: ${formData.contest_entries}人`
            }

            if (transactionId) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .update(txData)
                    .eq('id', transactionId)
                if (txError) throw txError
            } else {
                const { data: newTx, error: txError } = await supabase
                    .from('transactions')
                    .insert(txData)
                    .select()
                    .single()
                if (txError) throw txError
                transactionId = newTx.id
            }

            // 2. Event upsert
            const eventToSave = {
                ...formData,
                transaction_id: transactionId
            }

            const { error: eventError } = await supabase
                .from('events')
                .upsert(eventToSave)

            if (eventError) throw eventError

            alert('保存しました。会計ページにも自動で反映されています。')
            setIsFormOpen(false)
            fetchEvents()
        } catch (error: any) {
            console.error('Error saving event:', error)
            alert('保存に失敗しました: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (event: Event) => {
        if (!confirm('このイベントを削除しますか？\n（会計ページの記録も削除されます）')) return

        setLoading(true)
        try {
            // Delete transaction first (or let it be deleted by CASCADE if set up, but safer to do manually or if foreign key allows)
            if (event.transaction_id) {
                await supabase.from('transactions').delete().eq('id', event.transaction_id)
            }

            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', event.id)

            if (error) throw error
            fetchEvents()
        } catch (error: any) {
            console.error('Error deleting event:', error)
            alert('削除に失敗しました。')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP').format(amount) + '円'
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24 text-foreground">
            <header className="p-6 pb-2">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">Events</h1>
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase italic">Management & Revenue</p>
                    </div>
                    <Button
                        onClick={() => handleOpenForm()}
                        className="bg-primary text-primary-foreground font-black rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        EVENT
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-4">
                {loading && events.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-3xl" />
                    ))
                ) : events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                        <CalendarIcon className="h-3 w-3" />
                                        {event.date}
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">{event.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-full" onClick={() => handleOpenForm(event)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-full" onClick={() => handleDelete(event)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-2xl p-3">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Participants</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black">{event.trial_participants}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground">体験</span>
                                        <span className="text-lg font-black ml-2">{event.contest_entries}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground">参加</span>
                                    </div>
                                </div>
                                <div className="bg-indigo-500/5 rounded-2xl p-3 border border-indigo-500/10">
                                    <p className="text-[8px] font-black text-indigo-600/70 uppercase tracking-widest mb-1">Calculated</p>
                                    <p className="text-lg font-mono font-black text-indigo-600">
                                        {formatCurrency((event.trial_participants * event.trial_fee) + (event.contest_entries * event.contest_fee))}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase italic">Actual:</span>
                                    <span className="text-lg font-mono font-black text-emerald-500">{formatCurrency(event.actual_revenue)}</span>
                                </div>
                                {event.actual_revenue !== ((event.trial_participants * event.trial_fee) + (event.contest_entries * event.contest_fee)) && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                        <AlertCircle className="h-3 w-3 text-amber-600" />
                                        <span className="text-[9px] font-black text-amber-600 uppercase">Difference</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 bg-muted rounded-full">
                            <Ticket className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">
                            イベントの記録がありません。<br />
                            右上のボタンから追加してください。
                        </p>
                    </div>
                )}
            </main>

            {/* Event Form Drawer */}
            <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DrawerContent className="max-h-[85vh]">
                    <div className="mx-auto w-full max-w-sm p-6 overflow-y-auto">
                        <DrawerHeader className="px-0">
                            <DrawerTitle className="text-left">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1 block italic">{editingEvent ? 'Edit Event' : 'New Event'}</span>
                                <span className="text-2xl font-black italic tracking-tighter uppercase">{editingEvent ? 'イベント編集' : 'イベント作成'}</span>
                            </DrawerTitle>
                        </DrawerHeader>

                        <div className="space-y-6 mt-4">
                            {/* Basic Info */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Event Date</label>
                                    <DatePicker
                                        value={formData.date || ''}
                                        onChange={(val) => setFormData({ ...formData, date: val })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Event Name</label>
                                    <input
                                        type="text"
                                        placeholder="例: 夏休み体験会"
                                        className="w-full bg-muted/50 border border-border/50 rounded-2xl h-12 px-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Calculation Section */}
                            <div className="bg-muted/30 rounded-3xl p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Revenue Calculator</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-muted-foreground ml-1">体験会人数</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border/50 rounded-xl h-10 px-3 font-mono font-bold text-sm"
                                            value={formData.trial_participants}
                                            onChange={(e) => setFormData({ ...formData, trial_participants: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-muted-foreground ml-1">体験料 (単価)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border/50 rounded-xl h-10 px-3 font-mono font-bold text-sm"
                                            value={formData.trial_fee}
                                            onChange={(e) => setFormData({ ...formData, trial_fee: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-muted-foreground ml-1">コンテスト参加数</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border/50 rounded-xl h-10 px-3 font-mono font-bold text-sm"
                                            value={formData.contest_entries}
                                            onChange={(e) => setFormData({ ...formData, contest_entries: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-muted-foreground ml-1">参加費 (単価)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border/50 rounded-xl h-10 px-3 font-mono font-bold text-sm"
                                            value={formData.contest_fee}
                                            onChange={(e) => setFormData({ ...formData, contest_fee: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border/30 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase">Calculated Revenue</span>
                                    <span className="text-xl font-mono font-black text-indigo-600">{formatCurrency(calculatedRevenue)}</span>
                                </div>
                            </div>

                            {/* Final Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Actual Revenue (実際の収支)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="20000"
                                        className="w-full bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl h-16 px-4 font-mono font-black text-2xl text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none pr-12"
                                        value={formData.actual_revenue}
                                        onChange={(e) => setFormData({ ...formData, actual_revenue: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <button
                                            className="p-1.5 bg-indigo-500 text-white rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                                            onClick={() => setFormData({ ...formData, actual_revenue: calculatedRevenue })}
                                            title="計算値をコピー"
                                        >
                                            <Calculator className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Remarks (備考)</label>
                                <textarea
                                    className="w-full bg-muted/50 border border-border/50 rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    rows={2}
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3 pb-10">
                            <Button
                                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? '保存中...' : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        EVENT SAVE
                                    </>
                                )}
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground font-bold">CANCEL</Button>
                            </DrawerClose>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
