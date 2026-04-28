import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/routes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::index
* @see app/Http/Controllers/DispatchRouteController.php:14
* @route '/routes'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/routes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::create
* @see app/Http/Controllers/DispatchRouteController.php:86
* @route '/routes/create'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\DispatchRouteController::store
* @see app/Http/Controllers/DispatchRouteController.php:92
* @route '/routes'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/routes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::store
* @see app/Http/Controllers/DispatchRouteController.php:92
* @route '/routes'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::store
* @see app/Http/Controllers/DispatchRouteController.php:92
* @route '/routes'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::store
* @see app/Http/Controllers/DispatchRouteController.php:92
* @route '/routes'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::store
* @see app/Http/Controllers/DispatchRouteController.php:92
* @route '/routes'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
export const show = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/routes/{dispatchRoute}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
show.url = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { dispatchRoute: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { dispatchRoute: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            dispatchRoute: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        dispatchRoute: typeof args.dispatchRoute === 'object'
        ? args.dispatchRoute.id
        : args.dispatchRoute,
    }

    return show.definition.url
            .replace('{dispatchRoute}', parsedArgs.dispatchRoute.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
show.get = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
show.head = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
const showForm = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
showForm.get = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::show
* @see app/Http/Controllers/DispatchRouteController.php:131
* @route '/routes/{dispatchRoute}'
*/
showForm.head = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
export const edit = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/routes/{dispatchRoute}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
edit.url = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { dispatchRoute: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { dispatchRoute: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            dispatchRoute: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        dispatchRoute: typeof args.dispatchRoute === 'object'
        ? args.dispatchRoute.id
        : args.dispatchRoute,
    }

    return edit.definition.url
            .replace('{dispatchRoute}', parsedArgs.dispatchRoute.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
edit.get = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
edit.head = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
const editForm = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
editForm.get = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::edit
* @see app/Http/Controllers/DispatchRouteController.php:107
* @route '/routes/{dispatchRoute}/edit'
*/
editForm.head = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
export const update = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/routes/{dispatchRoute}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
update.url = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { dispatchRoute: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { dispatchRoute: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            dispatchRoute: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        dispatchRoute: typeof args.dispatchRoute === 'object'
        ? args.dispatchRoute.id
        : args.dispatchRoute,
    }

    return update.definition.url
            .replace('{dispatchRoute}', parsedArgs.dispatchRoute.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
update.put = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
update.patch = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
const updateForm = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
updateForm.put = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::update
* @see app/Http/Controllers/DispatchRouteController.php:116
* @route '/routes/{dispatchRoute}'
*/
updateForm.patch = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\DispatchRouteController::destroy
* @see app/Http/Controllers/DispatchRouteController.php:181
* @route '/routes/{dispatchRoute}'
*/
export const destroy = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/routes/{dispatchRoute}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\DispatchRouteController::destroy
* @see app/Http/Controllers/DispatchRouteController.php:181
* @route '/routes/{dispatchRoute}'
*/
destroy.url = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { dispatchRoute: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { dispatchRoute: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            dispatchRoute: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        dispatchRoute: typeof args.dispatchRoute === 'object'
        ? args.dispatchRoute.id
        : args.dispatchRoute,
    }

    return destroy.definition.url
            .replace('{dispatchRoute}', parsedArgs.dispatchRoute.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DispatchRouteController::destroy
* @see app/Http/Controllers/DispatchRouteController.php:181
* @route '/routes/{dispatchRoute}'
*/
destroy.delete = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::destroy
* @see app/Http/Controllers/DispatchRouteController.php:181
* @route '/routes/{dispatchRoute}'
*/
const destroyForm = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DispatchRouteController::destroy
* @see app/Http/Controllers/DispatchRouteController.php:181
* @route '/routes/{dispatchRoute}'
*/
destroyForm.delete = (args: { dispatchRoute: number | { id: number } } | [dispatchRoute: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const routes = {
    index: Object.assign(index, index),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    edit: Object.assign(edit, edit),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default routes