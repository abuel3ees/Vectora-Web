import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile',    href: edit(),          icon: null },
    { title: 'Security',   href: editSecurity(),   icon: null },
    { title: 'Appearance', href: editAppearance(), icon: null },
];

const NUMERALS = ['i.', 'ii.', 'iii.'];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-8 md:px-12 py-10">
            <div className="border-b border-border/60 pb-8 mb-10">
                <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ vi</div>
                <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-foreground">
                    The desk.
                </h1>
                <p className="mt-3 text-sm italic font-serif text-muted-foreground leading-relaxed">
                    Your preferences and account particulars.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                <aside className="lg:w-44 shrink-0">
                    <nav className="flex flex-row flex-wrap lg:flex-col gap-1">
                        {sidebarNavItems.map((item, i) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${i}`}
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-baseline gap-3 py-2.5 pl-5 pr-3 transition-colors',
                                        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <span className={cn(
                                        'absolute left-0 top-1/2 -translate-y-1/2 h-px transition-all',
                                        active ? 'w-4 bg-primary' : 'w-2 bg-border group-hover:w-3 group-hover:bg-foreground/40'
                                    )} />
                                    <span className={cn(
                                        'font-display italic text-xs tabular-nums w-5 shrink-0 transition-colors',
                                        active ? 'text-primary' : 'text-muted-foreground/70'
                                    )}>
                                        {NUMERALS[i]}
                                    </span>
                                    <span className="font-display text-sm tracking-tight flex-1">
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex-1 max-w-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
