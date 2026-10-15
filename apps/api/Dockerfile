FROM php:8.4-apache

# System deps + PHP extensions Laravel 11 needs (incl. pgsql driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl zip unzip \
        libpq-dev libzip-dev \
        postgresql-client \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql pgsql bcmath zip exif pcntl \
    && a2enmod rewrite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Serve Laravel's public/ directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
        /etc/apache2/apache2.conf \
        /etc/apache2/conf-available/*.conf

# Composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

# Install PHP deps first (better layer caching)
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress --no-scripts

# Virgin application code
COPY apps/api/ ./
COPY shared/validation ./shared/validation

# Run the composer scripts now that artisan exists (no APP_KEY/DB needed here)
RUN composer dump-autoload --optimize --no-dev \
 && php artisan package:discover --ansi

# Writable dirs for the web user
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
