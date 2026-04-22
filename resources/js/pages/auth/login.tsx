import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <>
            <Head title="Log in" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                Welcome back.
            </h1>

            <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-8">
                {({ processing, errors }) => (
                    <>
                        <Field label="Email">
                            <Input id="email" type="email" name="email" required autoFocus tabIndex={1} autoComplete="email" placeholder="name@domain.com" className={underline} />
                            <InputError message={errors.email} />
                        </Field>

                        <Field
                            label="Password"
                            aside={canResetPassword && (
                                <TextLink href={request()} tabIndex={5} className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
                                    Forgot?
                                </TextLink>
                            )}
                        >
                            <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder="••••••••" className={underline} />
                            <InputError message={errors.password} />
                        </Field>

                        <label className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                            <Checkbox id="remember" name="remember" tabIndex={3} />
                            Remember me
                        </label>

                        <Button type="submit" variant="outline" tabIndex={4} disabled={processing} data-test="login-button"
                            className="mt-2 w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <Spinner />}
                            Enter
                        </Button>

                        {canRegister && (
                            <div className="text-center text-xs text-muted-foreground">
                                Not yet a member?{' '}
                                <TextLink href={register()} tabIndex={5} className="italic font-serif text-foreground">
                                    Request an invitation
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-6 text-center text-xs italic font-serif text-emerald-400">
                    {status}
                </div>
            )}
        </>
    );
}

function Field({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</label>
                {aside}
            </div>
            {children}
        </div>
    );
}

Login.layout = {
    title: 'Sign in',
    description: 'Enter your credentials to return to the atlas.',
};
