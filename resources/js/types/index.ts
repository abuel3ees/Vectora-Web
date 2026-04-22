export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type Role = {
    id: number;
    name: string;
    guard_name: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    roles: Role[];
};

export type RouteStatus = 'pending' | 'in_progress' | 'completed';

export type DispatchRoute = {
    id: number;
    name: string;
    status: RouteStatus;
    description: string | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    meta?: Record<string, unknown>;
};
