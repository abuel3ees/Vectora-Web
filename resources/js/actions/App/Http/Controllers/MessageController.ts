import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MessageController::sendMessage
* @see app/Http/Controllers/MessageController.php:116
* @route '/assignments/{assignment}/message'
*/
export const sendMessage = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(args, options),
    method: 'post',
})

sendMessage.definition = {
    methods: ["post"],
    url: '/assignments/{assignment}/message',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::sendMessage
* @see app/Http/Controllers/MessageController.php:116
* @route '/assignments/{assignment}/message'
*/
sendMessage.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return sendMessage.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::sendMessage
* @see app/Http/Controllers/MessageController.php:116
* @route '/assignments/{assignment}/message'
*/
sendMessage.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MessageController::sendMessage
* @see app/Http/Controllers/MessageController.php:116
* @route '/assignments/{assignment}/message'
*/
const sendMessageForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendMessage.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MessageController::sendMessage
* @see app/Http/Controllers/MessageController.php:116
* @route '/assignments/{assignment}/message'
*/
sendMessageForm.post = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendMessage.url(args, options),
    method: 'post',
})

sendMessage.form = sendMessageForm

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
export const getAssignmentMessagesWeb = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAssignmentMessagesWeb.url(args, options),
    method: 'get',
})

getAssignmentMessagesWeb.definition = {
    methods: ["get","head"],
    url: '/assignments/{assignment}/messages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
getAssignmentMessagesWeb.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return getAssignmentMessagesWeb.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
getAssignmentMessagesWeb.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAssignmentMessagesWeb.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
getAssignmentMessagesWeb.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAssignmentMessagesWeb.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
const getAssignmentMessagesWebForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessagesWeb.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
getAssignmentMessagesWebForm.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessagesWeb.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessagesWeb
* @see app/Http/Controllers/MessageController.php:95
* @route '/assignments/{assignment}/messages'
*/
getAssignmentMessagesWebForm.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessagesWeb.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAssignmentMessagesWeb.form = getAssignmentMessagesWebForm

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
export const getMessages = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMessages.url(options),
    method: 'get',
})

getMessages.definition = {
    methods: ["get","head"],
    url: '/api/driver/messages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
getMessages.url = (options?: RouteQueryOptions) => {
    return getMessages.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
getMessages.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMessages.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
getMessages.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMessages.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
const getMessagesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getMessages.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
getMessagesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getMessages.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getMessages
* @see app/Http/Controllers/MessageController.php:16
* @route '/api/driver/messages'
*/
getMessagesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getMessages.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getMessages.form = getMessagesForm

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
export const getAssignmentMessages = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAssignmentMessages.url(args, options),
    method: 'get',
})

getAssignmentMessages.definition = {
    methods: ["get","head"],
    url: '/api/driver/assignments/{assignment}/messages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
getAssignmentMessages.url = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return getAssignmentMessages.definition.url
            .replace('{assignment}', parsedArgs.assignment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
getAssignmentMessages.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAssignmentMessages.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
getAssignmentMessages.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAssignmentMessages.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
const getAssignmentMessagesForm = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessages.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
getAssignmentMessagesForm.get = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessages.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MessageController::getAssignmentMessages
* @see app/Http/Controllers/MessageController.php:51
* @route '/api/driver/assignments/{assignment}/messages'
*/
getAssignmentMessagesForm.head = (args: { assignment: string | number } | [assignment: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAssignmentMessages.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAssignmentMessages.form = getAssignmentMessagesForm

/**
* @see \App\Http\Controllers\MessageController::markAsRead
* @see app/Http/Controllers/MessageController.php:77
* @route '/api/driver/messages/{message}/read'
*/
export const markAsRead = (args: { message: string | number } | [message: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
})

markAsRead.definition = {
    methods: ["post"],
    url: '/api/driver/messages/{message}/read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::markAsRead
* @see app/Http/Controllers/MessageController.php:77
* @route '/api/driver/messages/{message}/read'
*/
markAsRead.url = (args: { message: string | number } | [message: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { message: args }
    }

    if (Array.isArray(args)) {
        args = {
            message: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        message: args.message,
    }

    return markAsRead.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::markAsRead
* @see app/Http/Controllers/MessageController.php:77
* @route '/api/driver/messages/{message}/read'
*/
markAsRead.post = (args: { message: string | number } | [message: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MessageController::markAsRead
* @see app/Http/Controllers/MessageController.php:77
* @route '/api/driver/messages/{message}/read'
*/
const markAsReadForm = (args: { message: string | number } | [message: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markAsRead.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MessageController::markAsRead
* @see app/Http/Controllers/MessageController.php:77
* @route '/api/driver/messages/{message}/read'
*/
markAsReadForm.post = (args: { message: string | number } | [message: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markAsRead.url(args, options),
    method: 'post',
})

markAsRead.form = markAsReadForm

const MessageController = { sendMessage, getAssignmentMessagesWeb, getMessages, getAssignmentMessages, markAsRead }

export default MessageController