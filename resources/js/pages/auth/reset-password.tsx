import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = { token: string; email: string };

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function ResetPassword({ token, email }: Props) {
    return (
        <>
            <Head title="Reset password" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                Set a new key.
            </h1>

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-8"
            >
                {({ processing, errors }) => (
                    <>
                        <Field label="Email">
                            <Input id="email" type="email" name="email" autoComplete="email" value={email} readOnly className={`${underline} opacity-70`} />
                            <InputError message={errors.email} />
                        </Field>

                        <Field label="New password">
                            <PasswordInput id="password" name="password" autoComplete="new-password" autoFocus placeholder="••••••••" className={underline} />
                            <InputError message={errors.password} />
                        </Field>

                        <Field label="Confirm">
                            <PasswordInput id="password_confirmation" name="password_confirmation" autoComplete="new-password" placeholder="Repeat" className={underline} />
                            <InputError message={errors.password_confirmation} />
                        </Field>

                        <Button type="submit" variant="outline" disabled={processing} data-test="reset-password-button"
                            className="mt-2 w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <Spinner />}
                            Restore access
                        </Button>
                    </>
                )}
            </Form>
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

ResetPassword.layout = {
    title: 'New credentials',
    description: 'Set a fresh password — chosen with care, kept close.',
};
