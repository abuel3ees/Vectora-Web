import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2, Compass, LayoutDashboard, Map, Settings, Users,
    ArrowRight, Truck,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

type Entry = {
    id: string;
    label: string;
    sub?: string;
    href?: string;
    action?: () => void;
    icon: React.ElementType;
    group: string;
};

const NAV_ENTRIES: Entry[] = [
    { id: 'dashboard',   label: 'Overview',    sub: 'The day at a glance',        href: '/dashboard',         icon: LayoutDashboard, group: 'Navigate' },
    { id: 'optimize',    label: 'Optimize',    sub: 'Solve the route problem',    href: '/optimize',          icon: Compass,         group: 'Navigate' },
    { id: 'people',      label: 'People',      sub: 'Manage your roster',         href: '/users',             icon: Users,           group: 'Navigate' },
    { id: 'routes',      label: 'Routes',      sub: 'Review the atlas',           href: '/routes',            icon: Map,             group: 'Navigate' },
    { id: 'fleet',       label: 'Fleet',       sub: 'The drivers, in station',    href: '/fleet',             icon: Truck,           group: 'Navigate' },
    { id: 'analytics',   label: 'Analytics',   sub: 'A quiet accounting',         href: '/analytics',         icon: BarChart2,       group: 'Navigate' },
    { id: 'settings',    label: 'Settings',    sub: 'Profile & preferences',      href: '/settings/profile',  icon: Settings,        group: 'Navigate' },
];

const ACTION_ENTRIES: Entry[] = [
    { id: 'new-user',  label: 'Add a person',   sub: 'Enroll a new member',   href: '/users/create',  icon: Users,   group: 'Actions' },
    { id: 'new-route', label: 'Open a course',  sub: 'Create a new route',    href: '/routes/create', icon: Map,     group: 'Actions' },
];

const ALL_ENTRIES = [...NAV_ENTRIES, ...ACTION_ENTRIES];

function score(entry: Entry, query: string): number {
    if (!query) return 0;
    const q = query.toLowerCase();
    const label = entry.label.toLowerCase();
    const sub   = (entry.sub ?? '').toLowerCase();
    if (label === q)           return 100;
    if (label.startsWith(q))   return 80;
    if (label.includes(q))     return 60;
    if (sub.includes(q))       return 30;
    return 0;
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [cursor, setCursor] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? ALL_ENTRIES
            .map(e => ({ e, s: score(e, query) }))
            .filter(({ s }) => s > 0)
            .sort((a, b) => b.s - a.s)
            .map(({ e }) => e)
        : ALL_ENTRIES;

    // Group for display
    const groups = filtered.reduce<Record<string, Entry[]>>((acc, entry) => {
        if (!acc[entry.group]) acc[entry.group] = [];
        acc[entry.group].push(entry);
        return acc;
    }, {});

    // Flat list for keyboard cursor
    const flat = Object.values(groups).flat();

    const commit = useCallback((entry: Entry) => {
        setOpen(false);
        setQuery('');
        if (entry.action) { entry.action(); return; }
        if (entry.href)   { router.visit(entry.href); }
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(o => !o);
                setQuery('');
                setCursor(0);
            }
            if (!open) return;
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
            if (e.key === 'Enter' && flat[cursor]) { commit(flat[cursor]); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, flat, cursor, commit]);

    // Reset cursor on query change
    useEffect(() => { setCursor(0); }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 30);
    }, [open]);

    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                            onClick={() => { setOpen(false); setQuery(''); }}
                        />

                        {/* Palette */}
                        <motion.div
                            key="palette"
                            initial={{ opacity: 0, y: -12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="fixed top-[18vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
                        >
                            <div className="border border-border/80 bg-background shadow-2xl rounded-sm overflow-hidden">
                                {/* Search row */}
                                <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
                                    <Compass className="size-4 text-muted-foreground shrink-0" />
                                    <input
                                        ref={inputRef}
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="Where to?"
                                        className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none font-display tracking-tight"
                                    />
                                    <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 font-mono">
                                        esc
                                    </kbd>
                                </div>

                                {/* Results */}
                                <div className="max-h-80 overflow-y-auto overscroll-contain py-2">
                                    {flat.length === 0 ? (
                                        <div className="px-5 py-8 text-center">
                                            <p className="text-xs italic font-serif text-muted-foreground/50">No matching destinations.</p>
                                        </div>
                                    ) : (
                                        Object.entries(groups).map(([group, entries]) => (
                                            <div key={group}>
                                                <div className="flex items-center gap-3 px-5 pt-3 pb-1.5">
                                                    <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/60">{group}</span>
                                                    <span className="h-px flex-1 bg-border/30" />
                                                </div>
                                                {entries.map(entry => {
                                                    const isActive = flat.indexOf(entry) === cursor;
                                                    const Icon = entry.icon;
                                                    return (
                                                        <button
                                                            key={entry.id}
                                                            onMouseEnter={() => setCursor(flat.indexOf(entry))}
                                                            onClick={() => commit(entry)}
                                                            className={cn(
                                                                'w-full flex items-center gap-4 px-5 py-3 transition-colors text-left',
                                                                isActive ? 'bg-border/20' : 'hover:bg-border/10'
                                                            )}
                                                        >
                                                            <Icon className={cn('size-4 shrink-0 transition-colors',
                                                                isActive ? 'text-foreground' : 'text-muted-foreground/50'
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className={cn('font-display text-sm tracking-tight transition-colors',
                                                                    isActive ? 'text-foreground' : 'text-muted-foreground'
                                                                )}>
                                                                    {entry.label}
                                                                </div>
                                                                {entry.sub && (
                                                                    <div className="text-xs italic font-serif text-muted-foreground/50 truncate">
                                                                        {entry.sub}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isActive && (
                                                                <ArrowRight className="size-3.5 text-muted-foreground/40 shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer hint */}
                                <div className="border-t border-border/40 px-5 py-2.5 flex items-center gap-6 text-[10px] text-muted-foreground/40 font-mono">
                                    <span>↑↓ move</span>
                                    <span>↵ open</span>
                                    <span>esc close</span>
                                    <span className="ml-auto italic font-serif normal-case tracking-normal">⌘K to toggle</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
