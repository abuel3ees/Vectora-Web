<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\DispatchRoute;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'view users', 'create users', 'edit users', 'delete users',
            'view routes', 'create routes', 'edit routes', 'delete routes'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create Roles
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $dispatcher = Role::firstOrCreate(['name' => 'dispatcher']);
        $dispatcher->givePermissionTo(['view users', 'view routes', 'create routes', 'edit routes']);

        $driver = Role::firstOrCreate(['name' => 'driver']);
        $driver->givePermissionTo(['view routes']);

        // Create Users
        $adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);
        $adminUser->assignRole($admin);

        $dispatcherUser = User::factory()->create([
            'name' => 'Dispatcher User',
            'email' => 'dispatcher@example.com',
            'password' => bcrypt('password'),
        ]);
        $dispatcherUser->assignRole($dispatcher);

        $driverUser = User::factory()->create([
            'name' => 'Driver User',
            'email' => 'driver@example.com',
            'password' => bcrypt('password'),
        ]);
        $driverUser->assignRole($driver);

        // Dummy Data for Routes
        for ($i = 1; $i <= 5; $i++) {
            DispatchRoute::create([
                'name' => "Route $i",
                'status' => 'pending',
                'description' => "Delivery route #$i",
            ]);
        }
    }
}
