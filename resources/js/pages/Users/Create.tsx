import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

interface CreateProps {
    roles: Role[];
}

export default function Create({ roles }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
    });

    const submit = (e: { preventDefault(): void }) => {
        e.preventDefault();
        post('/users');
    };

    const toggleRole = (roleName: string) => {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter(r => r !== roleName)
            : [...data.roles, roleName]
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: '/users' }, { title: 'Create', href: null as any }]}>
            <Head title="New User" />

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="self-center w-full max-w-2xl px-8 md:px-0 pt-12 pb-16"
            >
                <Link href="/users" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-10">
                    <ArrowLeft className="size-3.5" />
                    <span className="uppercase tracking-[0.25em]">Back to registry</span>
                </Link>

                <div className="border-b border-border/60 pb-8 mb-10">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                        <span className="h-px w-8 bg-primary/60" />
                        <span>Onboarding</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-foreground">
                        A new member.
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground italic font-serif">
                        Entrust them with access, thoughtfully.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-10">
                    <Field label="Name" error={errors.name}>
                        <Input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Full name"
                            autoFocus
                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                        />
                    </Field>

                    <Field label="Email" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="name@domain.com"
                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-8">
                        <Field label="Password" error={errors.password}>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="Minimum eight"
                                className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                            />
                        </Field>
                        <Field label="Confirm">
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                placeholder="Repeat"
                                className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                            />
                        </Field>
                    </div>

                    {roles.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Roles</label>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {roles.map((role: Role) => {
                                    const active = data.roles.includes(role.name);

                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => toggleRole(role.name)}
                                            className={cn(
                                                'group flex items-center gap-2.5 text-sm capitalize transition-colors',
                                                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <span className={cn(
                                                'size-4 rounded-full border transition-colors flex items-center justify-center',
                                                active ? 'border-primary bg-primary' : 'border-border'
                                            )}>
                                                {active && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                                            </span>
                                            {role.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-8 border-t border-border/60 mt-2">
                        <Button variant="ghost" asChild className="rounded-full">
                            <Link href="/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} variant="outline" className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors">
                            {processing ? 'Extending invitation…' : 'Extend invitation'}
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
