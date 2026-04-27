<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\DriverAssignment;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    /**
     * Get all unread messages for the authenticated driver
     */
    public function getMessages(Request $request): JsonResponse
    {
        $driver = auth()->user();
        
        $messages = Message::query()
            ->whereHas('assignment', fn ($q) => 
                $q->where('driver_id', $driver->id)
            )
            ->orWhere('dispatcher_id', $driver->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'content' => $msg->content,
                'type' => $msg->type,
                'is_read' => $msg->is_read,
                'assignment_id' => $msg->assignment_id,
                'dispatcher_name' => $msg->dispatcher?->name ?? 'System',
                'created_at' => $msg->created_at?->toIso8601String(),
                'read_at' => $msg->read_at?->toIso8601String(),
            ]);

        return response()->json([
            'ok' => true,
            'messages' => $messages,
            'unread_count' => Message::whereHas('assignment', fn ($q) => 
                $q->where('driver_id', $driver->id)
            )->unread()->count(),
        ]);
    }

    /**
     * Get messages for a specific assignment
     */
    public function getAssignmentMessages(int $assignmentId): JsonResponse
    {
        $assignment = DriverAssignment::findOrFail($assignmentId);
        abort_unless($assignment->driver_id === auth()->id(), 403);

        $messages = Message::forAssignment($assignmentId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'content' => $msg->content,
                'type' => $msg->type,
                'is_read' => $msg->is_read,
                'dispatcher_name' => $msg->dispatcher?->name ?? 'System',
                'created_at' => $msg->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'ok' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Mark a message as read
     */
    public function markAsRead(int $messageId): JsonResponse
    {
        $message = Message::findOrFail($messageId);
        $message->markAsRead();

        return response()->json([
            'ok' => true,
            'message' => [
                'id' => $message->id,
                'is_read' => $message->is_read,
                'read_at' => $message->read_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Message history for a given assignment — consumed by the web dispatch panel.
     */
    public function getAssignmentMessagesWeb(int $assignmentId): JsonResponse
    {
        $messages = Message::forAssignment($assignmentId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($msg) => [
                'id'              => $msg->id,
                'content'         => $msg->content,
                'type'            => $msg->type,
                'is_read'         => $msg->is_read,
                'dispatcher_name' => $msg->dispatcher?->name ?? 'System',
                'created_at'      => $msg->created_at?->toIso8601String(),
            ]);

        return response()->json(['ok' => true, 'messages' => $messages]);
    }

    /**
     * Send a message to a driver (dispatcher only)
     */
    public function sendMessage(Request $request, int $assignmentId): JsonResponse
    {
        $this->authorize('create routes');

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'type' => 'required|in:instruction,alert,note',
        ]);

        $assignment = DriverAssignment::findOrFail($assignmentId);

        $message = Message::create([
            'dispatcher_id' => auth()->id(),
            'assignment_id' => $assignmentId,
            'content' => $validated['content'],
            'type' => $validated['type'],
        ]);

        // Push notification to driver
        $driver = $assignment->driver;
        if ($driver && $driver->fcm_token) {
            $typeLabel = match ($validated['type']) {
                'alert'       => '⚠️ Alert',
                'instruction' => '📋 Instruction',
                default       => '📝 Note',
            };
            (new FirebaseService())->sendToDriver(
                fcmToken: $driver->fcm_token,
                title: $typeLabel . ' from Dispatch',
                body: $validated['content'],
                data: [
                    'type'          => 'message',
                    'message_id'    => (string) $message->id,
                    'assignment_id' => (string) $assignmentId,
                    'message_type'  => $validated['type'],
                ],
            );
        }

        return response()->json([
            'ok' => true,
            'message' => [
                'id' => $message->id,
                'assignment_id' => $message->assignment_id,
                'content' => $message->content,
                'type' => $message->type,
                'created_at' => $message->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}
