import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DispatchRoute, Paginated, PaginationLink, RouteStatus } from '@/types';

interface IndexProps {
    routes: Paginated<DispatchRoute>;
    filters: Record<string, string>;
}

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

const statusCopy: Record<RouteStatus, { label: string; mark: string; tone: string }> = {
    pending:     { label: 'Pending',     mark: '○', tone: 'text-amber-400/90' },
    in_progress: { label: 'In progress', mark: '◐', tone: 'text-sky-400/90' },
    completed:   { label: 'Completed',   mark: '●', tone: 'text-emerald-400/90' },
};

export default function Index({ routes, filters: _filters }: IndexProps) {
    const pending    = routes.data.filter(r => r.status === 'pending').length;
    const inProgress = routes.data.filter(r => r.status === 'in_progress').length;
    const completed  = routes.data.filter(r => r.status === 'completed').length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Routes', href: null as any }]}>
            <Head title="Routes" />

            {/* Masthead */}
            <motion.section
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="px-8 md:px-12 pt-14 pb-10"
            >
                <div className="flex items-end justify-between gap-8 border-b border-border/60 pb-8">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                            <span className="h-px w-8 bg-primary/60" />
                            <span>The atlas · Vol. III</span>
                        </div>
                        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
                            Routes, charted.
                        </h1>
                        <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                            Plan and observe every dispatch — a study of movement across the fleet.
                        </p>
                    </div>
                    <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors">
                        <Link href="/routes/create">
                            <Plus className="size-4" />
                            New route
                        </Link>
                    </Button>
                </div>
            </motion.section>

            {/* Figures */}
            <section className="px-8 md:px-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-border/60 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                    <Figure label="Pending"     value={pending}    note="awaiting departure" />
                    <Figure label="In progress" value={inProgress} note="currently in motion" />
                    <Figure label="Completed"   value={completed}  note="concluded today" />
                </div>
            </section>

            {/* Ledger */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-8 md:px-12 pb-16"
            >
                <div className="flex items-end justify-between gap-6 mb-6 mt-10">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-2">Ledger</div>
                        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">Today's routes</h2>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="h-px w-12 bg-border" />
                        <span className="italic font-serif">Updated continuously</span>
                    </span>
                </div>

                <div className="rounded-2xl border border-border/60 overflow-hidden">
                    {routes.data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60">
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">Route</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] hidden md:table-cell">Note</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">—</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routes.data.map((route: DispatchRoute, i: number) => {
                                    const s = statusCopy[route.status] ?? statusCopy.pending;

                                    return (
                                        <motion.tr
                                            key={route.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: 0.3 + i * 0.03 }}
                                            className={cn(
                                                'group transition-colors hover:bg-card/40',
                                                i !== 0 && 'border-t border-border/60'
                                            )}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-baseline gap-3">
                                                    <span className="font-display text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                                    <span className="font-display text-lg text-foreground">{route.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center gap-2 text-xs">
                                                    <span className={cn('text-base leading-none', s.tone)}>{s.mark}</span>
                                                    <span className="text-foreground">{s.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-muted-foreground hidden md:table-cell max-w-xs truncate italic font-serif">
                                                {route.description
                                                    ? route.description.length > 60
                                                        ? `${route.description.slice(0, 60)}…`
                                                        : route.description
                                                    : <span className="opacity-60">—</span>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" asChild className="size-8">
                                                        <Link href={`/routes/${route.id}/edit`}>
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground hover:text-destructive">
                                                        <Link href={`/routes/${route.id}`} method="delete" as="button">
                                                            <Trash2 className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {routes.links && routes.links.length > 3 && (
                    <div className="flex justify-center gap-1 mt-8">
                        {routes.links.map((link: PaginationLink, index: number) =>
                            link.url ? (
                                <Button key={index} variant={link.active ? 'default' : 'ghost'} size="sm" className="h-9 min-w-9 px-3 text-xs rounded-full" asChild>
                                    <Link href={link.url}>{decodePaginationLabel(link.label)}</Link>
                                </Button>
                            ) : (
                                <Button key={index} variant="ghost" size="sm" className="h-9 min-w-9 px-3 text-xs opacity-40 rounded-full" disabled>
                                    {decodePaginationLabel(link.label)}
                                </Button>
                            )
                        )}
                    </div>
                )}
            </motion.section>
        </AppLayout>
    );
}

function Figure({ label, value, note }: { label: string; value: number; note: string }) {
    return (
        <div className="p-7 hover:bg-card/40 transition-colors">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
            <div className="mt-6 font-display text-6xl leading-none tracking-tight text-foreground tabular-nums">{value}</div>
            <div className="mt-5 flex items-center gap-3 text-[11px]">
                <span className="h-px flex-1 bg-border/60" />
                <span className="italic font-serif text-muted-foreground">{note}</span>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="font-display text-4xl text-foreground">Nothing dispatched yet.</div>
            <div className="italic font-serif text-sm text-muted-foreground">Plot the first route to set the fleet in motion.</div>
            <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href="/routes/create">
                    <Plus className="size-4" />
                    New route
                </Link>
            </Button>
        </div>
    );
}
