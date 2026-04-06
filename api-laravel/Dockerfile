FROM composer:2.8 AS vendor

WORKDIR /app

COPY . .
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress

FROM php:8.3-cli-bookworm AS runtime

WORKDIR /app

RUN docker-php-ext-install pdo_mysql

COPY --from=vendor /app /app

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=10 CMD php -r "exit(@file_get_contents('http://127.0.0.1:8000/api/health') !== false ? 0 : 1);"

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
