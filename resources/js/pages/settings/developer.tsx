import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    testDriverQuickLogin: boolean;
};

export default function Developer({ testDriverQuickLogin }: Props) {
    const [enabled, setEnabled] = useState(testDriverQuickLogin);
    const [saving, setSaving] = useState(false);

    const toggle = (next: boolean) => {
        setEnabled(next);
        setSaving(true);
        router.patch('/settings/developer', { test_driver_quick_login: next }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="Developer settings" />

            <div className="space-y-10">
                <div className="border-b border-border/60 pb-6">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ i</div>
                    <h2 className="font-display text-2xl tracking-tight text-foreground">Developer</h2>
                    <p className="mt-1 text-xs italic font-serif text-muted-foreground">
                        Tools for development and testing. Disable before going to production.
                    </p>
                </div>

                <div className="flex items-start justify-between gap-8">
                    <div className="space-y-1">
                        <p className="text-sm font-display tracking-tight text-foreground">
                            Test driver quick login
                        </p>
                        <p className="text-xs font-serif italic text-muted-foreground leading-relaxed max-w-xs">
                            Shows a one-tap button on the mobile login screen that signs in as{' '}
                            <span className="font-mono text-[11px]">driver@test.com</span>.
                        </p>
                    </div>

                    <button
                        role="switch"
                        aria-checked={enabled}
                        disabled={saving}
                        onClick={() => toggle(!enabled)}
                        className={[
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            enabled ? 'bg-primary' : 'bg-muted',
                        ].join(' ')}
                    >
                        <span className={[
                            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                            enabled ? 'translate-x-5' : 'translate-x-0',
                        ].join(' ')} />
                    </button>
                </div>
            </div>
        </>
    );
}

Developer.layout = {
    breadcrumbs: [
        {
            title: 'Developer settings',
            href: '/settings/developer',
        },
    ],
};
