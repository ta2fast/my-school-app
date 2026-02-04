'use client'

import { ThemeToggle } from '@/components/ThemeToggle'
import { AddStudentDrawer } from '@/components/AddStudentDrawer'
import { InstructorManagementDrawer } from '@/components/InstructorManagementDrawer'
import { NavOrderSettings } from '@/components/NavOrderSettings'
import { Settings, UserPlus, Users, Moon, Layout, ChevronRight, Wallet, Save } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
    return (
        <div className="p-4 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    設定
                </h1>
                <p className="text-sm text-muted-foreground">アプリの各種設定を行います</p>
            </header>

            <div className="space-y-4">
                {/* 生徒管理 */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">生徒追加</h3>
                                <p className="text-xs text-muted-foreground">新しい生徒を名簿に追加します</p>
                            </div>
                        </div>
                        <AddStudentDrawer variant="settings" />
                    </div>
                </div>

                {/* 講師管理 */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">講師管理</h3>
                                <p className="text-xs text-muted-foreground">講師の追加・編集・削除を行います</p>
                            </div>
                        </div>
                        <InstructorManagementDrawer variant="settings" />
                    </div>
                </div>

                {/* ナビゲーション順序 */}
                <Link href="/settings/reorder" className="block outline-none group">
                    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between transition-colors group-hover:bg-accent/50 group-active:bg-accent">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Layout className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">メニューの並び順</h3>
                                <p className="text-xs text-muted-foreground">表示順序をカスタマイズします</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>

                {/* テーマ設定 */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                                <Moon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">表示モード</h3>
                                <p className="text-xs text-muted-foreground">ダークモード / ライトモードの切り替え</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                {/* 月謝設定 */}
                <TuitionSettings />
            </div>

            <div className="mt-12 text-center pb-8">
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                    Version 0.1.2
                </p>
            </div>
        </div>
    )
}

function TuitionSettings() {
    const [dailyRate, setDailyRate] = useState('2000')
    const [bikeFee, setBikeFee] = useState('5000')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')

                if (error) throw error

                if (data) {
                    const dr = data.find(s => s.key === 'default_daily_rate')
                    const bf = data.find(s => s.key === 'bike_rental_fee')
                    if (dr) setDailyRate(dr.value)
                    if (bf) setBikeFee(bf.value)
                }
            } catch (error) {
                console.error('Error fetching settings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('settings')
                .upsert([
                    { key: 'default_daily_rate', value: dailyRate },
                    { key: 'bike_rental_fee', value: bikeFee }
                ])

            if (error) throw error
            alert('設定を保存しました')
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('保存に失敗しました')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null

    return (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">月謝設定</h3>
                    <p className="text-xs text-muted-foreground">標準的な料金の設定を行います</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="default_daily_rate">標準日額 (円)</Label>
                    <Input
                        id="default_daily_rate"
                        type="number"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bike_rental_fee">バイク月額 (円)</Label>
                    <Input
                        id="bike_rental_fee"
                        type="number"
                        value={bikeFee}
                        onChange={(e) => setBikeFee(e.target.value)}
                        className="h-10"
                    />
                </div>
            </div>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-10 gap-2 font-bold"
            >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '設定を保存する'}
            </Button>
        </div>
    )
}
