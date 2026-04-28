import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
export const liveLocations = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: liveLocations.url(options),
    method: 'get',
})

liveLocations.definition = {
    methods: ["get","head"],
    url: '/dashboard/live-locations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
liveLocations.url = (options?: RouteQueryOptions) => {
    return liveLocations.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
liveLocations.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
liveLocations.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: liveLocations.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
const liveLocationsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
liveLocationsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:271
* @route '/dashboard/live-locations'
*/
liveLocationsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: liveLocations.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

liveLocations.form = liveLocationsForm

const dashboard = {
    liveLocations: Object.assign(liveLocations, liveLocations),
}

export default dashboard