import { Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
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
import { dashboard, logout } from '@/routes';
import type { AppLayoutProps } from '@/types';

type NavEntry = {
    numeral: string;
    label: string;
    href: string;
    italic?: boolean;
    nested?: boolean;
    presentationMode?: boolean;
};

const atelier: NavEntry[] = [
    { numeral: 'i.', label: 'Overview', href: dashboard().url },
    {
        numeral: 'i.a.',
        label: 'Operations',
        href: '/operations',
        italic: true,
        nested: true,
    },
    { numeral: 'ii.', label: 'Optimize', href: '/optimize' },
    {
        numeral: 'ii.a.',
        label: 'Walkthrough',
        href: '/optimize/algorithm-walkthrough',
        italic: true,
        nested: true,
    },
    {
        numeral: 'ii.b.',
        label: 'History',
        href: '/optimize/history',
        italic: true,
        nested: true,
    },
];

const registers: NavEntry[] = [
    { numeral: 'iii.', label: 'People', href: '/users' },
    { numeral: 'iv.', label: 'Routes', href: '/routes' },
    { numeral: 'v.', label: 'Fleet', href: '/fleet' },
    { numeral: 'vi.', label: 'Delivery Proofs', href: '/delivery-proofs' },
    { numeral: 'vii.', label: 'Analytics', href: '/analytics' },
    {
        numeral: 'viii.',
        label: 'Demo Mode',
        href: '/demo',
        italic: true,
        presentationMode: true,
    },
    {
        numeral: 'ix.',
        label: 'Presentation',
        href: '/presentation',
        italic: true,
    },
];

function NavItem({ entry, active }: { entry: NavEntry; active: boolean }) {
    return (
        <Link
            href={entry.href}
            className={cn(
                'group relative flex items-baseline gap-3 py-2.5 transition-colors',
                entry.nested ? 'pr-2 pl-8' : 'pr-2 pl-4',
                active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {!entry.nested && (
                <span
                    className={cn(
                        'absolute top-1/2 left-0 h-px -translate-y-1/2 transition-all',
                        active
                            ? 'w-4 bg-primary'
                            : 'w-2 bg-border group-hover:w-3 group-hover:bg-foreground/40',
                    )}
                />
            )}
            <span
                className={cn(
                    'font-display w-6 shrink-0 text-sm italic tabular-nums transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground/70',
                )}
            >
                {entry.numeral}
            </span>
            <span
                className={cn(
                    'font-display flex-1 tracking-tight transition-colors',
                    entry.nested ? 'text-sm' : 'text-base',
                    entry.presentationMode && 'text-primary/90',
                )}
            >
                {entry.label}
            </span>
            {entry.presentationMode && (
                <span className="relative flex h-1.5 w-1.5 shrink-0 self-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
            )}
        </Link>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-6 mb-3 flex items-center gap-2 px-4 first:mt-0">
            <span className="text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                {children}
            </span>
            <span className="h-px flex-1 bg-border/50" />
        </div>
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();
    const isActive = (href: string) =>
        href.startsWith('#')
            ? false
            : url === href || url.startsWith(href + '/');

    // Embed mode (rendered inside the /demo iframe): strip the sidebar and breadcrumb chrome.
    const isEmbedded =
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('embed') === '1' ||
            window.self !== window.top);

    if (isEmbedded) {
        return (
            <main className="flex h-screen w-full flex-col bg-background">
                <div className="flex-1 overflow-auto">
                    <div className="flex w-full flex-col gap-6 px-0 py-6">
                        {children}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <SidebarProvider style={{ '--sidebar-width': '12rem' } as React.CSSProperties}>
            <CommandPalette />
            <Sidebar className="border-r border-border/60">
                <SidebarHeader className="border-b border-border/60 px-4 pt-8 pb-6">
                    <Link
                        href={dashboard()}
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border/80 transition-colors group-hover:border-foreground">
                            <span className="font-display text-2xl leading-none text-foreground">
                                V
                            </span>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-display text-xl tracking-tight text-foreground">
                                Vectora
                            </span>
                            <span className="mt-1 text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                                Maison de Flotte
                            </span>
                        </div>
                    </Link>
                    <div className="mt-6 flex items-center gap-3 text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                        <span className="h-px w-6 bg-border/60" />
                        <span>Est. MMXXVI</span>
                    </div>
                </SidebarHeader>

                <SidebarContent className="px-2 py-6">
                    <SectionLabel>Atelier</SectionLabel>
                    <nav className="flex flex-col">
                        {atelier.map((e) => (
                            <NavItem
                                key={e.label}
                                entry={e}
                                active={isActive(e.href)}
                            />
                        ))}
                    </nav>

                    <SectionLabel>The registers</SectionLabel>
                    <nav className="flex flex-col">
                        {registers.map((e) => (
                            <NavItem
                                key={e.label}
                                entry={e}
                                active={isActive(e.href)}
                            />
                        ))}
                    </nav>
                </SidebarContent>

                <SidebarFooter className="border-t border-border/60 px-4 py-6">
                    <Link
                        href="/settings/profile"
                        className="group flex items-center justify-between"
                    >
                        <div>
                            <div className="text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                                The desk
                            </div>
                            <div className="font-display mt-1 text-sm text-foreground transition-all group-hover:italic">
                                Settings &amp; correspondence
                            </div>
                        </div>
                        <span className="font-display text-muted-foreground italic transition-colors group-hover:text-foreground">
                            →
                        </span>
                    </Link>
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => router.flushAll()}
                        data-test="sidebar-logout-button"
                        className="mt-5 flex w-full items-center justify-between rounded-sm border border-border/60 px-3 py-2 text-left text-[10px] tracking-[0.28em] text-muted-foreground uppercase transition-colors hover:border-destructive/50 hover:text-destructive"
                    >
                        <span>Log out</span>
                        <LogOut className="size-4" />
                    </Link>
                    <div className="mt-5 flex items-center justify-between">
                        <p className="font-serif text-[10px] leading-relaxed text-muted-foreground/70 italic">
                            "Attended to, quietly, from a quiet room."
                        </p>
                        <kbd className="ml-3 shrink-0 rounded border border-border/30 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/30">
                            ⌘K
                        </kbd>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="min-w-0 gap-0">
                <main className="flex h-screen w-full flex-col">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-5 text-[11px] md:px-6">
                            <Link
                                href={dashboard()}
                                className="tracking-[0.25em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                            >
                                Home
                            </Link>
                            {breadcrumbs.map(
                                (breadcrumb: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="font-display text-muted-foreground/60 italic">
                                            /
                                        </span>
                                        {breadcrumb.href ? (
                                            <Link
                                                href={breadcrumb.href}
                                                className="tracking-[0.25em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                                            >
                                                {breadcrumb.title ||
                                                    breadcrumb.label}
                                            </Link>
                                        ) : (
                                            <span className="tracking-[0.25em] text-foreground uppercase">
                                                {breadcrumb.title ||
                                                    breadcrumb.label}
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-auto">
                        <div className="flex w-full flex-col gap-6 px-0 py-6">
                            {children}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
