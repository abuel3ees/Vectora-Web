import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
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

const settings = {
    developer: Object.assign(developer, developer),
}

export default settings