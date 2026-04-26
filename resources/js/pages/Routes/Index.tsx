import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Eye, ChevronDown, Filter, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import type { DispatchRoute, Paginated, PaginationLink, RouteStatus } from '@/types';

interface Driver {
    assignment_id: number;
    driver_id: number;
    name: string;
    email: string;
    vehicle_index: number;
    color: string;
    status: string;
    num_stops: number;
    total_distance: number;
}

interface DispatchRouteExtended extends DispatchRoute {
    total_stops?: number;
    total_distance?: number;
    assignments_count?: number;
    completed_count?: number;
    in_progress_count?: number;
    pending_count?: number;
    algorithm?: string;
    dispatched_at?: string;
    created_at?: string;
    drivers?: Driver[];
}

interface IndexProps {
    routes: Paginated<DispatchRouteExtended>;
    filters: Record<string, string>;
    availableFilters?: {
        status: string[];
        algorithms: string[];
    };
}

function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

const statusCopy: Record<RouteStatus, { label: string; mark: string; tone: string; badge: string }> = {
    pending:     { label: 'Pending',     mark: '○', tone: 'text-amber-400/90',   badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    in_progress: { label: 'In progress', mark: '◐', tone: 'text-sky-400/90',     badge: 'bg-sky-500/15 text-sky-500 border-sky-500/30' },
    completed:   { label: 'Completed',   mark: '●', tone: 'text-emerald-400/90', badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
};

const assignmentStatusBadge: Record<string, string> = {
    pending:     'bg-amber-500/15 text-amber-500',
    accepted:    'bg-blue-500/15 text-blue-500',
    in_progress: 'bg-sky-500/15 text-sky-500',
    completed:   'bg-emerald-500/15 text-emerald-500',
};

const assignmentStatusLabel: Record<string, string> = {
    pending:     'Pending',
    accepted:    'Accepted',
    in_progress: 'In Progress',
    completed:   'Completed',
};

function buildParams(opts: {
    statusFilter: string;
    nameSearch: string;
    sortBy: string;
    algorithmFilter: string;
    driverFilter: string;
    dateFrom: string;
    dateTo: string;
}): Record<string, string> {
    const params: Record<string, string> = {};

    if (opts.statusFilter)    {
params['filter[status]']    = opts.statusFilter;
}

    if (opts.nameSearch)      {
params['filter[name]']      = opts.nameSearch;
}

    if (opts.algorithmFilter) {
params['filter[algorithm]'] = opts.algorithmFilter;
}

    if (opts.driverFilter)    {
params['filter[driver]']    = opts.driverFilter;
}

    if (opts.dateFrom)        {
params['filter[date_from]'] = opts.dateFrom;
}

    if (opts.dateTo)          {
params['filter[date_to]']   = opts.dateTo;
}

    if (opts.sortBy)          {
params.sort                 = opts.sortBy;
}

    return params;
}

export default function Index({ routes, filters: _filters, availableFilters }: IndexProps) {
    const [expanded, setExpanded]             = useState<number | null>(null);
    const [showFilters, setShowFilters]       = useState(false);
    const [statusFilter, setStatusFilter]     = useState(_filters?.['filter[status]']    || '');
    const [nameSearch, setNameSearch]         = useState(_filters?.['filter[name]']      || '');
    const [sortBy, setSortBy]                 = useState(_filters?.sort                  || '-created_at');
    const [algorithmFilter, setAlgorithmFilter] = useState(_filters?.['filter[algorithm]'] || '');
    const [driverFilter, setDriverFilter]     = useState(_filters?.['filter[driver]']    || '');
    const [dateFrom, setDateFrom]             = useState(_filters?.['filter[date_from]'] || '');
    const [dateTo, setDateTo]                 = useState(_filters?.['filter[date_to]']   || '');

    const pending    = routes.data.filter(r => r.status === 'pending').length;
    const inProgress = routes.data.filter(r => r.status === 'in_progress').length;
    const completed  = routes.data.filter(r => r.status === 'completed').length;

    const hasActiveFilters = !!(statusFilter || nameSearch || algorithmFilter || driverFilter || dateFrom || dateTo || sortBy !== '-created_at');

    const applyFilters = useCallback(() => {
        router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy, algorithmFilter, driverFilter, dateFrom, dateTo }));
        setShowFilters(false);
    }, [statusFilter, nameSearch, sortBy, algorithmFilter, driverFilter, dateFrom, dateTo]);

    const clearFilters = useCallback(() => {
        setStatusFilter('');
        setNameSearch('');
        setSortBy('-created_at');
        setAlgorithmFilter('');
        setDriverFilter('');
        setDateFrom('');
        setDateTo('');
        router.get('/routes');
        setShowFilters(false);
    }, []);

    // Compute new sort direction inline to avoid stale-closure issues
    const handleColumnSort = useCallback((field: string) => {
        const newSort = sortBy === field ? `-${field}` : (sortBy === `-${field}` ? field : field);
        setSortBy(newSort);
        router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy: newSort, algorithmFilter, driverFilter, dateFrom, dateTo }));
    }, [sortBy, statusFilter, nameSearch, algorithmFilter, driverFilter, dateFrom, dateTo]);

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy === field)    {
return <ArrowUp className="size-3 text-primary" />;
}

        if (sortBy === `-${field}`) {
return <ArrowDown className="size-3 text-primary" />;
}

        return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Routes', href: null as any }]}>
            <Head title="Routes" />

            {/* Masthead */}
            <motion.section
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="px-8 md:px-12 pt-14 pb-10"
            >
                <div className="flex items-end justify-between gap-8 border-b border-border/60 pb-8">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                            <span className="h-px w-8 bg-primary/60" />
                            <span>The atlas · Vol. III</span>
                        </div>
                        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
                            Routes, charted.
                        </h1>
                        <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                            Plan and observe every dispatch — a study of movement across the fleet.
                        </p>
                    </div>
                    <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 hover:bg-foreground hover:text-background transition-colors">
                        <Link href="/routes/create">
                            <Plus className="size-4" />
                            New route
                        </Link>
                    </Button>
                </div>
            </motion.section>

            {/* Figures */}
            <section className="px-8 md:px-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-border/60 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                    <Figure label="Pending"     value={pending}    note="awaiting departure" />
                    <Figure label="In progress" value={inProgress} note="currently in motion" />
                    <Figure label="Completed"   value={completed}  note="concluded today" />
                </div>
            </section>

            {/* Filters Panel */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="px-8 md:px-12 mt-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className={cn(
                                "rounded-full border-border/80",
                                showFilters && "bg-primary/10 border-primary/40"
                            )}
                        >
                            <Filter className="size-4 mr-2" />
                            Filters & Sort
                            {hasActiveFilters && (
                                <span className="ml-2 flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                                    {[statusFilter, nameSearch, algorithmFilter, driverFilter, dateFrom, dateTo, sortBy !== '-created_at' ? '1' : ''].filter(Boolean).length}
                                </span>
                            )}
                        </Button>

                        {/* Active filter chips */}
                        <div className="flex flex-wrap gap-2">
                            {statusFilter && (
                                <Chip label={`Status: ${statusFilter.replace('_', ' ')}`} onRemove={() => {
 setStatusFilter(''); router.get('/routes', buildParams({ statusFilter: '', nameSearch, sortBy, algorithmFilter, driverFilter, dateFrom, dateTo })); 
}} />
                            )}
                            {algorithmFilter && (
                                <Chip label={`Algorithm: ${algorithmFilter}`} onRemove={() => {
 setAlgorithmFilter(''); router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy, algorithmFilter: '', driverFilter, dateFrom, dateTo })); 
}} />
                            )}
                            {driverFilter && (
                                <Chip label={`Driver: ${driverFilter}`} onRemove={() => {
 setDriverFilter(''); router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy, algorithmFilter, driverFilter: '', dateFrom, dateTo })); 
}} />
                            )}
                            {dateFrom && (
                                <Chip label={`From: ${dateFrom}`} onRemove={() => {
 setDateFrom(''); router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy, algorithmFilter, driverFilter, dateFrom: '', dateTo })); 
}} />
                            )}
                            {dateTo && (
                                <Chip label={`To: ${dateTo}`} onRemove={() => {
 setDateTo(''); router.get('/routes', buildParams({ statusFilter, nameSearch, sortBy, algorithmFilter, driverFilter, dateFrom, dateTo: '' })); 
}} />
                            )}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <Button onClick={clearFilters} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <X className="size-3.5 mr-2" />
                            Clear all
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-6 border border-border/60 rounded-2xl bg-card/40 space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Status */}
                            <FilterField label="Status">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </FilterField>

                            {/* Route name */}
                            <FilterField label="Route Name">
                                <input
                                    type="text"
                                    value={nameSearch}
                                    onChange={e => setNameSearch(e.target.value)}
                                    placeholder="Search routes…"
                                    className="filter-input"
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                />
                            </FilterField>

                            {/* Algorithm */}
                            <FilterField label="Algorithm">
                                <select
                                    value={algorithmFilter}
                                    onChange={e => setAlgorithmFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All algorithms</option>
                                    {(availableFilters?.algorithms ?? []).map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </FilterField>

                            {/* Driver */}
                            <FilterField label="Driver Name">
                                <input
                                    type="text"
                                    value={driverFilter}
                                    onChange={e => setDriverFilter(e.target.value)}
                                    placeholder="Search driver…"
                                    className="filter-input"
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                />
                            </FilterField>

                            {/* Date from */}
                            <FilterField label="Dispatched From">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="filter-input"
                                />
                            </FilterField>

                            {/* Date to */}
                            <FilterField label="Dispatched To">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="filter-input"
                                />
                            </FilterField>

                            {/* Sort */}
                            <FilterField label="Sort By">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="-created_at">Newest First</option>
                                    <option value="created_at">Oldest First</option>
                                    <option value="name">Name A → Z</option>
                                    <option value="-name">Name Z → A</option>
                                    <option value="status">Status A → Z</option>
                                    <option value="-status">Status Z → A</option>
                                    <option value="-updated_at">Recently Updated</option>
                                    <option value="updated_at">Least Recently Updated</option>
                                </select>
                            </FilterField>
                        </div>

                        <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                            <Button onClick={applyFilters} variant="default" className="rounded-full">
                                Apply Filters
                            </Button>
                            <Button onClick={() => setShowFilters(false)} variant="outline" className="rounded-full">
                                Close
                            </Button>
                            {hasActiveFilters && (
                                <Button onClick={clearFilters} variant="ghost" size="sm" className="ml-auto text-muted-foreground">
                                    <X className="size-3.5 mr-1" />
                                    Reset all
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.section>

            {/* Ledger */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-8 md:px-12 pb-16"
            >
                <div className="flex items-end justify-between gap-6 mb-6 mt-6">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-2">Ledger</div>
                        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">Dispatched routes</h2>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="h-px w-12 bg-border" />
                        <span className="italic font-serif">Updated continuously</span>
                    </span>
                </div>

                <div className="rounded-2xl border border-border/60 overflow-hidden">
                    {routes.data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/60 bg-card/20">
                                    <th className="px-3 py-4 w-8" />
                                    <th
                                        className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] cursor-pointer hover:text-foreground transition-colors"
                                        onClick={() => handleColumnSort('name')}
                                    >
                                        <div className="flex items-center gap-2">Route <SortIcon field="name" /></div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] cursor-pointer hover:text-foreground transition-colors"
                                        onClick={() => handleColumnSort('status')}
                                    >
                                        <div className="flex items-center gap-2">Status <SortIcon field="status" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] hidden md:table-cell">Drivers</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] hidden lg:table-cell">Progress</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] hidden lg:table-cell">Stops / Dist</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] hidden xl:table-cell">Algorithm</th>
                                    <th
                                        className="px-6 py-4 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em] cursor-pointer hover:text-foreground transition-colors hidden md:table-cell"
                                        onClick={() => handleColumnSort('created_at')}
                                    >
                                        <div className="flex items-center gap-2">Dispatched <SortIcon field="created_at" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-[0.25em]">—</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routes.data.map((route, i) => {
                                    const s = statusCopy[route.status] ?? statusCopy.pending;
                                    const isExpanded = expanded === route.id;
                                    const hasDrivers = (route.drivers?.length ?? 0) > 0;
                                    const completionPct = route.assignments_count
                                        ? Math.round((route.completed_count ?? 0) / route.assignments_count * 100)
                                        : 0;

                                    return (
                                        <React.Fragment key={route.id}>
                                            <tr
                                                className={cn(
                                                    'group transition-colors hover:bg-card/40',
                                                    i !== 0 && 'border-t border-border/60',
                                                    isExpanded && 'bg-card/20'
                                                )}
                                            >
                                                <td className="px-3 py-5">
                                                    {hasDrivers && (
                                                        <button
                                                            onClick={() => setExpanded(isExpanded ? null : route.id)}
                                                            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <ChevronDown className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="font-display text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                                        <div>
                                                            <span className="font-display text-lg text-foreground">{route.name}</span>
                                                            {route.description && (
                                                                <p className="text-xs text-muted-foreground/70 mt-0.5 italic font-serif max-w-[200px] truncate">{route.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
                                                        s.badge
                                                    )}>
                                                        <span className="text-sm leading-none">{s.mark}</span>
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell">
                                                    {hasDrivers ? (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {route.drivers!.slice(0, 3).map(d => (
                                                                <span
                                                                    key={d.assignment_id}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                                                                    style={{ borderColor: d.color + '60', color: d.color, backgroundColor: d.color + '15' }}
                                                                    title={`${d.name} · Vehicle ${d.vehicle_index}`}
                                                                >
                                                                    <span className="size-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                                    {d.name.split(' ')[0]}
                                                                </span>
                                                            ))}
                                                            {(route.drivers?.length ?? 0) > 3 && (
                                                                <span className="text-[10px] text-muted-foreground">+{(route.drivers?.length ?? 0) - 3} more</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50">Not dispatched</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 hidden lg:table-cell">
                                                    {(route.assignments_count ?? 0) > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden min-w-[60px]">
                                                                <div
                                                                    className={cn(
                                                                        'h-full rounded-full transition-all',
                                                                        completionPct === 100 ? 'bg-emerald-500' : completionPct > 0 ? 'bg-sky-500' : 'bg-amber-500/50'
                                                                    )}
                                                                    style={{ width: `${completionPct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                                                {route.completed_count}/{route.assignments_count}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 hidden lg:table-cell">
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-medium text-foreground">{route.total_stops ?? 0}</span> stops
                                                        <span className="mx-1.5 text-border">·</span>
                                                        <span className="font-medium text-foreground">{route.total_distance?.toFixed(1) ?? '0'}</span> km
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden xl:table-cell">
                                                    {route.algorithm ? (
                                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                                                            {route.algorithm}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell">
                                                    <span className="text-xs text-muted-foreground">
                                                        {route.dispatched_at
                                                            ? new Date(route.dispatched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                            : new Date(route.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground hover:text-primary">
                                                            <Link href={`/routes/${route.id}`}>
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild className="size-8">
                                                            <Link href={`/routes/${route.id}/edit`}>
                                                                <Pencil className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground hover:text-destructive">
                                                            <Link href={`/routes/${route.id}`} method="delete" as="button">
                                                                <Trash2 className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded dispatch details */}
                                            {isExpanded && hasDrivers && (
                                                <tr className="border-t border-border/40 bg-card/10">
                                                    <td colSpan={9} className="px-6 py-5">
                                                        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4 font-medium">
                                                            Dispatch Breakdown — {route.assignments_count} Vehicle{route.assignments_count !== 1 ? 's' : ''}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                            {route.drivers!.map(driver => (
                                                                <DriverCard key={driver.assignment_id} driver={driver} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {routes.links && routes.links.length > 3 && (
                    <div className="flex justify-center gap-1 mt-8">
                        {routes.links.map((link: PaginationLink, index: number) =>
                            link.url ? (
                                <Button key={index} variant={link.active ? 'default' : 'ghost'} size="sm" className="h-9 min-w-9 px-3 text-xs rounded-full" asChild>
                                    <Link href={link.url}>{decodePaginationLabel(link.label)}</Link>
                                </Button>
                            ) : (
                                <Button key={index} variant="ghost" size="sm" className="h-9 min-w-9 px-3 text-xs opacity-40 rounded-full" disabled>
                                    {decodePaginationLabel(link.label)}
                                </Button>
                            )
                        )}
                    </div>
                )}
            </motion.section>

            <style>{`
                .filter-select, .filter-input {
                    width: 100%;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid hsl(var(--border) / 0.6);
                    background: hsl(var(--background));
                    color: hsl(var(--foreground));
                    font-size: 0.875rem;
                    outline: none;
                }
                .filter-select:focus, .filter-input:focus {
                    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
                }
                .filter-input::placeholder { color: hsl(var(--muted-foreground) / 0.5); }
                .filter-select option { background: hsl(var(--background)); }
            `}</style>
        </AppLayout>
    );
}

function DriverCard({ driver }: { driver: Driver }) {
    const badge = assignmentStatusBadge[driver.status] ?? 'bg-gray-500/15 text-gray-500';
    const label = assignmentStatusLabel[driver.status] ?? driver.status;

    return (
        <div className="p-4 bg-background/50 rounded-xl border border-border/40 space-y-3">
            {/* Color bar + vehicle badge */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: driver.color }} />
                    <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{driver.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{driver.email}</p>
                    </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${badge}`}>
                    {label}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                <StatMini label="Vehicle" value={`V${driver.vehicle_index}`} />
                <StatMini label="Stops" value={String(driver.num_stops)} />
                <StatMini label="Dist" value={`${driver.total_distance?.toFixed(1) ?? '—'} km`} />
            </div>
        </div>
    );
}

function StatMini({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
        </div>
    );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/60 bg-card/60 text-[10px] text-muted-foreground">
            {label}
            <button onClick={onRemove} className="hover:text-foreground transition-colors ml-0.5">
                <X className="size-3" />
            </button>
        </span>
    );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] mb-2">
                {label}
            </label>
            {children}
        </div>
    );
}

function Figure({ label, value, note }: { label: string; value: number; note: string }) {
    return (
        <div className="p-7 hover:bg-card/40 transition-colors">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
            <div className="mt-6 font-display text-6xl leading-none tracking-tight text-foreground tabular-nums">{value}</div>
            <div className="mt-5 flex items-center gap-3 text-[11px]">
                <span className="h-px flex-1 bg-border/60" />
                <span className="italic font-serif text-muted-foreground">{note}</span>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="font-display text-4xl text-foreground">Nothing dispatched yet.</div>
            <div className="italic font-serif text-sm text-muted-foreground">Plot the first route to set the fleet in motion.</div>
            <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href="/routes/create">
                    <Plus className="size-4" />
                    New route
                </Link>
            </Button>
        </div>
    );
}
