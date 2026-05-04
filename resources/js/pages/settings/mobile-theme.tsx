import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Check,
    Gauge,
    Layers3,
    LoaderCircle,
    Map,
    Palette,
    PanelBottom,
    Route,
    Search,
    SlidersHorizontal,
    Smartphone,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ExperienceProfile = {
    category: string;
    dashboardLayout: string;
    navigation: string;
    cardTreatment: string;
    mapStyle: string;
    markerStyle: string;
    routeLine: string;
    backdrop: string;
    motion: string;
    glassIntensity: number;
    glow: number;
    mapContrast: number;
    routeStroke: number;
    density: number;
};

type MobileTheme = {
    key: string;
    name: string;
    description: string;
    background: string;
    foreground: string;
    card: string;
    muted: string;
    primary: string;
    border: string;
    success: string;
    warning: string;
    charts: string[];
    bodyFontFamily: string;
    displayFontFamily: string;
    monoFontFamily?: string;
    fullness?: number;
    bodyScale?: number;
    displayScale?: number;
    radiusScale?: number;
    iconScale?: number;
    experience?: ExperienceProfile;
};

type Props = {
    themeKey: string;
    themes: MobileTheme[];
};

const defaultExperience: ExperienceProfile = {
    category: 'Signature system',
    dashboardLayout: 'editorial',
    navigation: 'labeled-bar',
    cardTreatment: 'glass',
    mapStyle: 'dark',
    markerStyle: 'beacon',
    routeLine: 'glow',
    backdrop: 'cinematic',
    motion: 'calm',
    glassIntensity: 1,
    glow: 0.9,
    mapContrast: 1,
    routeStroke: 1,
    density: 0,
};

const previewModes = ['Dashboard', 'Map', 'Controls'] as const;

function experience(theme: MobileTheme): ExperienceProfile {
    return theme.experience ?? defaultExperience;
}

function densityLabel(value = 0) {
    if (value <= -0.2) return 'Compact';
    if (value >= 0.2) return 'Roomy';
    return 'Balanced';
}

function percent(value = 1) {
    return `${Math.round(value * 100)}%`;
}

function titleCase(value: string) {
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function radius(base: number, theme: MobileTheme) {
    return `${base * (theme.radiusScale ?? 1)}px`;
}

function spacing(base: number, theme: MobileTheme) {
    const fullness = theme.fullness ?? experience(theme).density ?? 0;

    return `${base * (1 + fullness * 0.12)}px`;
}

function fontSize(base: number, theme: MobileTheme, display = false) {
    return `${base * (display ? (theme.displayScale ?? 1) : (theme.bodyScale ?? 1))}px`;
}

function score(theme: MobileTheme) {
    const exp = experience(theme);

    return Math.round(
        (((theme.bodyScale ?? 1) +
            (theme.displayScale ?? 1) +
            (theme.radiusScale ?? 1) +
            (theme.iconScale ?? 1) +
            exp.glassIntensity +
            exp.glow +
            exp.mapContrast +
            exp.routeStroke) /
            8) *
            100,
    );
}

export default function MobileTheme({ themeKey, themes }: Props) {
    const [selectedKey, setSelectedKey] = useState(themeKey);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [previewMode, setPreviewMode] =
        useState<(typeof previewModes)[number]>('Dashboard');

    useEffect(() => {
        setSelectedKey(themeKey);
    }, [themeKey]);

    const selectedTheme = useMemo(
        () => themes.find((theme) => theme.key === selectedKey) ?? themes[0],
        [selectedKey, themes],
    );

    const categories = useMemo(() => {
        return [
            'All',
            ...Array.from(
                new Set(themes.map((theme) => experience(theme).category)),
            ),
        ];
    }, [themes]);

    const filteredThemes = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        return themes.filter((theme) => {
            const exp = experience(theme);
            const matchesCategory =
                category === 'All' || exp.category === category;
            const matchesQuery =
                normalized.length === 0 ||
                [
                    theme.name,
                    theme.description,
                    exp.category,
                    exp.dashboardLayout,
                    exp.navigation,
                    exp.cardTreatment,
                    exp.mapStyle,
                    exp.markerStyle,
                    exp.routeLine,
                    exp.backdrop,
                    exp.motion,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(normalized);

            return matchesCategory && matchesQuery;
        });
    }, [category, query, themes]);

    const selectTheme = (nextKey: string) => {
        if (nextKey === selectedKey || savingKey) {
            return;
        }

        setSelectedKey(nextKey);
        setSavingKey(nextKey);

        router.patch(
            '/settings/mobile-theme',
            { theme_key: nextKey },
            {
                preserveScroll: true,
                onError: () => setSelectedKey(themeKey),
                onFinish: () => setSavingKey(null),
            },
        );
    };

    return (
        <>
            <Head title="Mobile theme settings" />

            <div className="space-y-8">
                <div className="border-b border-border/60 pb-6">
                    <div className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.35em] text-muted-foreground uppercase">
                        <Palette className="size-3" />
                        Mobile
                    </div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="font-display text-3xl tracking-tight text-foreground">
                                Theme studio
                            </h2>
                            <p className="mt-2 max-w-2xl font-serif text-sm leading-relaxed text-muted-foreground italic">
                                Themes now control mobile color, type, density,
                                dashboard structure, card material, route map,
                                marker behavior, navigation and motion.
                            </p>
                        </div>
                        {selectedTheme && (
                            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 text-right">
                                <Meter
                                    label="System"
                                    value={score(selectedTheme)}
                                />
                                <Meter
                                    label="Glass"
                                    value={Math.round(
                                        experience(selectedTheme)
                                            .glassIntensity * 100,
                                    )}
                                />
                                <Meter
                                    label="Map"
                                    value={Math.round(
                                        experience(selectedTheme).mapContrast *
                                            100,
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {selectedTheme && (
                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-6">
                            <StudioHero
                                theme={selectedTheme}
                                saving={savingKey === selectedTheme.key}
                            />

                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Search layout, map, mood, palette..."
                                        className="h-11 w-full rounded-sm border border-border/70 bg-card/60 pr-3 pl-10 text-sm text-foreground transition outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setCategory(item)}
                                            className={cn(
                                                'h-11 rounded-sm border px-3 text-[10px] tracking-[0.22em] uppercase transition',
                                                category === item
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                                            )}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                                {filteredThemes.map((theme) => (
                                    <ThemeCard
                                        key={theme.key}
                                        theme={theme}
                                        selected={theme.key === selectedKey}
                                        saving={theme.key === savingKey}
                                        disabled={savingKey !== null}
                                        onSelect={() => selectTheme(theme.key)}
                                    />
                                ))}
                            </div>
                        </div>

                        <aside className="xl:sticky xl:top-8 xl:self-start">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs tracking-[0.22em] text-muted-foreground uppercase">
                                    <Smartphone className="size-3.5" />
                                    Preview
                                </div>
                                <div className="grid grid-cols-3 rounded-sm border border-border/70 p-0.5">
                                    {previewModes.map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setPreviewMode(mode)}
                                            className={cn(
                                                'h-7 px-2 text-[9px] tracking-[0.18em] uppercase transition',
                                                previewMode === mode
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <PhonePreview
                                theme={selectedTheme}
                                mode={previewMode}
                            />
                        </aside>
                    </section>
                )}
            </div>
        </>
    );
}

function Meter({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-card px-4 py-3">
            <div className="text-[9px] tracking-[0.22em] text-muted-foreground uppercase">
                {label}
            </div>
            <div className="font-display mt-1 text-2xl leading-none text-foreground">
                {value}
            </div>
        </div>
    );
}

function StudioHero({
    theme,
    saving,
}: {
    theme: MobileTheme;
    saving: boolean;
}) {
    const exp = experience(theme);
    const contract = [
        ['Dashboard', titleCase(exp.dashboardLayout), Layers3],
        ['Navigation', titleCase(exp.navigation), PanelBottom],
        ['Map', titleCase(exp.mapStyle), Map],
        ['Markers', titleCase(exp.markerStyle), Gauge],
        ['Route', titleCase(exp.routeLine), Route],
        ['Motion', titleCase(exp.motion), Activity],
    ] as const;

    return (
        <div
            className="overflow-hidden rounded-sm border border-border/70"
            style={{
                backgroundColor: theme.background,
                color: theme.foreground,
                borderColor: theme.border,
                fontFamily: theme.bodyFontFamily,
            }}
        >
            <div className="grid gap-px bg-black/30 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="bg-background/10 p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <div
                                className="mb-3 text-[10px] tracking-[0.3em] uppercase"
                                style={{ color: theme.primary }}
                            >
                                {exp.category}
                            </div>
                            <h3
                                className="leading-none tracking-tight"
                                style={{
                                    fontFamily: theme.displayFontFamily,
                                    fontSize: fontSize(40, theme, true),
                                }}
                            >
                                {theme.name}
                            </h3>
                            <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-75">
                                {theme.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] tracking-[0.22em] uppercase">
                            {saving ? (
                                <LoaderCircle className="size-3 animate-spin" />
                            ) : (
                                <Check className="size-3" />
                            )}
                            Active
                        </div>
                    </div>

                    <div className="mt-8 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {contract.map(([label, value, Icon]) => (
                            <div
                                key={label}
                                className="rounded-sm border p-3"
                                style={{
                                    borderColor: theme.border,
                                    backgroundColor: theme.card,
                                    borderRadius: radius(6, theme),
                                }}
                            >
                                <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] uppercase opacity-60">
                                    <Icon className="size-3" />
                                    {label}
                                </div>
                                <div className="mt-2 truncate text-sm">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    className="flex flex-col justify-between gap-6 bg-background/10 p-5 md:p-6"
                    style={{ backgroundColor: theme.card }}
                >
                    <div>
                        <div className="text-[10px] tracking-[0.28em] uppercase opacity-55">
                            Materials
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {[
                                theme.primary,
                                theme.success,
                                theme.warning,
                                ...theme.charts,
                            ].map((color, index) => (
                                <span
                                    key={`${theme.key}-${color}-${index}`}
                                    className="size-8 rounded-full border shadow-sm"
                                    style={{
                                        backgroundColor: color,
                                        borderColor: theme.border,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border bg-black/20 text-sm">
                        <Spec
                            label="Density"
                            value={densityLabel(exp.density)}
                        />
                        <Spec
                            label="Cards"
                            value={titleCase(exp.cardTreatment)}
                        />
                        <Spec
                            label="Backdrop"
                            value={titleCase(exp.backdrop)}
                        />
                        <Spec label="Route" value={percent(exp.routeStroke)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Spec({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-background/20 px-3 py-3">
            <div className="text-[9px] tracking-[0.2em] uppercase opacity-50">
                {label}
            </div>
            <div className="mt-1 truncate">{value}</div>
        </div>
    );
}

function ThemeCard({
    theme,
    selected,
    saving,
    disabled,
    onSelect,
}: {
    theme: MobileTheme;
    selected: boolean;
    saving: boolean;
    disabled: boolean;
    onSelect: () => void;
}) {
    const exp = experience(theme);

    return (
        <button
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={onSelect}
            className={cn(
                'group overflow-hidden rounded-sm border bg-card text-left transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                'disabled:cursor-wait disabled:opacity-75',
                selected
                    ? 'border-primary shadow-sm'
                    : 'border-border/70 hover:border-primary/50',
            )}
            style={{ borderRadius: radius(8, theme) }}
        >
            <div
                className="border-b p-3"
                style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.foreground,
                    fontFamily: theme.bodyFontFamily,
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-[9px] tracking-[0.22em] uppercase opacity-60">
                            {exp.category}
                        </div>
                        <div
                            className="mt-2 truncate leading-none tracking-tight"
                            style={{
                                fontFamily: theme.displayFontFamily,
                                fontSize: fontSize(20, theme, true),
                            }}
                        >
                            {theme.name}
                        </div>
                    </div>
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-full border"
                        style={{
                            borderColor: theme.border,
                            backgroundColor: theme.card,
                        }}
                    >
                        {saving ? (
                            <LoaderCircle className="size-3 animate-spin" />
                        ) : selected ? (
                            <Check className="size-3" />
                        ) : null}
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                    {[
                        theme.primary,
                        theme.success,
                        theme.warning,
                        ...theme.charts.slice(0, 4),
                    ].map((color, index) => (
                        <span
                            key={`${theme.key}-chip-${color}-${index}`}
                            className="h-1.5 flex-1 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-3 p-3">
                <p className="line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                    {theme.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <MiniSpec
                        icon={Layers3}
                        label={titleCase(exp.dashboardLayout)}
                    />
                    <MiniSpec icon={Map} label={titleCase(exp.mapStyle)} />
                    <MiniSpec
                        icon={PanelBottom}
                        label={titleCase(exp.navigation)}
                    />
                    <MiniSpec
                        icon={SlidersHorizontal}
                        label={densityLabel(exp.density)}
                    />
                </div>
            </div>
        </button>
    );
}

function MiniSpec({
    icon: Icon,
    label,
}: {
    icon: typeof Layers3;
    label: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2 rounded-sm border border-border/50 px-2 py-1.5 text-muted-foreground">
            <Icon className="size-3 shrink-0" />
            <span className="truncate">{label}</span>
        </div>
    );
}

function PhonePreview({
    theme,
    mode,
}: {
    theme: MobileTheme;
    mode: (typeof previewModes)[number];
}) {
    const exp = experience(theme);

    return (
        <div
            className="rounded-[2rem] border p-3 shadow-xl"
            style={{
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.foreground,
                borderRadius: radius(32, theme),
                fontFamily: theme.bodyFontFamily,
            }}
        >
            <div
                className="overflow-hidden border"
                style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    borderRadius: radius(24, theme),
                }}
            >
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[10px] font-medium">9:41</span>
                    <span
                        className="h-1.5 w-16 rounded-full"
                        style={{ backgroundColor: theme.border }}
                    />
                </div>

                <div
                    className="px-4 pb-4"
                    style={{
                        display: 'grid',
                        gap: spacing(12, theme),
                    }}
                >
                    {mode === 'Dashboard' && <DashboardPreview theme={theme} />}
                    {mode === 'Map' && <MapPreview theme={theme} />}
                    {mode === 'Controls' && <ControlsPreview theme={theme} />}

                    <div
                        className={cn(
                            'grid gap-2 text-center text-[10px]',
                            exp.navigation === 'compact-dock'
                                ? 'grid-cols-4'
                                : 'grid-cols-3',
                        )}
                    >
                        {['Dash', 'Route', 'Msg', 'Me']
                            .slice(0, exp.navigation === 'compact-dock' ? 4 : 3)
                            .map((item, index) => (
                                <div
                                    key={item}
                                    className="border py-2"
                                    style={{
                                        borderColor: theme.border,
                                        borderRadius: radius(
                                            exp.navigation === 'compact-dock'
                                                ? 999
                                                : 8,
                                            theme,
                                        ),
                                        backgroundColor:
                                            index === 0
                                                ? theme.primary
                                                : theme.card,
                                        color:
                                            index === 0
                                                ? theme.background
                                                : theme.foreground,
                                    }}
                                >
                                    {exp.navigation === 'compact-dock'
                                        ? item.charAt(0)
                                        : item}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardPreview({ theme }: { theme: MobileTheme }) {
    const exp = experience(theme);

    if (exp.dashboardLayout === 'ledger') {
        return (
            <div className="space-y-2">
                <PreviewTitle theme={theme} label="Manifest" title="Today" />
                {[
                    ['Routes', '14'],
                    ['Stops', '86'],
                    ['On time', '92%'],
                    ['Distance', '311'],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between border px-3 py-2"
                        style={{
                            borderColor: theme.border,
                            backgroundColor: theme.card,
                            borderRadius: radius(6, theme),
                        }}
                    >
                        <span className="text-[10px] tracking-[0.18em] uppercase opacity-60">
                            {label}
                        </span>
                        <span className="font-display text-xl">{value}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {exp.dashboardLayout === 'radar' && <MiniRouteMap theme={theme} />}
            <PreviewTitle
                theme={theme}
                label={titleCase(exp.dashboardLayout)}
                title={theme.name}
            />
            <div
                className="border"
                style={{
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                    borderRadius: radius(12, theme),
                    padding: spacing(12, theme),
                }}
            >
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs">Route progress</span>
                    <span
                        className="text-[10px]"
                        style={{ color: theme.primary }}
                    >
                        68%
                    </span>
                </div>
                <div
                    className="h-2 overflow-hidden"
                    style={{
                        backgroundColor: theme.muted,
                        borderRadius: radius(999, theme),
                    }}
                >
                    <div
                        className="h-full w-2/3"
                        style={{
                            backgroundColor: theme.primary,
                            borderRadius: radius(999, theme),
                        }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <MetricTile theme={theme} label="Stops" value="12" />
                <MetricTile
                    theme={theme}
                    label="On time"
                    value="8"
                    color={theme.success}
                />
            </div>
        </div>
    );
}

function MapPreview({ theme }: { theme: MobileTheme }) {
    const exp = experience(theme);

    return (
        <div className="space-y-3">
            <PreviewTitle
                theme={theme}
                label={titleCase(exp.mapStyle)}
                title="Route surface"
            />
            <MiniRouteMap theme={theme} large />
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <MetricTile
                    theme={theme}
                    label="Markers"
                    value={titleCase(exp.markerStyle)}
                />
                <MetricTile
                    theme={theme}
                    label="Line"
                    value={titleCase(exp.routeLine)}
                />
            </div>
        </div>
    );
}

function ControlsPreview({ theme }: { theme: MobileTheme }) {
    const exp = experience(theme);

    return (
        <div className="space-y-3">
            <PreviewTitle
                theme={theme}
                label={titleCase(exp.cardTreatment)}
                title="Controls"
            />
            {['Accept route', 'Navigate', 'Proof of delivery'].map(
                (label, index) => (
                    <div
                        key={label}
                        className="flex items-center justify-between border px-3 py-3"
                        style={{
                            borderColor:
                                index === 0 ? theme.primary : theme.border,
                            backgroundColor:
                                index === 0 ? theme.primary : theme.card,
                            color:
                                index === 0
                                    ? theme.background
                                    : theme.foreground,
                            borderRadius: radius(
                                exp.cardTreatment === 'brutalist' ? 2 : 10,
                                theme,
                            ),
                        }}
                    >
                        <span className="text-xs">{label}</span>
                        <span className="text-[10px] tracking-[0.2em] uppercase">
                            {index === 0 ? 'Primary' : 'Action'}
                        </span>
                    </div>
                ),
            )}
        </div>
    );
}

function PreviewTitle({
    theme,
    label,
    title,
}: {
    theme: MobileTheme;
    label: string;
    title: string;
}) {
    return (
        <div>
            <div
                className="text-[10px] tracking-[0.22em] uppercase"
                style={{ color: theme.primary }}
            >
                {label}
            </div>
            <div
                className="mt-1 leading-none"
                style={{
                    fontFamily: theme.displayFontFamily,
                    fontSize: fontSize(24, theme, true),
                }}
            >
                {title}
            </div>
        </div>
    );
}

function MetricTile({
    theme,
    label,
    value,
    color,
}: {
    theme: MobileTheme;
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div
            className="min-w-0 border"
            style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
                borderRadius: radius(8, theme),
                padding: spacing(8, theme),
            }}
        >
            <div className="truncate text-[10px] opacity-70">{label}</div>
            <div className="mt-1 truncate text-lg" style={{ color }}>
                {value}
            </div>
        </div>
    );
}

function MiniRouteMap({
    theme,
    large = false,
}: {
    theme: MobileTheme;
    large?: boolean;
}) {
    const exp = experience(theme);

    return (
        <div
            className="relative overflow-hidden border"
            style={{
                height: large ? 160 : 96,
                borderColor: theme.border,
                backgroundColor: theme.muted,
                borderRadius: radius(14, theme),
            }}
        >
            {exp.mapStyle === 'satellite' && (
                <>
                    <span
                        className="absolute top-4 right-7 h-16 w-24 rounded-full opacity-30"
                        style={{ backgroundColor: theme.success }}
                    />
                    <span
                        className="absolute bottom-5 left-5 h-12 w-20 rounded-full opacity-25"
                        style={{ backgroundColor: theme.warning }}
                    />
                </>
            )}
            {exp.backdrop === 'grid' && (
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                    }}
                />
            )}
            <svg
                viewBox="0 0 220 96"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
            >
                <path
                    d="M8 76 C48 10 78 90 118 42 C150 4 176 58 212 18"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth={exp.routeLine === 'thread' ? 2 : 5}
                    strokeLinecap="round"
                    opacity={0.22 * exp.glow}
                    style={{
                        filter:
                            exp.routeLine === 'neon' ? 'blur(5px)' : undefined,
                    }}
                />
                <path
                    d="M8 76 C48 10 78 90 118 42 C150 4 176 58 212 18"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth={exp.routeLine === 'thread' ? 1.5 : 3}
                    strokeLinecap="round"
                />
                {[28, 92, 145, 194].map((x, index) => (
                    <circle
                        key={x}
                        cx={x}
                        cy={[48, 65, 25, 31][index]}
                        r={exp.markerStyle === 'pulse' ? 5 : 4}
                        fill={index === 0 ? theme.foreground : theme.card}
                        stroke={theme.primary}
                        strokeWidth="2"
                    />
                ))}
            </svg>
        </div>
    );
}

MobileTheme.layout = {
    breadcrumbs: [
        {
            title: 'Mobile theme settings',
            href: '/settings/mobile-theme',
        },
    ],
};
