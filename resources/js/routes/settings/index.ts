import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
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

const settings = {
    developer: Object.assign(developer, developer),
    mobileTheme: Object.assign(mobileTheme, mobileTheme),
}

export default settings