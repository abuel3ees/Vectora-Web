import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import solve069da8 from './solve'
import instances from './instances'
/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:139
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
* @see app/Http/Controllers/OptimizeController.php:139
* @route '/optimize/solve'
*/
solve.url = (options?: RouteQueryOptions) => {
    return solve.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:139
* @route '/optimize/solve'
*/
solve.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: solve.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:139
* @route '/optimize/solve'
*/
const solveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: solve.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::solve
* @see app/Http/Controllers/OptimizeController.php:139
* @route '/optimize/solve'
*/
solveForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: solve.url(options),
    method: 'post',
})

solve.form = solveForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::dispatch
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
export const dispatch = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: dispatch.url(options),
    method: 'post',
})

dispatch.definition = {
    methods: ["post"],
    url: '/optimize/dispatch',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::dispatch
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
dispatch.url = (options?: RouteQueryOptions) => {
    return dispatch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::dispatch
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
dispatch.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: dispatch.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::dispatch
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
const dispatchForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: dispatch.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::dispatch
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
dispatchForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: dispatch.url(options),
    method: 'post',
})

dispatch.form = dispatchForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
export const walkthrough = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: walkthrough.url(options),
    method: 'get',
})

walkthrough.definition = {
    methods: ["get","head"],
    url: '/optimize/algorithm-walkthrough',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
walkthrough.url = (options?: RouteQueryOptions) => {
    return walkthrough.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
walkthrough.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: walkthrough.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
walkthrough.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: walkthrough.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
const walkthroughForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: walkthrough.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
walkthroughForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: walkthrough.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/optimize/algorithm-walkthrough'
*/
walkthroughForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: walkthrough.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

walkthrough.form = walkthroughForm

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
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
* @see app/Http/Controllers/OptimizeController.php:128
* @route '/optimize/history'
*/
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
* @route '/optimize/history'
*/
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
* @route '/optimize/history'
*/
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
* @route '/optimize/history'
*/
const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
* @route '/optimize/history'
*/
historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: history.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::history
* @see app/Http/Controllers/OptimizeController.php:128
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

const optimize = {
    solve: Object.assign(solve, solve069da8),
    dispatch: Object.assign(dispatch, dispatch),
    instances: Object.assign(instances, instances),
    walkthrough: Object.assign(walkthrough, walkthrough),
    history: Object.assign(history, history),
}

export default optimize