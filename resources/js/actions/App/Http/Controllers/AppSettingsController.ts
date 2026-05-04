import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
export const developer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: developer.url(options),
    method: 'get',
})

developer.definition = {
    methods: ["get","head"],
    url: '/settings/developer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
developer.url = (options?: RouteQueryOptions) => {
    return developer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
developer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
developer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: developer.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
const developerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
developerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:18
* @route '/settings/developer'
*/
developerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: developer.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

developer.form = developerForm

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:25
* @route '/settings/developer'
*/
export const updateDeveloper = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateDeveloper.url(options),
    method: 'patch',
})

updateDeveloper.definition = {
    methods: ["patch"],
    url: '/settings/developer',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:25
* @route '/settings/developer'
*/
updateDeveloper.url = (options?: RouteQueryOptions) => {
    return updateDeveloper.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:25
* @route '/settings/developer'
*/
updateDeveloper.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateDeveloper.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:25
* @route '/settings/developer'
*/
const updateDeveloperForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateDeveloper.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:25
* @route '/settings/developer'
*/
updateDeveloperForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateDeveloper.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateDeveloper.form = updateDeveloperForm

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
export const mobileTheme = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mobileTheme.url(options),
    method: 'get',
})

mobileTheme.definition = {
    methods: ["get","head"],
    url: '/settings/mobile-theme',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
mobileTheme.url = (options?: RouteQueryOptions) => {
    return mobileTheme.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
mobileTheme.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mobileTheme.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
mobileTheme.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mobileTheme.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
const mobileThemeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mobileTheme.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
mobileThemeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mobileTheme.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::mobileTheme
* @see app/Http/Controllers/AppSettingsController.php:35
* @route '/settings/mobile-theme'
*/
mobileThemeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mobileTheme.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

mobileTheme.form = mobileThemeForm

/**
* @see \App\Http\Controllers\AppSettingsController::updateMobileTheme
* @see app/Http/Controllers/AppSettingsController.php:43
* @route '/settings/mobile-theme'
*/
export const updateMobileTheme = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateMobileTheme.url(options),
    method: 'patch',
})

updateMobileTheme.definition = {
    methods: ["patch"],
    url: '/settings/mobile-theme',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\AppSettingsController::updateMobileTheme
* @see app/Http/Controllers/AppSettingsController.php:43
* @route '/settings/mobile-theme'
*/
updateMobileTheme.url = (options?: RouteQueryOptions) => {
    return updateMobileTheme.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::updateMobileTheme
* @see app/Http/Controllers/AppSettingsController.php:43
* @route '/settings/mobile-theme'
*/
updateMobileTheme.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateMobileTheme.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\AppSettingsController::updateMobileTheme
* @see app/Http/Controllers/AppSettingsController.php:43
* @route '/settings/mobile-theme'
*/
const updateMobileThemeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateMobileTheme.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AppSettingsController::updateMobileTheme
* @see app/Http/Controllers/AppSettingsController.php:43
* @route '/settings/mobile-theme'
*/
updateMobileThemeForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateMobileTheme.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateMobileTheme.form = updateMobileThemeForm

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
export const publicConfig = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publicConfig.url(options),
    method: 'get',
})

publicConfig.definition = {
    methods: ["get","head"],
    url: '/api/driver/public-config',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
publicConfig.url = (options?: RouteQueryOptions) => {
    return publicConfig.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
publicConfig.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
publicConfig.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: publicConfig.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
const publicConfigForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
publicConfigForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:54
* @route '/api/driver/public-config'
*/
publicConfigForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: publicConfig.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

publicConfig.form = publicConfigForm

const AppSettingsController = { developer, updateDeveloper, mobileTheme, updateMobileTheme, publicConfig }

export default AppSettingsController