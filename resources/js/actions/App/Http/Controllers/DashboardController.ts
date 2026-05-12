import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
const DashboardController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: DashboardController.url(options),
    method: 'get',
})

DashboardController.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
DashboardController.url = (options?: RouteQueryOptions) => {
    return DashboardController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
DashboardController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: DashboardController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
DashboardController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: DashboardController.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
const DashboardControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: DashboardController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
DashboardControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: DashboardController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:118
* @route '/dashboard'
*/
DashboardControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: DashboardController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

DashboardController.form = DashboardControllerForm

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
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
* @see app/Http/Controllers/DashboardController.php:272
* @route '/dashboard/live-locations'
*/
liveLocations.url = (options?: RouteQueryOptions) => {
    return liveLocations.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
* @route '/dashboard/live-locations'
*/
liveLocations.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
* @route '/dashboard/live-locations'
*/
liveLocations.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: liveLocations.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
* @route '/dashboard/live-locations'
*/
const liveLocationsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
* @route '/dashboard/live-locations'
*/
liveLocationsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: liveLocations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::liveLocations
* @see app/Http/Controllers/DashboardController.php:272
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

DashboardController.liveLocations = liveLocations

export default DashboardController