import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/operations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::show
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
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
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
export const live = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: live.url(options),
    method: 'get',
})

live.definition = {
    methods: ["get","head"],
    url: '/operations/live',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
live.url = (options?: RouteQueryOptions) => {
    return live.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
live.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: live.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
live.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: live.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
const liveForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: live.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
liveForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: live.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::live
* @see app/Http/Controllers/OperationsController.php:39
* @route '/operations/live'
*/
liveForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: live.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

live.form = liveForm

/**
* @see \App\Http\Controllers\OperationsController::requeue
* @see app/Http/Controllers/OperationsController.php:44
* @route '/operations/requeue'
*/
export const requeue = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requeue.url(options),
    method: 'post',
})

requeue.definition = {
    methods: ["post"],
    url: '/operations/requeue',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OperationsController::requeue
* @see app/Http/Controllers/OperationsController.php:44
* @route '/operations/requeue'
*/
requeue.url = (options?: RouteQueryOptions) => {
    return requeue.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OperationsController::requeue
* @see app/Http/Controllers/OperationsController.php:44
* @route '/operations/requeue'
*/
requeue.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requeue.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OperationsController::requeue
* @see app/Http/Controllers/OperationsController.php:44
* @route '/operations/requeue'
*/
const requeueForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requeue.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OperationsController::requeue
* @see app/Http/Controllers/OperationsController.php:44
* @route '/operations/requeue'
*/
requeueForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: requeue.url(options),
    method: 'post',
})

requeue.form = requeueForm

const OperationsController = { show, live, requeue }

export default OperationsController