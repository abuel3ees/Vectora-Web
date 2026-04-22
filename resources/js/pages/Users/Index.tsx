import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User, Paginated, PaginationLink } from '@/types';

interface IndexProps {
    users: Paginated<User>;
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

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function Index({ users, filters: _filters }: IndexProps) {
    const withRoles = users.data.filter(u => u.roles?.length > 0).length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: null as any }]}>
            <Head title="Users" />

            {/* Editorial masthead */}
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
                            <span>The register · Vol. II</span>
                        </div>
                        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
                            Your people.
                        </h1>
                        <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                            <span className="font-serif italic">{users.data.length}</span> {users.data.length === 1 ? 'member' : 'members'} entrusted with the keys — manage access, roles and permissions.
                        </p>
                    </div>
                    <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors">
                        <Link href="/users/create">
                            <UserPlus className="size-4" />
                            Invite member
                        </Link>
                    </Button>
                </div>
            </motion.section>

            {/* Ledger of figures */}
            <section className="px-8 md:px-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-border/60 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                    <FigureCell label="Total members" value={users.data.length} note="in the registry" />
                    <FigureCell label="With roles"    value={withRoles}          note="assigned permissions" />
                    <FigureCell label="Unassigned"    value={users.data.length - withRoles} note="awaiting review" />
                </div>
            </section>

            {/* Directory */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-8 md:px-12 pb-16"
            >
                <div className="flex items-end justify-between gap-6 mb-6 mt-10">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-2">Directory</div>
                        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">The roster</h2>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="h-px w-12 bg-border" />
                        <span className="italic font-serif">Sorted by name</span>
                    </span>
                </div>

                <div className="rounded-2xl border border-border/60 overflow-hidden">
                    {users.data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60">
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">Member</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">Roles</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">—</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user: User, i: number) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: 0.3 + i * 0.03 }}
                                        className={cn(
                                            'group transition-colors hover:bg-card/40',
                                            i !== 0 && 'border-t border-border/60'
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex size-10 items-center justify-center rounded-full border border-border/80 font-display text-base text-foreground">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate italic font-serif">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                {user.roles?.length > 0
                                                    ? user.roles.map((r, idx) => (
                                                        <span key={r.name} className="flex items-center gap-2 capitalize text-foreground">
                                                            {idx > 0 && <span className="text-muted-foreground">·</span>}
                                                            {r.name}
                                                        </span>
                                                      ))
                                                    : <span className="text-muted-foreground italic font-serif">unassigned</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" asChild className="size-8">
                                                    <Link href={`/users/${user.id}/edit`}>
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground hover:text-destructive">
                                                    <Link href={`/users/${user.id}`} method="delete" as="button">
                                                        <Trash2 className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {users.links && users.links.length > 3 && (
                    <div className="flex justify-center gap-1 mt-8">
                        {users.links.map((link: PaginationLink, index: number) =>
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

function FigureCell({ label, value, note }: { label: string; value: number; note: string }) {
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
            <div className="font-display text-4xl text-foreground">No members yet.</div>
            <div className="italic font-serif text-sm text-muted-foreground">Invite the first to begin the registry.</div>
            <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href="/users/create">
                    <UserPlus className="size-4" />
                    Invite member
                </Link>
            </Button>
        </div>
    );
}
