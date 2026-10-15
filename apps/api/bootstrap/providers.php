<?php

use App\Providers\AppServiceProvider;
use Src\Identity\Infrastructure\Providers\IdentityServiceProvider;
use Src\Profile\Infrastructure\Providers\ProfileServiceProvider;

return [
    AppServiceProvider::class,
    IdentityServiceProvider::class,
    ProfileServiceProvider::class,
];
