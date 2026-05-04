import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile', href: edit(), icon: null },
    { title: 'Security', href: editSecurity(), icon: null },
    { title: 'Appearance', href: editAppearance(), icon: null },
    { title: 'Mobile theme', href: '/settings/mobile-theme', icon: null },
    { title: 'Developer', href: '/settings/developer', icon: null },
];

const NUMERALS = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-10 md:px-6">
            <div className="mb-10 border-b border-border/60 pb-8">
                <div className="mb-2 text-[10px] tracking-[0.35em] text-muted-foreground uppercase">
                    § vi
                </div>
                <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl">
                    The desk.
                </h1>
                <p className="mt-3 font-serif text-sm leading-relaxed text-muted-foreground italic">
                    Your preferences and account particulars.
                </p>
            </div>

            <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
                <aside className="shrink-0 lg:w-44">
                    <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
                        {sidebarNavItems.map((item, i) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${i}`}
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-baseline gap-3 py-2.5 pr-3 pl-5 transition-colors',
                                        active
                                            ? 'text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute top-1/2 left-0 h-px -translate-y-1/2 transition-all',
                                            active
                                                ? 'w-4 bg-primary'
                                                : 'w-2 bg-border group-hover:w-3 group-hover:bg-foreground/40',
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'font-display w-5 shrink-0 text-xs italic tabular-nums transition-colors',
                                            active
                                                ? 'text-primary'
                                                : 'text-muted-foreground/70',
                                        )}
                                    >
                                        {NUMERALS[i]}
                                    </span>
                                    <span className="font-display flex-1 text-sm tracking-tight">
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="max-w-5xl flex-1">{children}</div>
            </div>
        </div>
    );
}
