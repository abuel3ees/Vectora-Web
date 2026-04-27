<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends push notifications via FCM HTTP v1 API.
 *
 * Setup:
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the downloaded JSON to storage/app/firebase-service-account.json
 *   3. That's it — no .env variables needed, no composer packages.
 */
class FirebaseService
{
    private ?string $cachedToken = null;
    private int $tokenExpiresAt = 0;

    public function sendToDriver(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        $credPath = storage_path('app/firebase-service-account.json');

        if (! file_exists($credPath)) {
            Log::channel('stack')->warning('FirebaseService: service account not found at ' . $credPath);
            return false;
        }

        $credentials = json_decode(file_get_contents($credPath), true);

        try {
            $accessToken = $this->accessToken($credentials);
            $projectId   = $credentials['project_id'];

            $payload = [
                'message' => [
                    'token'        => $fcmToken,
                    'notification' => ['title' => $title, 'body' => $body],
                    'data'         => array_map('strval', $data),
                    'android'      => ['priority' => 'high'],
                    'apns'         => [
                        'headers' => ['apns-priority' => '10'],
                        'payload' => ['aps' => ['sound' => 'default']],
                    ],
                ],
            ];

            $response = Http::withToken($accessToken)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $payload);

            if (! $response->successful()) {
                Log::warning('FirebaseService: FCM send failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('FirebaseService: exception sending notification', ['error' => $e->getMessage()]);
            return false;
        }
    }

    private function accessToken(array $credentials): string
    {
        if ($this->cachedToken && time() < $this->tokenExpiresAt - 60) {
            return $this->cachedToken;
        }

        $jwt = $this->buildJwt($credentials);

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        $this->cachedToken    = $response->json('access_token');
        $this->tokenExpiresAt = time() + ($response->json('expires_in') ?? 3600);

        return $this->cachedToken;
    }

    private function buildJwt(array $credentials): string
    {
        $now = time();

        $header  = $this->base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = $this->base64url(json_encode([
            'iss'   => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));

        $data = $header . '.' . $payload;
        openssl_sign($data, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256);

        return $data . '.' . $this->base64url($signature);
    }

    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
