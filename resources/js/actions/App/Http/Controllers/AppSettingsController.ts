import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
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
* @see app/Http/Controllers/AppSettingsController.php:13
* @route '/settings/developer'
*/
developer.url = (options?: RouteQueryOptions) => {
    return developer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
* @route '/settings/developer'
*/
developer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
* @route '/settings/developer'
*/
developer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: developer.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
* @route '/settings/developer'
*/
const developerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
* @route '/settings/developer'
*/
developerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: developer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::developer
* @see app/Http/Controllers/AppSettingsController.php:13
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
* @see app/Http/Controllers/AppSettingsController.php:20
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
* @see app/Http/Controllers/AppSettingsController.php:20
* @route '/settings/developer'
*/
updateDeveloper.url = (options?: RouteQueryOptions) => {
    return updateDeveloper.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:20
* @route '/settings/developer'
*/
updateDeveloper.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateDeveloper.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\AppSettingsController::updateDeveloper
* @see app/Http/Controllers/AppSettingsController.php:20
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
* @see app/Http/Controllers/AppSettingsController.php:20
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
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
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
* @see app/Http/Controllers/AppSettingsController.php:30
* @route '/api/driver/public-config'
*/
publicConfig.url = (options?: RouteQueryOptions) => {
    return publicConfig.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
* @route '/api/driver/public-config'
*/
publicConfig.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
* @route '/api/driver/public-config'
*/
publicConfig.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: publicConfig.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
* @route '/api/driver/public-config'
*/
const publicConfigForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
* @route '/api/driver/public-config'
*/
publicConfigForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: publicConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppSettingsController::publicConfig
* @see app/Http/Controllers/AppSettingsController.php:30
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

const AppSettingsController = { developer, updateDeveloper, publicConfig }

export default AppSettingsController