import { Head } from '@inertiajs/react';
import OptimizationHistory from '@/components/optimization-history';

type OptimizationRecord = {
    id: number;
    instance: string;
    k: number;
    algorithm: string;
    num_routes: number;
    total_distance: number | null;
    distance_std: number | null;
    elapsed: number | null;
    valid: boolean;
    issues: string | null;
    result: any;
    created_at: string;
};

type PageProps = {
    history: OptimizationRecord[];
};

export default function OptimizeHistoryPage({ history = [] }: PageProps) {
    return (
        <>
            <Head title="Optimization History" />
            <div
                className="-mt-6 -mb-6 w-full overflow-y-auto bg-background"
                style={{ height: 'calc(100vh - 57px)' }}
            >
                <div className="mx-auto w-full max-w-310 pl-36 pr-10 md:pr-16 py-12">
                    <OptimizationHistory records={history} />
                </div>
            </div>
        </>
    );
}
