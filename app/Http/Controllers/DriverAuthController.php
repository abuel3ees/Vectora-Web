<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DriverAuthController extends Controller
{
    /**
     * Login endpoint for driver authentication.
     * Returns access token for Sanctum authentication.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find user by email
        $user = User::where('email', $credentials['email'])->first();

        // Validate password
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'ok' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Generate Sanctum token
        $token = $user->createToken('driver-mobile-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'driver' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 200);
    }

    /**
     * Logout endpoint for driver.
     * Revokes current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke all tokens for the user (or just the current one)
        $request->user()->tokens()->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Logout successful',
        ], 200);
    }

    /**
     * Get authenticated driver profile.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
        ], 200);
    }

    /**
     * Heartbeat — driver app pings this every ~2 min while foregrounded.
     * Updates last_seen_at so the dashboard can show "online now".
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $request->user()->update(['last_seen_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * Store the driver's FCM device token for push notifications.
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate(['fcm_token' => ['required', 'string', 'max:512']]);

        $request->user()->update(['fcm_token' => $request->fcm_token]);

        return response()->json(['ok' => true]);
    }

    /**
     * Refresh token endpoint.
     * Creates a new token while keeping the old one valid.
     * (In a production system, you'd invalidate the old token)
     */
    public function refreshToken(Request $request): JsonResponse
    {
        // Check if user has a valid token
        try {
            $user = auth('sanctum')->user();
            
            if (!$user) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Create a new token
            $newToken = $user->createToken('driver-mobile-app')->plainTextToken;

            return response()->json([
                'ok' => true,
                'message' => 'Token refreshed successfully',
                'token' => $newToken,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Token refresh failed',
            ], 401);
        }
    }
}
