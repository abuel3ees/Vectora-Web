import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
loginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
loginForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

login.form = loginForm

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

logout.form = logoutForm

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
registerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
registerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

register.form = registerForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
export const home = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

home.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.url = (options?: RouteQueryOptions) => {
    return home.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: home.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
const homeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

home.form = homeForm

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DashboardController::__invoke
* @see app/Http/Controllers/DashboardController.php:117
* @route '/dashboard'
*/
dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

dashboard.form = dashboardForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
export const presentation = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: presentation.url(options),
    method: 'get',
})

presentation.definition = {
    methods: ["get","head"],
    url: '/presentation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
presentation.url = (options?: RouteQueryOptions) => {
    return presentation.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
presentation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: presentation.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
presentation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: presentation.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
const presentationForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: presentation.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
presentationForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: presentation.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/presentation'
*/
presentationForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: presentation.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

presentation.form = presentationForm

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
export const fleet = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: fleet.url(options),
    method: 'get',
})

fleet.definition = {
    methods: ["get","head"],
    url: '/fleet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
fleet.url = (options?: RouteQueryOptions) => {
    return fleet.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
fleet.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: fleet.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
fleet.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: fleet.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
const fleetForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: fleet.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
fleetForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: fleet.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\FleetController::__invoke
* @see app/Http/Controllers/FleetController.php:12
* @route '/fleet'
*/
fleetForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: fleet.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

fleet.form = fleetForm

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
export const analytics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: analytics.url(options),
    method: 'get',
})

analytics.definition = {
    methods: ["get","head"],
    url: '/analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
analytics.url = (options?: RouteQueryOptions) => {
    return analytics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
analytics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: analytics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
analytics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: analytics.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
const analyticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: analytics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
analyticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: analytics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AnalyticsController::__invoke
* @see app/Http/Controllers/AnalyticsController.php:13
* @route '/analytics'
*/
analyticsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: analytics.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

analytics.form = analyticsForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
export const deliveryProofs = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: deliveryProofs.url(options),
    method: 'get',
})

deliveryProofs.definition = {
    methods: ["get","head"],
    url: '/delivery-proofs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
deliveryProofs.url = (options?: RouteQueryOptions) => {
    return deliveryProofs.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
deliveryProofs.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: deliveryProofs.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
deliveryProofs.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: deliveryProofs.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
const deliveryProofsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: deliveryProofs.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
deliveryProofsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: deliveryProofs.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/delivery-proofs'
*/
deliveryProofsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: deliveryProofs.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

deliveryProofs.form = deliveryProofsForm

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
export const operations = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: operations.url(options),
    method: 'get',
})

operations.definition = {
    methods: ["get","head"],
    url: '/operations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
operations.url = (options?: RouteQueryOptions) => {
    return operations.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
operations.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: operations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
operations.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: operations.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
const operationsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: operations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
operationsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: operations.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OperationsController::operations
* @see app/Http/Controllers/OperationsController.php:24
* @route '/operations'
*/
operationsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: operations.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

operations.form = operationsForm

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
export const optimize = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: optimize.url(options),
    method: 'get',
})

optimize.definition = {
    methods: ["get","head"],
    url: '/optimize',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
optimize.url = (options?: RouteQueryOptions) => {
    return optimize.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
optimize.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: optimize.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
optimize.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: optimize.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
const optimizeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: optimize.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
optimizeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: optimize.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OptimizeController::optimize
* @see app/Http/Controllers/OptimizeController.php:113
* @route '/optimize'
*/
optimizeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: optimize.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

optimize.form = optimizeForm
