import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DriverAuthController::login
* @see app/Http/Controllers/DriverAuthController.php:16
* @route '/api/driver/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

login.definition = {
    methods: ["post"],
    url: '/api/driver/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAuthController::login
* @see app/Http/Controllers/DriverAuthController.php:16
* @route '/api/driver/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::login
* @see app/Http/Controllers/DriverAuthController.php:16
* @route '/api/driver/login'
*/
login.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: login.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::login
* @see app/Http/Controllers/DriverAuthController.php:16
* @route '/api/driver/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: login.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::login
* @see app/Http/Controllers/DriverAuthController.php:16
* @route '/api/driver/login'
*/
loginForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: login.url(options),
    method: 'post',
})

login.form = loginForm

/**
* @see \App\Http\Controllers\DriverAuthController::refreshToken
* @see app/Http/Controllers/DriverAuthController.php:107
* @route '/api/driver/refresh-token'
*/
export const refreshToken = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshToken.url(options),
    method: 'post',
})

refreshToken.definition = {
    methods: ["post"],
    url: '/api/driver/refresh-token',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAuthController::refreshToken
* @see app/Http/Controllers/DriverAuthController.php:107
* @route '/api/driver/refresh-token'
*/
refreshToken.url = (options?: RouteQueryOptions) => {
    return refreshToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::refreshToken
* @see app/Http/Controllers/DriverAuthController.php:107
* @route '/api/driver/refresh-token'
*/
refreshToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshToken.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::refreshToken
* @see app/Http/Controllers/DriverAuthController.php:107
* @route '/api/driver/refresh-token'
*/
const refreshTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: refreshToken.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::refreshToken
* @see app/Http/Controllers/DriverAuthController.php:107
* @route '/api/driver/refresh-token'
*/
refreshTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: refreshToken.url(options),
    method: 'post',
})

refreshToken.form = refreshTokenForm

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
export const profile = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: profile.url(options),
    method: 'get',
})

profile.definition = {
    methods: ["get","head"],
    url: '/api/driver/profile',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
profile.url = (options?: RouteQueryOptions) => {
    return profile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
profile.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: profile.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
profile.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: profile.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
const profileForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: profile.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
profileForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: profile.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAuthController::profile
* @see app/Http/Controllers/DriverAuthController.php:65
* @route '/api/driver/profile'
*/
profileForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: profile.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

profile.form = profileForm

/**
* @see \App\Http\Controllers\DriverAuthController::logout
* @see app/Http/Controllers/DriverAuthController.php:51
* @route '/api/driver/logout'
*/
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/api/driver/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAuthController::logout
* @see app/Http/Controllers/DriverAuthController.php:51
* @route '/api/driver/logout'
*/
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::logout
* @see app/Http/Controllers/DriverAuthController.php:51
* @route '/api/driver/logout'
*/
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::logout
* @see app/Http/Controllers/DriverAuthController.php:51
* @route '/api/driver/logout'
*/
const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::logout
* @see app/Http/Controllers/DriverAuthController.php:51
* @route '/api/driver/logout'
*/
logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

logout.form = logoutForm

/**
* @see \App\Http\Controllers\DriverAuthController::heartbeat
* @see app/Http/Controllers/DriverAuthController.php:83
* @route '/api/driver/heartbeat'
*/
export const heartbeat = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: heartbeat.url(options),
    method: 'post',
})

heartbeat.definition = {
    methods: ["post"],
    url: '/api/driver/heartbeat',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAuthController::heartbeat
* @see app/Http/Controllers/DriverAuthController.php:83
* @route '/api/driver/heartbeat'
*/
heartbeat.url = (options?: RouteQueryOptions) => {
    return heartbeat.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::heartbeat
* @see app/Http/Controllers/DriverAuthController.php:83
* @route '/api/driver/heartbeat'
*/
heartbeat.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: heartbeat.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::heartbeat
* @see app/Http/Controllers/DriverAuthController.php:83
* @route '/api/driver/heartbeat'
*/
const heartbeatForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: heartbeat.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::heartbeat
* @see app/Http/Controllers/DriverAuthController.php:83
* @route '/api/driver/heartbeat'
*/
heartbeatForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: heartbeat.url(options),
    method: 'post',
})

heartbeat.form = heartbeatForm

/**
* @see \App\Http\Controllers\DriverAuthController::registerDevice
* @see app/Http/Controllers/DriverAuthController.php:93
* @route '/api/driver/register-device'
*/
export const registerDevice = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDevice.url(options),
    method: 'post',
})

registerDevice.definition = {
    methods: ["post"],
    url: '/api/driver/register-device',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAuthController::registerDevice
* @see app/Http/Controllers/DriverAuthController.php:93
* @route '/api/driver/register-device'
*/
registerDevice.url = (options?: RouteQueryOptions) => {
    return registerDevice.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAuthController::registerDevice
* @see app/Http/Controllers/DriverAuthController.php:93
* @route '/api/driver/register-device'
*/
registerDevice.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registerDevice.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::registerDevice
* @see app/Http/Controllers/DriverAuthController.php:93
* @route '/api/driver/register-device'
*/
const registerDeviceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: registerDevice.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAuthController::registerDevice
* @see app/Http/Controllers/DriverAuthController.php:93
* @route '/api/driver/register-device'
*/
registerDeviceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: registerDevice.url(options),
    method: 'post',
})

registerDevice.form = registerDeviceForm

const DriverAuthController = { login, refreshToken, profile, logout, heartbeat, registerDevice }

export default DriverAuthController