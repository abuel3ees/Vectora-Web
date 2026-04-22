import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                A moment, please.
            </h1>

            <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-8">
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Password</label>
                            <PasswordInput id="password" name="password" placeholder="••••••••" autoComplete="current-password" autoFocus className={underline} />
                            <InputError message={errors.password} />
                        </div>

                        <Button variant="outline" disabled={processing} data-test="confirm-password-button"
                            className="w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <Spinner />}
                            Confirm &amp; proceed
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'A private corridor',
    description: 'Kindly confirm your password before we continue.',
};
