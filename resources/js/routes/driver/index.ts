import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
export const app = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: app.url(options),
    method: 'get',
})

app.definition = {
    methods: ["get","head"],
    url: '/get-the-app',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
app.url = (options?: RouteQueryOptions) => {
    return app.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
app.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: app.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
app.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: app.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
const appForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: app.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
appForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: app.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/get-the-app'
*/
appForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: app.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

app.form = appForm

const driver = {
    app: Object.assign(app, app),
}

export default driver