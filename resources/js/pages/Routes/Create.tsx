import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import type { RouteStatus } from '@/types';

const STATUS_OPTIONS: { value: RouteStatus; label: string }[] = [
    { value: 'pending',     label: 'Pending' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed',   label: 'Completed' },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        status: 'pending' as RouteStatus,
        description: '',
    });

    const submit = (e: { preventDefault(): void }) => {
        e.preventDefault();
        post('/routes');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Routes', href: '/routes' }, { title: 'Create', href: null as any }]}>
            <Head title="New Route" />

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="self-center w-full max-w-2xl px-8 md:px-0 pt-12 pb-16"
            >
                <Link href="/routes" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-10">
                    <ArrowLeft className="size-3.5" />
                    <span className="uppercase tracking-[0.25em]">Back to atlas</span>
                </Link>

                <div className="border-b border-border/60 pb-8 mb-10">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                        <span className="h-px w-8 bg-primary/60" />
                        <span>Plotting</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-foreground">
                        A new course.
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground italic font-serif">
                        Name the route, set its state, leave a note for those who follow.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-10">
                    <Field label="Route name" error={errors.name}>
                        <Input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g. Route Alpha"
                            autoFocus
                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                        />
                    </Field>

                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Status</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {STATUS_OPTIONS.map(({ value, label }) => {
                                const active = data.status === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setData('status', value)}
                                        className={cn(
                                            'group flex items-center gap-2.5 text-sm transition-colors',
                                            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <span className={cn(
                                            'size-4 rounded-full border transition-colors flex items-center justify-center',
                                            active ? 'border-primary bg-primary' : 'border-border'
                                        )}>
                                            {active && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                                        </span>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.status && <p className="text-xs text-destructive italic font-serif">{errors.status}</p>}
                    </div>

                    <Field label="Description">
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            rows={3}
                            placeholder="A brief note…"
                            className="w-full border-0 border-b border-border/60 bg-transparent px-0 py-2 text-base outline-none resize-none placeholder:text-muted-foreground/60 focus:border-primary transition-colors"
                        />
                        {errors.description && <p className="text-xs text-destructive italic font-serif">{errors.description}</p>}
                    </Field>

                    <div className="flex justify-end gap-3 pt-8 border-t border-border/60 mt-2">
                        <Button variant="ghost" asChild className="rounded-full">
                            <Link href="/routes">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} variant="outline" className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors">
                            {processing ? 'Plotting…' : 'Plot route'}
                        </Button>
                    </div>
                </form>
            </motion.section>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive italic font-serif">{error}</p>}
        </div>
    );
}
