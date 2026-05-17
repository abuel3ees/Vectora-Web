import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
export const getSummary = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSummary.url(options),
    method: 'get',
})

getSummary.definition = {
    methods: ["get","head"],
    url: '/api/driver/statistics/summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
getSummary.url = (options?: RouteQueryOptions) => {
    return getSummary.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
getSummary.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSummary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
getSummary.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getSummary.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
const getSummaryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSummary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
getSummaryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSummary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverStatsController::getSummary
* @see app/Http/Controllers/DriverStatsController.php:13
* @route '/api/driver/statistics/summary'
*/
getSummaryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSummary.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getSummary.form = getSummaryForm

const DriverStatsController = { getSummary }

export default DriverStatsController