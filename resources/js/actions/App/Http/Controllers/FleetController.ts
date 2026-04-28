import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
const FleetController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: FleetController.url(options),
    method: 'get',
})

FleetController.definition = {
    methods: ["get","head"],
    url: '/fleet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
FleetController.url = (options?: RouteQueryOptions) => {
    return FleetController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
FleetController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: FleetController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
FleetController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: FleetController.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
const FleetControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: FleetController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
FleetControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: FleetController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
FleetControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: FleetController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

FleetController.form = FleetControllerForm

export default FleetController