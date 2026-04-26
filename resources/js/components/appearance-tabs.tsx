import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const tabs: { value: Appearance; label: string; mark: string }[] = [
    { value: 'light',  label: 'Light',  mark: '○' },
    { value: 'dark',   label: 'Dark',   mark: '●' },
    { value: 'system', label: 'System', mark: '◐' },
];

export default function AppearanceTabs({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className={cn('flex flex-col gap-2', className)} {...props}>
            {tabs.map(({ value, label, mark }) => {
                const active = appearance === value;

                return (
                    <button
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'group relative flex items-baseline gap-4 py-2.5 pl-5 pr-3 transition-colors text-left',
                            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <span className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 h-px transition-all',
                            active ? 'w-4 bg-primary' : 'w-2 bg-border group-hover:w-3 group-hover:bg-foreground/40'
                        )} />
                        <span className={cn(
                            'font-display text-sm tabular-nums w-4 shrink-0 transition-colors leading-none',
                            active ? 'text-primary' : 'text-muted-foreground/60'
                        )}>
                            {mark}
                        </span>
                        <span className="font-display text-base tracking-tight">
                            {label}
                        </span>
                        {active && (
                            <span className="ml-auto text-[10px] uppercase tracking-[0.3em] text-primary">
                                active
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
