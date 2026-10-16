<?php

use App\Providers\AppServiceProvider;
use Src\Config\Infrastructure\Providers\ConfigServiceProvider;
use Src\Identity\Infrastructure\Providers\IdentityServiceProvider;
use Src\Profile\Infrastructure\Providers\ProfileServiceProvider;

return [
    AppServiceProvider::class,
    IdentityServiceProvider::class,
    ProfileServiceProvider::class,
    ConfigServiceProvider::class,
];
