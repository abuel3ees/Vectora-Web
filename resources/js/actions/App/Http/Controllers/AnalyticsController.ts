import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
const AnalyticsController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AnalyticsController.url(options),
    method: 'get',
})

AnalyticsController.definition = {
    methods: ["get","head"],
    url: '/analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
AnalyticsController.url = (options?: RouteQueryOptions) => {
    return AnalyticsController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
AnalyticsController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AnalyticsController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
AnalyticsController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: AnalyticsController.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
const AnalyticsControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: AnalyticsController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
AnalyticsControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: AnalyticsController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
AnalyticsControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: AnalyticsController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

AnalyticsController.form = AnalyticsControllerForm

export default AnalyticsController