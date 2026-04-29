import { Form, Head, router } from '@inertiajs/react';
import { platformAuthenticatorIsAvailable, startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
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

type AuthenticationOptionsJSON = Parameters<typeof startAuthentication>[0]['optionsJSON'];

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [email, setEmail] = useState('');
    const [usePasswordLogin, setUsePasswordLogin] = useState(false);
    const [webauthnSupported, setWebauthnSupported] = useState(true);
    const [passkeyProcessing, setPasskeyProcessing] = useState(false);
    const [passkeyError, setPasskeyError] = useState<string | null>(null);

    useEffect(() => {
        platformAuthenticatorIsAvailable()
            .then((ok) => {
                setWebauthnSupported(ok);

                if (!ok) {
                    setUsePasswordLogin(true);
                }
            })
            .catch(() => {
                setWebauthnSupported(false);
                setUsePasswordLogin(true);
            });
    }, []);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

    const webAuthnHeaders = () => ({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrf(),
    });

    const postWebAuthnJson = async <T,>(url: string, body?: unknown): Promise<T> => {
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: webAuthnHeaders(),
            body: JSON.stringify(body ?? {}),
        });

        if (!res.ok) {
            throw new Error(`Fingerprint login failed (${res.status})`);
        }

        if (res.status === 204) {
            return undefined as T;
        }

        return await res.json() as T;
    };

    const handlePasskeyLogin = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setPasskeyError('Enter your email first.');

            return;
        }

        setPasskeyProcessing(true);
        setPasskeyError(null);

        try {
            const options = await postWebAuthnJson<AuthenticationOptionsJSON>('/webauthn/login/options', { email: trimmedEmail });
            const assertion = await startAuthentication({ optionsJSON: options });
            const result = await postWebAuthnJson<{ ok?: boolean; redirect?: string }>('/webauthn/login', assertion);

            router.visit(result.redirect ?? '/dashboard');
        } catch (error) {
            const errName = error instanceof Error ? error.name : '';
            const errMsg = error instanceof Error ? error.message : 'Fingerprint login failed.';
            const cancelled = errName === 'NotAllowedError' || errName === 'AbortError' || /cancel|not completed/i.test(errMsg);

            setPasskeyError(cancelled ? 'Authentication cancelled.' : errMsg);
        } finally {
            setPasskeyProcessing(false);
        }
    };

    const modeToggle = (
        <label className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <Checkbox
                id="use-password-login"
                checked={usePasswordLogin}
                disabled={!webauthnSupported}
                onCheckedChange={(checked) => {
                    setUsePasswordLogin(checked === true);
                    setPasskeyError(null);
                }}
                tabIndex={usePasswordLogin ? 3 : 2}
            />
            Use email and password
        </label>
    );

    const emailField = (error?: string) => (
        <Field label="Email">
            <Input
                id="email"
                type="email"
                name="email"
                required
                autoFocus
                tabIndex={1}
                autoComplete="email"
                placeholder="name@domain.com"
                className={underline}
                value={email}
                onChange={(event) => {
                    setEmail(event.target.value);
                    setPasskeyError(null);
                }}
            />
            <InputError message={error} />
        </Field>
    );

    return (
        <>
            <Head title="Log in" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                Welcome back.
            </h1>

            {usePasswordLogin ? (
                <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-8">
                    {({ processing, errors }) => (
                        <>
                            {emailField(errors.email)}

                            <Field
                                label="Password"
                                aside={canResetPassword && (
                                    <TextLink href={request()} tabIndex={6} className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
                                        Forgot?
                                    </TextLink>
                                )}
                            >
                                <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder="••••••••" className={underline} />
                                <InputError message={errors.password} />
                            </Field>

                            {modeToggle}

                            <label className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                                <Checkbox id="remember" name="remember" tabIndex={4} />
                                Remember me
                            </label>

                            <Button type="submit" variant="outline" tabIndex={5} disabled={processing} data-test="login-button"
                                className="mt-2 w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                                {processing ? <Spinner /> : <KeyRound className="size-4" />}
                                Enter
                            </Button>

                            {canRegister && (
                                <div className="text-center text-xs text-muted-foreground">
                                    Not yet a member?{' '}
                                    <TextLink href={register()} tabIndex={7} className="italic font-serif text-foreground">
                                        Request an invitation
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>
            ) : (
                <div className="flex flex-col gap-8">
                    {emailField()}

                    {modeToggle}

                    {passkeyError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {passkeyError}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        tabIndex={3}
                        disabled={passkeyProcessing || !webauthnSupported || !email.trim()}
                        onClick={handlePasskeyLogin}
                        data-test="fingerprint-login-button"
                        className="mt-2 w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11"
                    >
                        {passkeyProcessing ? <Spinner /> : <Fingerprint className="size-4" />}
                        Sign in with fingerprint
                    </Button>

                    {canRegister && (
                        <div className="text-center text-xs text-muted-foreground">
                            Not yet a member?{' '}
                            <TextLink href={register()} tabIndex={4} className="italic font-serif text-foreground">
                                Request an invitation
                            </TextLink>
                        </div>
                    )}
                </div>
            )}

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
