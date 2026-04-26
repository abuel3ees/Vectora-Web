import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import type { User, Role } from '@/types';

interface EditProps {
    user: User;
    roles: Role[];
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function Edit({ user, roles }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        roles: user.roles.map((r: Role) => r.name),
    });

    const submit = (e: { preventDefault(): void }) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    const toggleRole = (roleName: string) => {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter(r => r !== roleName)
            : [...data.roles, roleName]
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: '/users' }, { title: `Edit: ${user.name}`, href: null as any }]}>
            <Head title={`Edit — ${user.name}`} />

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

                <div className="border-b border-border/60 pb-8 mb-10 flex items-end gap-5">
                    <div className="flex size-16 items-center justify-center rounded-full border border-border/80 font-display text-2xl text-foreground shrink-0">
                        {getInitials(user.name)}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">Amending</div>
                        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight text-foreground truncate">
                            {user.name}
                        </h1>
                        <p className="mt-2 text-xs italic font-serif text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-10">
                    <Field label="Name" error={errors.name}>
                        <Input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                        />
                    </Field>

                    <Field label="Email" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary shadow-none"
                        />
                    </Field>

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
                            {processing ? 'Saving…' : 'Save changes'}
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
