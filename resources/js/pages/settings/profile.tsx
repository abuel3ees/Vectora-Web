import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-12">
                <section className="space-y-8">
                    <div className="border-b border-border/60 pb-6">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ i</div>
                        <h2 className="font-display text-2xl tracking-tight text-foreground">Profile information</h2>
                        <p className="mt-1 text-xs italic font-serif text-muted-foreground">Update your name and email address.</p>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{ preserveScroll: true }}
                        className="flex flex-col gap-8"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field label="Name">
                                    <Input
                                        id="name"
                                        className={underline}
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <InputError message={errors.name} />
                                </Field>

                                <Field label="Email address">
                                    <Input
                                        id="email"
                                        type="email"
                                        className={underline}
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="name@domain.com"
                                    />
                                    <InputError message={errors.email} />
                                </Field>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs italic font-serif text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                                            >
                                                Resend verification.
                                            </Link>
                                        </p>
                                        {status === 'verification-link-sent' && (
                                            <p className="text-xs italic font-serif text-emerald-400">
                                                A verification link has been dispatched.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <Button
                                        disabled={processing}
                                        variant="outline"
                                        data-test="update-profile-button"
                                        className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-10 px-6"
                                    >
                                        {processing ? 'Saving…' : 'Save changes'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                <DeleteUser />
            </div>
        </>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</label>
            {children}
        </div>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
