import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
export const photos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: photos.url(options),
    method: 'get',
})

photos.definition = {
    methods: ["get","head"],
    url: '/delivery-proofs/photos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
photos.url = (options?: RouteQueryOptions) => {
    return photos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
photos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
photos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: photos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
const photosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
photosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:621
* @route '/delivery-proofs/photos'
*/
photosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: photos.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

photos.form = photosForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::destroy
* @see app/Http/Controllers/DriverAssignmentController.php:669
* @route '/delivery-proofs/{photo}'
*/
export const destroy = (args: { photo: string | number } | [photo: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/delivery-proofs/{photo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::destroy
* @see app/Http/Controllers/DriverAssignmentController.php:669
* @route '/delivery-proofs/{photo}'
*/
destroy.url = (args: { photo: string | number } | [photo: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { photo: args }
    }

    if (Array.isArray(args)) {
        args = {
            photo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        photo: args.photo,
    }

    return destroy.definition.url
            .replace('{photo}', parsedArgs.photo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::destroy
* @see app/Http/Controllers/DriverAssignmentController.php:669
* @route '/delivery-proofs/{photo}'
*/
destroy.delete = (args: { photo: string | number } | [photo: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::destroy
* @see app/Http/Controllers/DriverAssignmentController.php:669
* @route '/delivery-proofs/{photo}'
*/
const destroyForm = (args: { photo: string | number } | [photo: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::destroy
* @see app/Http/Controllers/DriverAssignmentController.php:669
* @route '/delivery-proofs/{photo}'
*/
destroyForm.delete = (args: { photo: string | number } | [photo: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const deliveryProofs = {
    photos: Object.assign(photos, photos),
    destroy: Object.assign(destroy, destroy),
}

export default deliveryProofs