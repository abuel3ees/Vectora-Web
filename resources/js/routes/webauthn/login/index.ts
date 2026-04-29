import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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
