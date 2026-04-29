import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/optimize',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::show
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:147
* @route '/optimize/solve'
*/
export const solve = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: solve.url(options),
    method: 'post',
})

solve.definition = {
    methods: ["post"],
    url: '/optimize/solve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:147
* @route '/optimize/solve'
*/
solve.url = (options?: RouteQueryOptions) => {
    return solve.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:147
* @route '/optimize/solve'
*/
solve.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: solve.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:147
* @route '/optimize/solve'
*/
const solveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: solve.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:147
* @route '/optimize/solve'
*/
solveForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: solve.url(options),
    method: 'post',
})

solve.form = solveForm

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
export const solveStatus = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: solveStatus.url(args, options),
    method: 'get',
})

solveStatus.definition = {
    methods: ["get","head"],
    url: '/optimize/solve/{jobId}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
solveStatus.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return solveStatus.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
solveStatus.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: solveStatus.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
solveStatus.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: solveStatus.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
const solveStatusForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveStatus.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
solveStatusForm.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveStatus.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveStatus
* @see app/Http/Controllers/OptimizeController.php:224
* @route '/optimize/solve/{jobId}'
*/
solveStatusForm.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

solveStatus.form = solveStatusForm

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
export const solveDebug = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: solveDebug.url(args, options),
    method: 'get',
})

solveDebug.definition = {
    methods: ["get","head"],
    url: '/optimize/solve/{jobId}/debug',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
solveDebug.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return solveDebug.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
solveDebug.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: solveDebug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
solveDebug.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: solveDebug.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
const solveDebugForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveDebug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
solveDebugForm.get = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveDebug.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::solveDebug
* @see app/Http/Controllers/OptimizeController.php:287
* @route '/optimize/solve/{jobId}/debug'
*/
solveDebugForm.head = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: solveDebug.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

solveDebug.form = solveDebugForm

/**
* @see \App\Http\Controllers\OptimizeController::stopJob
* @see app/Http/Controllers/OptimizeController.php:310
* @route '/optimize/solve/{jobId}/stop'
*/
export const stopJob = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stopJob.url(args, options),
    method: 'post',
})

stopJob.definition = {
    methods: ["post"],
    url: '/optimize/solve/{jobId}/stop',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OptimizeController::stopJob
* @see app/Http/Controllers/OptimizeController.php:310
* @route '/optimize/solve/{jobId}/stop'
*/
stopJob.url = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return stopJob.definition.url
            .replace('{jobId}', parsedArgs.jobId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::stopJob
* @see app/Http/Controllers/OptimizeController.php:310
* @route '/optimize/solve/{jobId}/stop'
*/
stopJob.post = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: stopJob.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::stopJob
* @see app/Http/Controllers/OptimizeController.php:310
* @route '/optimize/solve/{jobId}/stop'
*/
const stopJobForm = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: stopJob.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::stopJob
* @see app/Http/Controllers/OptimizeController.php:310
* @route '/optimize/solve/{jobId}/stop'
*/
stopJobForm.post = (args: { jobId: string | number } | [jobId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: stopJob.url(args, options),
    method: 'post',
})

stopJob.form = stopJobForm

/**
* @see \App\Http\Controllers\OptimizeController::importInstance
* @see app/Http/Controllers/OptimizeController.php:350
* @route '/optimize/instances/import'
*/
export const importInstance = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importInstance.url(options),
    method: 'post',
})

importInstance.definition = {
    methods: ["post"],
    url: '/optimize/instances/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OptimizeController::importInstance
* @see app/Http/Controllers/OptimizeController.php:350
* @route '/optimize/instances/import'
*/
importInstance.url = (options?: RouteQueryOptions) => {
    return importInstance.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::importInstance
* @see app/Http/Controllers/OptimizeController.php:350
* @route '/optimize/instances/import'
*/
importInstance.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importInstance.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::importInstance
* @see app/Http/Controllers/OptimizeController.php:350
* @route '/optimize/instances/import'
*/
const importInstanceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importInstance.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::importInstance
* @see app/Http/Controllers/OptimizeController.php:350
* @route '/optimize/instances/import'
*/
importInstanceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importInstance.url(options),
    method: 'post',
})

importInstance.form = importInstanceForm

/**
* @see \App\Http\Controllers\OptimizeController::deleteInstance
* @see app/Http/Controllers/OptimizeController.php:407
* @route '/optimize/instances/{key}'
*/
export const deleteInstance = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteInstance.url(args, options),
    method: 'delete',
})

deleteInstance.definition = {
    methods: ["delete"],
    url: '/optimize/instances/{key}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OptimizeController::deleteInstance
* @see app/Http/Controllers/OptimizeController.php:407
* @route '/optimize/instances/{key}'
*/
deleteInstance.url = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { key: args }
    }

    if (Array.isArray(args)) {
        args = {
            key: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        key: args.key,
    }

    return deleteInstance.definition.url
            .replace('{key}', parsedArgs.key.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::deleteInstance
* @see app/Http/Controllers/OptimizeController.php:407
* @route '/optimize/instances/{key}'
*/
deleteInstance.delete = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteInstance.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OptimizeController::deleteInstance
* @see app/Http/Controllers/OptimizeController.php:407
* @route '/optimize/instances/{key}'
*/
const deleteInstanceForm = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteInstance.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::deleteInstance
* @see app/Http/Controllers/OptimizeController.php:407
* @route '/optimize/instances/{key}'
*/
deleteInstanceForm.delete = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteInstance.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

deleteInstance.form = deleteInstanceForm

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
export const history = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/optimize/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:136
* @route '/optimize/history'
*/
historyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: history.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

history.form = historyForm

const OptimizeController = { show, solve, solveStatus, solveDebug, stopJob, importInstance, deleteInstance, history }

export default OptimizeController