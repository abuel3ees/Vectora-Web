import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

// Check if PHP is available (required for wayfinder type generation)
function isPhpAvailable() {
    try {
        execSync('php --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        ...(isPhpAvailable()
            ? [
                  wayfinder({
                      formVariants: true,
                  }),
              ]
            : []),
    ],
});
