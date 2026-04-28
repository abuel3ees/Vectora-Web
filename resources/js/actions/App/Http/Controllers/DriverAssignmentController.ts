import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
export const getAllDeliveryProofs = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllDeliveryProofs.url(options),
    method: 'get',
})

getAllDeliveryProofs.definition = {
    methods: ["get","head"],
    url: '/delivery-proofs/photos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
getAllDeliveryProofs.url = (options?: RouteQueryOptions) => {
    return getAllDeliveryProofs.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
getAllDeliveryProofs.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
getAllDeliveryProofs.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAllDeliveryProofs.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
const getAllDeliveryProofsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
getAllDeliveryProofsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getAllDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:616
* @route '/delivery-proofs/photos'
*/
getAllDeliveryProofsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllDeliveryProofs.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAllDeliveryProofs.form = getAllDeliveryProofsForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::store
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/optimize/dispatch',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::store
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::store
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::store
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::store
* @see app/Http/Controllers/DriverAssignmentController.php:17
* @route '/optimize/dispatch'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
export const mine = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})

mine.definition = {
    methods: ["get","head"],
    url: '/api/driver/assignments',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
mine.url = (options?: RouteQueryOptions) => {
    return mine.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
mine.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
mine.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mine.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
const mineForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mine.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
mineForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mine.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::mine
* @see app/Http/Controllers/DriverAssignmentController.php:84
* @route '/api/driver/assignments'
*/
mineForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mine.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

mine.form = mineForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
export const show = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/driver/assignments/{assignment}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
show.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { assignment: args }
    }

    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
    }

    return show.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
show.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
show.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
const showForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
showForm.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::show
* @see app/Http/Controllers/DriverAssignmentController.php:103
* @route '/api/driver/assignments/{assignment}'
*/
showForm.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordLocation
* @see app/Http/Controllers/DriverAssignmentController.php:664
* @route '/api/driver/assignments/{assignment}/location'
*/
export const recordLocation = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordLocation.url(args, options),
    method: 'post',
})

recordLocation.definition = {
    methods: ["post"],
    url: '/api/driver/assignments/{assignment}/location',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordLocation
* @see app/Http/Controllers/DriverAssignmentController.php:664
* @route '/api/driver/assignments/{assignment}/location'
*/
recordLocation.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { assignment: args }
    }

    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
    }

    return recordLocation.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordLocation
* @see app/Http/Controllers/DriverAssignmentController.php:664
* @route '/api/driver/assignments/{assignment}/location'
*/
recordLocation.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordLocation.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordLocation
* @see app/Http/Controllers/DriverAssignmentController.php:664
* @route '/api/driver/assignments/{assignment}/location'
*/
const recordLocationForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordLocation.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordLocation
* @see app/Http/Controllers/DriverAssignmentController.php:664
* @route '/api/driver/assignments/{assignment}/location'
*/
recordLocationForm.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordLocation.url(args, options),
    method: 'post',
})

recordLocation.form = recordLocationForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::updateStatus
* @see app/Http/Controllers/DriverAssignmentController.php:180
* @route '/api/driver/assignments/{assignment}/status'
*/
export const updateStatus = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

updateStatus.definition = {
    methods: ["post"],
    url: '/api/driver/assignments/{assignment}/status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::updateStatus
* @see app/Http/Controllers/DriverAssignmentController.php:180
* @route '/api/driver/assignments/{assignment}/status'
*/
updateStatus.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { assignment: args }
    }

    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
    }

    return updateStatus.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::updateStatus
* @see app/Http/Controllers/DriverAssignmentController.php:180
* @route '/api/driver/assignments/{assignment}/status'
*/
updateStatus.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStatus.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::updateStatus
* @see app/Http/Controllers/DriverAssignmentController.php:180
* @route '/api/driver/assignments/{assignment}/status'
*/
const updateStatusForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStatus.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::updateStatus
* @see app/Http/Controllers/DriverAssignmentController.php:180
* @route '/api/driver/assignments/{assignment}/status'
*/
updateStatusForm.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStatus.url(args, options),
    method: 'post',
})

updateStatus.form = updateStatusForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordStop
* @see app/Http/Controllers/DriverAssignmentController.php:134
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}'
*/
export const recordStop = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordStop.url(args, options),
    method: 'post',
})

recordStop.definition = {
    methods: ["post"],
    url: '/api/driver/assignments/{assignment}/stops/{stopIndex}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordStop
* @see app/Http/Controllers/DriverAssignmentController.php:134
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}'
*/
recordStop.url = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
            stopIndex: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
        stopIndex: args.stopIndex,
    }

    return recordStop.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace('{stopIndex}', parsedArgs.stopIndex.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordStop
* @see app/Http/Controllers/DriverAssignmentController.php:134
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}'
*/
recordStop.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordStop.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordStop
* @see app/Http/Controllers/DriverAssignmentController.php:134
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}'
*/
const recordStopForm = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordStop.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::recordStop
* @see app/Http/Controllers/DriverAssignmentController.php:134
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}'
*/
recordStopForm.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordStop.url(args, options),
    method: 'post',
})

recordStop.form = recordStopForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadPhoto
* @see app/Http/Controllers/DriverAssignmentController.php:246
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos'
*/
export const uploadPhoto = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadPhoto.url(args, options),
    method: 'post',
})

uploadPhoto.definition = {
    methods: ["post"],
    url: '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadPhoto
* @see app/Http/Controllers/DriverAssignmentController.php:246
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos'
*/
uploadPhoto.url = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
            stopIndex: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
        stopIndex: args.stopIndex,
    }

    return uploadPhoto.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace('{stopIndex}', parsedArgs.stopIndex.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadPhoto
* @see app/Http/Controllers/DriverAssignmentController.php:246
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos'
*/
uploadPhoto.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadPhoto.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadPhoto
* @see app/Http/Controllers/DriverAssignmentController.php:246
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos'
*/
const uploadPhotoForm = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: uploadPhoto.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadPhoto
* @see app/Http/Controllers/DriverAssignmentController.php:246
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/photos'
*/
uploadPhotoForm.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: uploadPhoto.url(args, options),
    method: 'post',
})

uploadPhoto.form = uploadPhotoForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
export const getPhotos = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPhotos.url(args, options),
    method: 'get',
})

getPhotos.definition = {
    methods: ["get","head"],
    url: '/api/driver/assignments/{assignment}/photos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
getPhotos.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { assignment: args }
    }

    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
    }

    return getPhotos.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
getPhotos.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPhotos.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
getPhotos.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getPhotos.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
const getPhotosForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPhotos.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
getPhotosForm.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPhotos.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getPhotos
* @see app/Http/Controllers/DriverAssignmentController.php:541
* @route '/api/driver/assignments/{assignment}/photos'
*/
getPhotosForm.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPhotos.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getPhotos.form = getPhotosForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadSignature
* @see app/Http/Controllers/DriverAssignmentController.php:330
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature'
*/
export const uploadSignature = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadSignature.url(args, options),
    method: 'post',
})

uploadSignature.definition = {
    methods: ["post"],
    url: '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadSignature
* @see app/Http/Controllers/DriverAssignmentController.php:330
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature'
*/
uploadSignature.url = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            assignment: args[0],
            stopIndex: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        assignment: args.assignment,
        stopIndex: args.stopIndex,
    }

    return uploadSignature.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace('{stopIndex}', parsedArgs.stopIndex.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadSignature
* @see app/Http/Controllers/DriverAssignmentController.php:330
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature'
*/
uploadSignature.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadSignature.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadSignature
* @see app/Http/Controllers/DriverAssignmentController.php:330
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature'
*/
const uploadSignatureForm = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: uploadSignature.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::uploadSignature
* @see app/Http/Controllers/DriverAssignmentController.php:330
* @route '/api/driver/assignments/{assignment}/stops/{stopIndex}/signature'
*/
uploadSignatureForm.post = (args: { assignment: string | number, stopIndex: string | number } | [assignment: string | number, stopIndex: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: uploadSignature.url(args, options),
    method: 'post',
})

uploadSignature.form = uploadSignatureForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
export const getStatistics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(options),
    method: 'get',
})

getStatistics.definition = {
    methods: ["get","head"],
    url: '/api/driver/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
getStatistics.url = (options?: RouteQueryOptions) => {
    return getStatistics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
getStatistics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
getStatistics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatistics.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
const getStatisticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
getStatisticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getStatistics
* @see app/Http/Controllers/DriverAssignmentController.php:389
* @route '/api/driver/statistics'
*/
getStatisticsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getStatistics.form = getStatisticsForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
export const getDeliveryHistory = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getDeliveryHistory.url(options),
    method: 'get',
})

getDeliveryHistory.definition = {
    methods: ["get","head"],
    url: '/api/driver/delivery-history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
getDeliveryHistory.url = (options?: RouteQueryOptions) => {
    return getDeliveryHistory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
getDeliveryHistory.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getDeliveryHistory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
getDeliveryHistory.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getDeliveryHistory.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
const getDeliveryHistoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryHistory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
getDeliveryHistoryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryHistory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryHistory
* @see app/Http/Controllers/DriverAssignmentController.php:466
* @route '/api/driver/delivery-history'
*/
getDeliveryHistoryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryHistory.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getDeliveryHistory.form = getDeliveryHistoryForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
export const getDeliveryProofs = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getDeliveryProofs.url(options),
    method: 'get',
})

getDeliveryProofs.definition = {
    methods: ["get","head"],
    url: '/api/driver/delivery-proofs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
getDeliveryProofs.url = (options?: RouteQueryOptions) => {
    return getDeliveryProofs.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
getDeliveryProofs.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
getDeliveryProofs.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getDeliveryProofs.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
const getDeliveryProofsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
getDeliveryProofsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryProofs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::getDeliveryProofs
* @see app/Http/Controllers/DriverAssignmentController.php:565
* @route '/api/driver/delivery-proofs'
*/
getDeliveryProofsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getDeliveryProofs.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getDeliveryProofs.form = getDeliveryProofsForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
export const diagnostic = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: diagnostic.url(options),
    method: 'get',
})

diagnostic.definition = {
    methods: ["get","head"],
    url: '/api/driver/diagnostic',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
diagnostic.url = (options?: RouteQueryOptions) => {
    return diagnostic.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
diagnostic.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: diagnostic.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
diagnostic.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: diagnostic.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
const diagnosticForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: diagnostic.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
diagnosticForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: diagnostic.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::diagnostic
* @see app/Http/Controllers/DriverAssignmentController.php:219
* @route '/api/driver/diagnostic'
*/
diagnosticForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: diagnostic.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

diagnostic.form = diagnosticForm

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
export const config = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: config.url(options),
    method: 'get',
})

config.definition = {
    methods: ["get","head"],
    url: '/api/driver/config',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
config.url = (options?: RouteQueryOptions) => {
    return config.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
config.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: config.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
config.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: config.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
const configForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: config.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
configForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: config.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DriverAssignmentController::config
* @see app/Http/Controllers/DriverAssignmentController.php:205
* @route '/api/driver/config'
*/
configForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: config.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

config.form = configForm

const DriverAssignmentController = { getAllDeliveryProofs, store, mine, show, recordLocation, updateStatus, recordStop, uploadPhoto, getPhotos, uploadSignature, getStatistics, getDeliveryHistory, getDeliveryProofs, diagnostic, config }

export default DriverAssignmentController