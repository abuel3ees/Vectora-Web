import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <div className="space-y-8">
                <div className="border-b border-border/60 pb-6">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-2">§ i</div>
                    <h2 className="font-display text-2xl tracking-tight text-foreground">Appearance</h2>
                    <p className="mt-1 text-xs italic font-serif text-muted-foreground">Choose your preferred visual scheme.</p>
                </div>

                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
