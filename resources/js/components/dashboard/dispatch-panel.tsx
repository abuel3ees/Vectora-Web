import { useEffect, useRef, useState } from 'react'
import type { FleetRow } from './fleet-status'

type MessageItem = {
    id: number
    content: string
    type: string
    is_read: boolean
    dispatcher_name: string
    created_at: string
}

type Props = {
    fleet: FleetRow[]
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
    instruction: {
        label: 'Instruction',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
    },
    alert: {
        label: 'Alert',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
    },
    note: {
        label: 'Note',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
    },
}

function getCsrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? ''
}

function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DispatchPanel({ fleet }: Props) {
    const assignable = fleet.filter((f) => f.assignment_id !== null)

    const [selectedDriver, setSelectedDriver] = useState<FleetRow | null>(assignable[0] ?? null)
    const [messageType, setMessageType] = useState<'instruction' | 'alert' | 'note'>('instruction')
    const [content, setContent] = useState('')
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const [messages, setMessages] = useState<MessageItem[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const historyRef = useRef<HTMLDivElement>(null)

    async function loadMessages(assignmentId: number) {
        setLoadingMessages(true)
        try {
            const res = await fetch(`/assignments/${assignmentId}/messages`, {
                headers: { Accept: 'application/json' },
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages ?? [])
            }
        } finally {
            setLoadingMessages(false)
        }
    }

    useEffect(() => {
        if (selectedDriver?.assignment_id) {
            loadMessages(selectedDriver.assignment_id)
        } else {
            setMessages([])
        }
    }, [selectedDriver])

    async function handleSend() {
        if (!selectedDriver?.assignment_id || !content.trim()) return
        setSending(true)
        setSendError(null)
        try {
            const res = await fetch(`/assignments/${selectedDriver.assignment_id}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ content: content.trim(), type: messageType }),
            })
            const data = await res.json()
            if (!res.ok) {
                setSendError(data.message ?? 'Failed to send.')
                return
            }
            setContent('')
            await loadMessages(selectedDriver.assignment_id)
            setTimeout(() => {
                historyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }, 50)
        } catch {
            setSendError('Network error — could not send.')
        } finally {
            setSending(false)
        }
    }

    if (assignable.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm italic font-serif text-muted-foreground">
                No active drivers to message right now.
            </div>
        )
    }

    return (
        <div className="grid lg:grid-cols-5 gap-px bg-border/60">
            {/* Driver list */}
            <div className="lg:col-span-2 bg-background divide-y divide-border/60 overflow-y-auto max-h-[560px]">
                {assignable.map((driver) => {
                    const selected = driver.id === selectedDriver?.id
                    return (
                        <button
                            key={driver.id}
                            onClick={() => setSelectedDriver(driver)}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                                selected ? 'bg-primary/8' : 'hover:bg-muted/20'
                            }`}
                        >
                            <span className="relative flex size-2 shrink-0">
                                {driver.is_online && (
                                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" />
                                )}
                                <span
                                    className="relative size-2 rounded-full"
                                    style={{
                                        backgroundColor: driver.is_online
                                            ? '#22c55e'
                                            : (driver.color ?? 'var(--muted-foreground)'),
                                    }}
                                />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="font-display text-sm tracking-tight truncate">{driver.name}</div>
                                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mt-0.5">
                                    {driver.vehicle ?? '—'} · {driver.stops ?? '—'} stops
                                </div>
                            </div>
                            {selected && (
                                <span className="text-[9px] uppercase tracking-[0.28em] rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-primary shrink-0">
                                    Active
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Composer + history */}
            <div className="lg:col-span-3 bg-background flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Composing for</div>
                        <div className="font-display text-base tracking-tight mt-0.5">
                            {selectedDriver?.name ?? '—'}
                        </div>
                    </div>
                    {/* Type selector */}
                    <div className="flex gap-1.5">
                        {(['instruction', 'alert', 'note'] as const).map((t) => {
                            const meta = TYPE_META[t]
                            const active = messageType === t
                            return (
                                <button
                                    key={t}
                                    onClick={() => setMessageType(t)}
                                    className={`text-[9px] uppercase tracking-[0.28em] rounded-full border px-2.5 py-1 transition-colors ${
                                        active
                                            ? `${meta.bg} ${meta.border} ${meta.color}`
                                            : 'border-border/60 text-muted-foreground/60 hover:text-muted-foreground'
                                    }`}
                                >
                                    {meta.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Textarea */}
                <div className="px-6 pt-4">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder={`Write ${messageType}…`}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                    {sendError && (
                        <p className="mt-1.5 text-[11px] text-destructive">{sendError}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 mb-4">
                        <span className="text-[10px] text-muted-foreground/50 italic font-serif">
                            ⌘↵ to send
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={sending || !content.trim()}
                            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] rounded-full border border-primary/40 bg-primary/10 text-primary px-4 py-1.5 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {sending ? (
                                <>
                                    <span className="size-2.5 border border-primary/60 border-t-primary rounded-full animate-spin" />
                                    Sending
                                </>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                </div>

                {/* Message history */}
                <div className="border-t border-border/60 flex-1 overflow-y-auto max-h-64" ref={historyRef}>
                    <div className="px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-border/40">
                        History
                    </div>
                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="size-4 border border-border border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <p className="px-6 py-6 text-sm italic font-serif text-muted-foreground">
                            No messages for this assignment yet.
                        </p>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {messages.map((msg) => {
                                const meta = TYPE_META[msg.type] ?? TYPE_META.note
                                return (
                                    <div key={msg.id} className="px-6 py-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span
                                                className={`text-[9px] uppercase tracking-[0.25em] rounded-full border px-2 py-0.5 ${meta.bg} ${meta.border} ${meta.color}`}
                                            >
                                                {msg.type}
                                            </span>
                                            {!msg.is_read && (
                                                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                                            )}
                                            <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums">
                                                {relativeTime(msg.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">{msg.content}</p>
                                        <p className="mt-1 text-[10px] text-muted-foreground/50">
                                            {msg.dispatcher_name}
                                            {msg.is_read && ' · read'}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
