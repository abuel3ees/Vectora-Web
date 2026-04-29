import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\WebAuthnConfirmController::options
* @see app/Http/Controllers/WebAuthnConfirmController.php:18
* @route '/webauthn/register/options'
*/
export const options = (routeOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: options.url(routeOptions),
    method: 'post',
})

options.definition = {
    methods: ["post"],
    url: '/webauthn/register/options',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::options
* @see app/Http/Controllers/WebAuthnConfirmController.php:18
* @route '/webauthn/register/options'
*/
options.url = (routeOptions?: RouteQueryOptions) => {
    return options.definition.url
    + queryParams(routeOptions)
}

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::options
* @see app/Http/Controllers/WebAuthnConfirmController.php:18
* @route '/webauthn/register/options'
*/
options.post = (routeOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: options.url(routeOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::options
* @see app/Http/Controllers/WebAuthnConfirmController.php:18
* @route '/webauthn/register/options'
*/
const optionsForm = (routeOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: options.url(

    routeOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::options
* @see app/Http/Controllers/WebAuthnConfirmController.php:18
* @route '/webauthn/register/options'
*/
optionsForm.post = (routeOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: options.url(

    routeOptions
   ),
    method: 'post',
})

options.form = optionsForm
