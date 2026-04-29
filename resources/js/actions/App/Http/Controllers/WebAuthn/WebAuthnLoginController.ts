import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::options
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:17
* @route '/webauthn/login/options'
*/
export const options = (routeOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: options.url(routeOptions),
    method: 'post',
})

options.definition = {
    methods: ["post"],
    url: '/webauthn/login/options',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::options
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:17
* @route '/webauthn/login/options'
*/
options.url = (routeOptions?: RouteQueryOptions) => {
    return options.definition.url
    + queryParams(routeOptions)
}

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::options
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:17
* @route '/webauthn/login/options'
*/
options.post = (routeOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: options.url(routeOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::options
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:17
* @route '/webauthn/login/options'
*/
const optionsForm = (routeOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: options.url(

    routeOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::options
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:17
* @route '/webauthn/login/options'
*/
optionsForm.post = (routeOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: options.url(

    routeOptions
   ),
    method: 'post',
})

options.form = optionsForm

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::login
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:25
* @route '/webauthn/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

login.definition = {
    methods: ["post"],
    url: '/webauthn/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::login
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:25
* @route '/webauthn/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::login
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:25
* @route '/webauthn/login'
*/
login.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::login
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:25
* @route '/webauthn/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: login.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthn\WebAuthnLoginController::login
* @see app/Http/Controllers/WebAuthn/WebAuthnLoginController.php:25
* @route '/webauthn/login'
*/
loginForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: login.url(options),
    method: 'post',
})

login.form = loginForm

const WebAuthnLoginController = { options, login }

export default WebAuthnLoginController