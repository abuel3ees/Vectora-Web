import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
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
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
photos.url = (options?: RouteQueryOptions) => {
    return photos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
photos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
photos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: photos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
const photosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
photosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: photos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::photos
* @see app/Http/Controllers/DriverAssignmentController.php:616
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

const deliveryProofs = {
    photos: Object.assign(photos, photos),
}

export default deliveryProofs