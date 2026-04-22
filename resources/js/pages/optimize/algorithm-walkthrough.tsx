import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import QAOAVisualization from '@/components/qaoa-visualization';

export default function AlgorithmWalkthroughPage() {
    return (
        <>
            <Head title="Algorithm Walkthrough" />
            <div className="space-y-8">
                <Heading
                    title="Algorithm Walkthrough"
                    description="Step-by-step visualization of the recursive divide-and-conquer QAOA VRP solver"
                />
                <QAOAVisualization />
            </div>
        </>
    );
}
