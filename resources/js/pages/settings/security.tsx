import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { edit } from '@/routes/security';
import { disable, enable } from '@/routes/two-factor';

const underline = 'h-11 border-0 border-b border-border/60 rounded-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:border-primary shadow-none';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function Security({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    return (
        <>
            <Head title="Security settings" />

            <div className="space-y-12">
                <section className="space-y-8">
                    <div className="border-b border-border/60 pb-6">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ i</div>
                        <h2 className="font-display text-2xl tracking-tight text-foreground">Update password</h2>
                        <p className="mt-1 text-xs italic font-serif text-muted-foreground">Use a long, random password to keep your account secure.</p>
                    </div>

                    <Form
                        {...SecurityController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(formErrors) => {
                            if (formErrors.password) {
passwordInput.current?.focus();
}

                            if (formErrors.current_password) {
currentPasswordInput.current?.focus();
}
                        }}
                        className="flex flex-col gap-8"
                    >
                        {({ errors: formErrors, processing }) => (
                            <>
                                <Field label="Current password">
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className={underline}
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />
                                    <InputError message={formErrors.current_password} />
                                </Field>

                                <Field label="New password">
                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className={underline}
                                        autoComplete="new-password"
                                        placeholder="New password"
                                    />
                                    <InputError message={formErrors.password} />
                                </Field>

                                <Field label="Confirm password">
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className={underline}
                                        autoComplete="new-password"
                                        placeholder="Repeat"
                                    />
                                    <InputError message={formErrors.password_confirmation} />
                                </Field>

                                <div>
                                    <Button
                                        disabled={processing}
                                        variant="outline"
                                        data-test="update-password-button"
                                        className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-10 px-6"
                                    >
                                        {processing ? 'Saving…' : 'Save password'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                {canManageTwoFactor && (
                    <section className="space-y-8">
                        <div className="border-b border-border/60 pb-6">
                            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ ii</div>
                            <h2 className="font-display text-2xl tracking-tight text-foreground">Two-factor authentication</h2>
                            <p className="mt-1 text-xs italic font-serif text-muted-foreground">Manage your two-factor authentication settings.</p>
                        </div>

                        {twoFactorEnabled ? (
                            <div className="flex flex-col items-start gap-6">
                                <p className="text-sm italic font-serif text-muted-foreground leading-relaxed max-w-md">
                                    You will be prompted for a secure, random pin during login, retrievable from any TOTP-supported application on your device.
                                </p>

                                <div className="flex items-center gap-4">
                                    <Form {...disable.form()}>
                                        {({ processing: disabling }) => (
                                            <Button
                                                variant="outline"
                                                type="submit"
                                                disabled={disabling}
                                                className="rounded-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-colors h-10 px-6"
                                            >
                                                {disabling ? 'Disabling…' : 'Disable 2FA'}
                                            </Button>
                                        )}
                                    </Form>
                                </div>

                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={recoveryCodesList}
                                    fetchRecoveryCodes={fetchRecoveryCodes}
                                    errors={errors}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-6">
                                <p className="text-sm italic font-serif text-muted-foreground leading-relaxed max-w-md">
                                    When enabled, you will be prompted for a secure pin during each login. Retrieve it from a TOTP-supported application on your device.
                                </p>

                                <div>
                                    {hasSetupData ? (
                                        <Button
                                            onClick={() => setShowSetupModal(true)}
                                            variant="outline"
                                            className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-10 px-6 gap-2"
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Continue setup
                                        </Button>
                                    ) : (
                                        <Form
                                            {...enable.form()}
                                            onSuccess={() => setShowSetupModal(true)}
                                        >
                                            {({ processing: enabling }) => (
                                                <Button
                                                    type="submit"
                                                    disabled={enabling}
                                                    variant="outline"
                                                    className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors h-10 px-6"
                                                >
                                                    {enabling ? 'Enabling…' : 'Enable 2FA'}
                                                </Button>
                                            )}
                                        </Form>
                                    )}
                                </div>
                            </div>
                        )}

                        <TwoFactorSetupModal
                            isOpen={showSetupModal}
                            onClose={() => setShowSetupModal(false)}
                            requiresConfirmation={requiresConfirmation}
                            twoFactorEnabled={twoFactorEnabled}
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            clearSetupData={clearSetupData}
                            fetchSetupData={fetchSetupData}
                            errors={errors}
                        />
                    </section>
                )}
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

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
