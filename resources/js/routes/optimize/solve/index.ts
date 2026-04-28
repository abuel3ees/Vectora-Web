import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
export const status = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(args, options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/optimize/solve/{jobId}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
status.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { jobId: args }
    }

    if (Array.isArray(args)) {
        args = {
            jobId: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        jobId: args.jobId,
    }

    return status.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
status.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
status.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
const statusForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
statusForm.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:181
* @route '/optimize/solve/{jobId}'
*/
statusForm.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

status.form = statusForm

const solve = {
    status: Object.assign(status, status),
}

export default solve