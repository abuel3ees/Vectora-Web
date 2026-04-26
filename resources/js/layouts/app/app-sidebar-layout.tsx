import { Link, usePage } from '@inertiajs/react';
import { CommandPalette } from '@/components/command-palette';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { AppLayoutProps } from '@/types';

type NavEntry = { numeral: string; label: string; href: string; italic?: boolean; nested?: boolean };

const atelier: NavEntry[] = [
    { numeral: 'i.',   label: 'Overview',  href: dashboard().url },
    { numeral: 'ii.',  label: 'Optimize',  href: '/optimize' },
    { numeral: 'ii.a.', label: 'Algorithm Walkthrough',  href: '/optimize/algorithm-walkthrough', italic: true, nested: true },
    { numeral: 'ii.b.', label: 'History',  href: '/optimize/history', italic: true, nested: true },
];

const registers: NavEntry[] = [
    { numeral: 'iii.', label: 'People',       href: '/users' },
    { numeral: 'iv.',  label: 'Routes',       href: '/routes' },
    { numeral: 'v.',   label: 'Fleet',        href: '/fleet' },
    { numeral: 'vi.',  label: 'Delivery Proofs', href: '/delivery-proofs' },
    { numeral: 'vii.',  label: 'Analytics',    href: '/analytics' },
    { numeral: 'viii.', label: 'Presentation', href: '/presentation', italic: true },
];

function NavItem({ entry, active }: { entry: NavEntry; active: boolean }) {
    return (
        <Link
            href={entry.href}
            prefetch={!active}
            className={cn(
                'group relative flex items-baseline gap-4 py-2.5 transition-colors',
                entry.nested ? 'pl-12 pr-3' : 'pl-5 pr-3',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
        >
            {!entry.nested && (
                <span className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-px transition-all',
                    active ? 'w-4 bg-primary' : 'w-2 bg-border group-hover:w-3 group-hover:bg-foreground/40'
                )} />
            )}
            <span className={cn(
                'font-display italic text-sm tabular-nums w-6 shrink-0 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground/70'
            )}>
                {entry.numeral}
            </span>
            <span className={cn(
                'font-display tracking-tight flex-1 transition-colors',
                entry.nested ? 'text-sm' : 'text-base'
            )}>
                {entry.label}
            </span>
        </Link>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 px-5 mb-3 mt-6 first:mt-0">
            <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">{children}</span>
            <span className="h-px flex-1 bg-border/50" />
        </div>
    );
}

export default function AppSidebarLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { url } = usePage();
    const isActive = (href: string) => href.startsWith('#') ? false : url === href || url.startsWith(href + '/');

    return (
        <SidebarProvider>
            <CommandPalette />
            <Sidebar className="border-r border-border/60">
                <SidebarHeader className="px-6 pt-8 pb-6 border-b border-border/60">
                    <Link href={dashboard()} prefetch className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center border border-border/80 rounded-sm transition-colors group-hover:border-foreground">
                            <span className="font-display text-2xl leading-none text-foreground">V</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-display text-xl tracking-tight text-foreground">Vectora</span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Maison de Flotte</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3 mt-6 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                        <span className="h-px w-6 bg-border/60" />
                        <span>Est. MMXXVI</span>
                    </div>
                </SidebarHeader>

                <SidebarContent className="px-3 py-6">
                    <SectionLabel>Atelier</SectionLabel>
                    <nav className="flex flex-col">
                        {atelier.map(e => <NavItem key={e.label} entry={e} active={isActive(e.href)} />)}
                    </nav>

                    <SectionLabel>The registers</SectionLabel>
                    <nav className="flex flex-col">
                        {registers.map(e => <NavItem key={e.label} entry={e} active={isActive(e.href)} />)}
                    </nav>
                </SidebarContent>

                <SidebarFooter className="border-t border-border/60 px-6 py-6">
                    <Link href="/settings/profile" prefetch className="flex items-center justify-between group">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">The desk</div>
                            <div className="font-display text-sm text-foreground mt-1 group-hover:italic transition-all">Settings &amp; correspondence</div>
                        </div>
                        <span className="font-display italic text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                    </Link>
                    <div className="mt-5 flex items-center justify-between">
                        <p className="text-[10px] italic font-serif text-muted-foreground/70 leading-relaxed">
                            "Attended to, quietly, from a quiet room."
                        </p>
                        <kbd className="text-[9px] font-mono text-muted-foreground/30 border border-border/30 rounded px-1.5 py-0.5 shrink-0 ml-3">⌘K</kbd>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="gap-0 -ml-29">
                <main className="flex flex-col w-full h-screen">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-3 border-b border-border/60 px-8 md:px-12 py-5 text-[11px]">
                            <Link href={dashboard()} prefetch className="uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors">
                                Home
                            </Link>
                            {breadcrumbs.map((breadcrumb: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="font-display italic text-muted-foreground/60">/</span>
                                    {breadcrumb.href ? (
                                        <Link href={breadcrumb.href} prefetch className="uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors">
                                            {breadcrumb.title || breadcrumb.label}
                                        </Link>
                                    ) : (
                                        <span className="uppercase tracking-[0.25em] text-foreground">{breadcrumb.title || breadcrumb.label}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-auto">
                        <div className="w-full px-0 py-6 flex flex-col gap-6">
                            {children}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
