import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const content = useMemo(() => showRecoveryInput
        ? {
            title: 'Recovery cipher',
            description: 'Present one of your emergency recovery codes to continue.',
            heading: 'A recovery cipher.',
            toggleText: 'Use an authentication code instead',
          }
        : {
            title: 'A second confirmation',
            description: 'The figures from your authenticator — six digits, carefully entered.',
            heading: 'A second key.',
            toggleText: 'Or present a recovery cipher',
          }
    , [showRecoveryInput]);

    setLayoutProps({ title: content.title, description: content.description });

    const toggleRecoveryMode = (clearErrors: () => void) => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title="Two-factor authentication" />

            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-foreground mb-10">
                {content.heading}
            </h1>

            <Form {...store.form()} className="flex flex-col gap-8" resetOnError resetOnSuccess={!showRecoveryInput}>
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Recovery code</label>
                                <Input name="recovery_code" type="text" placeholder="xxxx-xxxx-xxxx" autoFocus required className={underline} />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                >
                                    <InputOTPGroup>
                                        {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                                            <InputOTPSlot key={index} index={index} />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError message={errors.code} />
                            </div>
                        )}

                        <Button type="submit" variant="outline" disabled={processing}
                            className="w-full rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-11">
                            Proceed
                        </Button>

                        <button
                            type="button"
                            className="text-center text-xs italic font-serif text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => toggleRecoveryMode(clearErrors)}
                        >
                            {content.toggleText} →
                        </button>
                    </>
                )}
            </Form>
        </>
    );
}
