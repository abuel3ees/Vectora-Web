import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                Mislaid your keys?
            </h1>

            {status && (
                <div className="mb-8 text-xs italic font-serif text-emerald-400">
                    {status}
                </div>
            )}

            <Form {...email.form()} className="flex flex-col gap-8">
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</label>
                            <Input id="email" type="email" name="email" autoComplete="off" autoFocus placeholder="name@domain.com" className={underline} />
                            <InputError message={errors.email} />
                        </div>

                        <Button variant="outline" disabled={processing} data-test="email-password-reset-link-button"
                            className="w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Send the courier
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-10 text-center text-xs text-muted-foreground">
                <span>or, </span>
                <TextLink href={login()} className="italic font-serif text-foreground">return to sign in</TextLink>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lost access',
    description: 'Leave your address — a reset link will be dispatched shortly.',
};
