import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh bg-background">
            {/* Left editorial panel */}
            <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-border/60">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
                <div className="relative flex flex-col justify-between p-14 w-full">
                    <Link href={home()} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center border border-border/80 rounded-sm">
                            <span className="font-display text-xl leading-none text-foreground">V</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-display text-lg tracking-tight text-foreground">Vectora</span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Maison de Flotte</span>
                        </div>
                    </Link>

                    <div className="max-w-md">
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-6">
                            <span className="h-px w-8 bg-primary/60" />
                            <span>A quiet welcome</span>
                        </div>
                        <p className="font-display text-4xl leading-[1.15] text-foreground">
                            <span className="italic">"The well-run fleet</span> moves with the grace of a considered thought."
                        </p>
                        <p className="mt-6 text-xs italic font-serif text-muted-foreground">— house notes, undated</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        <span>Est. 2026</span>
                        <span>Vol. I</span>
                    </div>
                </div>
            </aside>

            {/* Right form column */}
            <main className="flex flex-1 items-center justify-center p-8 md:p-16">
                <div className="w-full max-w-sm">
                    <Link href={home()} className="lg:hidden inline-flex items-center gap-2 mb-10 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
                        <span className="flex h-7 w-7 items-center justify-center border border-border/80 rounded-sm font-display text-base text-foreground">V</span>
                        Vectora
                    </Link>

                    <div className="border-b border-border/60 pb-6 mb-10">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
                            {title || 'Entry'}
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground italic font-serif leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </main>
        </div>
    );
}
