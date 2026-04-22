import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-8">
                A letter awaits.
            </h1>

            {status === 'verification-link-sent' && (
                <div className="mb-8 text-xs italic font-serif text-emerald-400 border-l-2 border-emerald-400/60 pl-4 py-2">
                    A new verification link has been dispatched to the address you provided.
                </div>
            )}

            <Form {...send.form()} className="flex flex-col gap-6">
                {({ processing }) => (
                    <>
                        <Button variant="outline" disabled={processing}
                            className="w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            {processing && <Spinner />}
                            Request another letter
                        </Button>

                        <TextLink href={logout()} className="mx-auto text-center text-xs italic font-serif text-muted-foreground hover:text-foreground">
                            Or, take your leave
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Confirm your address',
    description: 'A letter was sent with a link — kindly follow it to confirm.',
};
