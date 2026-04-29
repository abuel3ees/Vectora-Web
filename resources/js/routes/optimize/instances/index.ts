import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OptimizeController::importMethod
* @see app/Http/Controllers/OptimizeController.php:342
* @route '/optimize/instances/import'
*/
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/optimize/instances/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OptimizeController::importMethod
* @see app/Http/Controllers/OptimizeController.php:342
* @route '/optimize/instances/import'
*/
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::importMethod
* @see app/Http/Controllers/OptimizeController.php:342
* @route '/optimize/instances/import'
*/
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::importMethod
* @see app/Http/Controllers/OptimizeController.php:342
* @route '/optimize/instances/import'
*/
const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::importMethod
* @see app/Http/Controllers/OptimizeController.php:342
* @route '/optimize/instances/import'
*/
importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

importMethod.form = importMethodForm

/**
* @see \App\Http\Controllers\OptimizeController::deleteMethod
* @see app/Http/Controllers/OptimizeController.php:399
* @route '/optimize/instances/{key}'
*/
export const deleteMethod = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})

deleteMethod.definition = {
    methods: ["delete"],
    url: '/optimize/instances/{key}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OptimizeController::deleteMethod
* @see app/Http/Controllers/OptimizeController.php:399
* @route '/optimize/instances/{key}'
*/
deleteMethod.url = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { key: args }
    }

    if (Array.isArray(args)) {
        args = {
            key: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        key: args.key,
    }

    return deleteMethod.definition.url
            .replace('{key}', parsedArgs.key.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OptimizeController::deleteMethod
* @see app/Http/Controllers/OptimizeController.php:399
* @route '/optimize/instances/{key}'
*/
deleteMethod.delete = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OptimizeController::deleteMethod
* @see app/Http/Controllers/OptimizeController.php:399
* @route '/optimize/instances/{key}'
*/
const deleteMethodForm = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteMethod.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OptimizeController::deleteMethod
* @see app/Http/Controllers/OptimizeController.php:399
* @route '/optimize/instances/{key}'
*/
deleteMethodForm.delete = (args: { key: string | number } | [key: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteMethod.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

deleteMethod.form = deleteMethodForm

const instances = {
    import: Object.assign(importMethod, importMethod),
    delete: Object.assign(deleteMethod, deleteMethod),
}

export default instances