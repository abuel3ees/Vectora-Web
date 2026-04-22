import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function Register() {
    return (
        <>
            <Head title="Register" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                Join the maison.
            </h1>

            <Form {...store.form()} resetOnSuccess={['password', 'password_confirmation']} disableWhileProcessing className="flex flex-col gap-8">
                {({ processing, errors }) => (
                    <>
                        <Field label="Name">
                            <Input id="name" type="text" required autoFocus tabIndex={1} autoComplete="name" name="name" placeholder="Full name" className={underline} />
                            <InputError message={errors.name} />
                        </Field>

                        <Field label="Email">
                            <Input id="email" type="email" required tabIndex={2} autoComplete="email" name="email" placeholder="name@domain.com" className={underline} />
                            <InputError message={errors.email} />
                        </Field>

                        <Field label="Password">
                            <PasswordInput id="password" required tabIndex={3} autoComplete="new-password" name="password" placeholder="••••••••" className={underline} />
                            <InputError message={errors.password} />
                        </Field>

                        <Field label="Confirm">
                            <PasswordInput id="password_confirmation" required tabIndex={4} autoComplete="new-password" name="password_confirmation" placeholder="Repeat" className={underline} />
                            <InputError message={errors.password_confirmation} />
                        </Field>

                        <Button type="submit" variant="outline" tabIndex={5} data-test="register-user-button"
                            className="mt-2 w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <Spinner />}
                            Create account
                        </Button>

                        <div className="text-center text-xs text-muted-foreground">
                            Already a member?{' '}
                            <TextLink href={login()} tabIndex={6} className="italic font-serif text-foreground">
                                Sign in
                            </TextLink>
                        </div>
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

Register.layout = {
    title: 'Request invitation',
    description: 'A few particulars before we open the doors.',
};
