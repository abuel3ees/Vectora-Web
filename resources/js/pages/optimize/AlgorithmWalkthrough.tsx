import { Head } from '@inertiajs/react';
import QAOAVisualization from '@/components/qaoa-visualization';

export default function AlgorithmWalkthroughPage() {
    return (
        <>
            <Head title="Algorithm Walkthrough" />
            <div
                className="-mt-6 -mb-6 w-full overflow-hidden bg-background"
                style={{ height: 'calc(100vh - 57px)' }}
            >
                <QAOAVisualization />
            </div>
        </>
    );
}
