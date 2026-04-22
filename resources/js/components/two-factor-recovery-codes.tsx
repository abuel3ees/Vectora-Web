import { Form } from '@inertiajs/react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import { Button } from '@/components/ui/button';
import { regenerateRecoveryCodes } from '@/routes/two-factor';

type Props = {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
}: Props) {
    const [codesAreVisible, setCodesAreVisible] = useState<boolean>(false);
    const codesSectionRef = useRef<HTMLDivElement | null>(null);
    const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;

    const toggleCodesVisibility = useCallback(async () => {
        if (!codesAreVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setCodesAreVisible(!codesAreVisible);

        if (!codesAreVisible) {
            setTimeout(() => {
                codesSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
        }
    }, [codesAreVisible, recoveryCodesList.length, fetchRecoveryCodes]);

    useEffect(() => {
        if (!recoveryCodesList.length) {
            fetchRecoveryCodes();
        }
    }, [recoveryCodesList.length, fetchRecoveryCodes]);

    const Icon = codesAreVisible ? EyeOff : Eye;

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    onClick={toggleCodesVisibility}
                    variant="outline"
                    aria-expanded={codesAreVisible}
                    aria-controls="recovery-codes-section"
                    className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-9 px-5 gap-2 text-xs"
                >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {codesAreVisible ? 'Hide' : 'View'} recovery codes
                </Button>

                {canRegenerateCodes && (
                    <Form
                        {...regenerateRecoveryCodes.form()}
                        options={{ preserveScroll: true }}
                        onSuccess={fetchRecoveryCodes}
                    >
                        {({ processing }) => (
                            <Button
                                variant="ghost"
                                type="submit"
                                disabled={processing}
                                aria-describedby="regenerate-warning"
                                className="rounded-full h-9 px-5 gap-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw className="size-3" />
                                Regenerate
                            </Button>
                        )}
                    </Form>
                )}
            </div>

            <div
                id="recovery-codes-section"
                className={`overflow-hidden transition-all duration-300 ${codesAreVisible ? 'opacity-100' : 'h-0 opacity-0'}`}
                aria-hidden={!codesAreVisible}
            >
                {errors?.length ? (
                    <AlertError errors={errors} />
                ) : (
                    <div className="space-y-3">
                        <div
                            ref={codesSectionRef}
                            className="grid grid-cols-2 gap-1 border border-border/60 rounded-sm p-4 font-mono text-sm"
                            role="list"
                            aria-label="Recovery codes"
                        >
                            {recoveryCodesList.length ? (
                                recoveryCodesList.map((code, index) => (
                                    <div
                                        key={index}
                                        role="listitem"
                                        className="select-text text-muted-foreground tracking-wider"
                                    >
                                        {code}
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="col-span-2 space-y-2"
                                    aria-label="Loading recovery codes"
                                >
                                    {Array.from({ length: 8 }, (_, index) => (
                                        <div
                                            key={index}
                                            className="h-4 animate-pulse rounded bg-muted-foreground/20"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <p id="regenerate-warning" className="text-xs italic font-serif text-muted-foreground/70 leading-relaxed">
                            Each code may be used once. Store them somewhere safe — they cannot be recovered after this view.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
