import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
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

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::register
* @see app/Http/Controllers/WebAuthnConfirmController.php:26
* @route '/webauthn/register'
*/
export const register = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

register.definition = {
    methods: ["post"],
    url: '/webauthn/register',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::register
* @see app/Http/Controllers/WebAuthnConfirmController.php:26
* @route '/webauthn/register'
*/
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::register
* @see app/Http/Controllers/WebAuthnConfirmController.php:26
* @route '/webauthn/register'
*/
register.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::register
* @see app/Http/Controllers/WebAuthnConfirmController.php:26
* @route '/webauthn/register'
*/
const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: register.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::register
* @see app/Http/Controllers/WebAuthnConfirmController.php:26
* @route '/webauthn/register'
*/
registerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: register.url(options),
    method: 'post',
})

register.form = registerForm

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/webauthn/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::status
* @see app/Http/Controllers/WebAuthnConfirmController.php:36
* @route '/webauthn/status'
*/
statusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

status.form = statusForm

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::confirm
* @see app/Http/Controllers/WebAuthnConfirmController.php:55
* @route '/webauthn/confirm'
*/
export const confirm = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(options),
    method: 'post',
})

confirm.definition = {
    methods: ["post"],
    url: '/webauthn/confirm',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::confirm
* @see app/Http/Controllers/WebAuthnConfirmController.php:55
* @route '/webauthn/confirm'
*/
confirm.url = (options?: RouteQueryOptions) => {
    return confirm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::confirm
* @see app/Http/Controllers/WebAuthnConfirmController.php:55
* @route '/webauthn/confirm'
*/
confirm.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::confirm
* @see app/Http/Controllers/WebAuthnConfirmController.php:55
* @route '/webauthn/confirm'
*/
const confirmForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\WebAuthnConfirmController::confirm
* @see app/Http/Controllers/WebAuthnConfirmController.php:55
* @route '/webauthn/confirm'
*/
confirmForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(options),
    method: 'post',
})

confirm.form = confirmForm

const webauthn = {
    login: Object.assign(login, login),
    register: Object.assign(register, register),
    status: Object.assign(status, status),
    confirm: Object.assign(confirm, confirm),
}

export default webauthn