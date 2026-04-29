import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:216
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
* @see app/Http/Controllers/OptimizeController.php:216
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
* @see app/Http/Controllers/OptimizeController.php:216
* @route '/optimize/solve/{jobId}'
*/
status.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:216
* @route '/optimize/solve/{jobId}'
*/
status.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:216
* @route '/optimize/solve/{jobId}'
*/
const statusForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:216
* @route '/optimize/solve/{jobId}'
*/
statusForm.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::status
* @see app/Http/Controllers/OptimizeController.php:216
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

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
export const debug = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debug.url(args, options),
    method: 'get',
})

debug.definition = {
    methods: ["get","head"],
    url: '/optimize/solve/{jobId}/debug',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
debug.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return debug.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
debug.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
debug.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: debug.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
const debugForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: debug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
debugForm.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: debug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::debug
* @see app/Http/Controllers/OptimizeController.php:279
* @route '/optimize/solve/{jobId}/debug'
*/
debugForm.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: debug.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

debug.form = debugForm

/**
* @see \App\Http\Controllers\OptimizeController::stop
* @see app/Http/Controllers/OptimizeController.php:302
* @route '/optimize/solve/{jobId}/stop'
*/
export const stop = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stop.url(args, options),
    method: 'post',
})

stop.definition = {
    methods: ["post"],
    url: '/optimize/solve/{jobId}/stop',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OptimizeController::stop
* @see app/Http/Controllers/OptimizeController.php:302
* @route '/optimize/solve/{jobId}/stop'
*/
stop.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return stop.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::stop
* @see app/Http/Controllers/OptimizeController.php:302
* @route '/optimize/solve/{jobId}/stop'
*/
stop.post = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stop.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::stop
* @see app/Http/Controllers/OptimizeController.php:302
* @route '/optimize/solve/{jobId}/stop'
*/
const stopForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: stop.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::stop
* @see app/Http/Controllers/OptimizeController.php:302
* @route '/optimize/solve/{jobId}/stop'
*/
stopForm.post = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: stop.url(args, options),
    method: 'post',
})

stop.form = stopForm

const solve = {
    status: Object.assign(status, status),
    debug: Object.assign(debug, debug),
    stop: Object.assign(stop, stop),
}

export default solve