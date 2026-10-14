# Jolio — run the containerized web + api stack (Laravel on Postgres).
# Usage: make up | make down | make logs | make health | make help

COMPOSE := docker compose
ENV_FILE := .env

API_PORT := $(shell grep -E '^API_PORT=' $(ENV_FILE) 2>/dev/null | cut -d= -f2)
API_PORT := $(or $(API_PORT),8000)
WEB_PORT := $(shell grep -E '^WEB_PORT=' $(ENV_FILE) 2>/dev/null | cut -d= -f2)
WEB_PORT := $(or $(WEB_PORT),3000)
ADMINER_PORT := $(shell grep -E '^ADMINER_PORT=' $(ENV_FILE) 2>/dev/null | cut -d= -f2)
ADMINER_PORT := $(or $(ADMINER_PORT),8081)

.DEFAULT_GOAL := help

$(ENV_FILE):
	@cp .env.example $(ENV_FILE)
	@echo "$(ENV_FILE) created from .env.example - set POSTGRES_PASSWORD, then re-run make."

.PHONY: help up start down restart rebuild config ps logs logs-api logs-web health migrate fresh shell-api shell-web shell-db shell-frontend shell-backend clean

help: ## Show this help
	@grep -E '^[a-z-]+: .*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ": .*## "}; {printf "  %-10s %s\n", $$1, $$2}'

up: $(ENV_FILE) ## Build images and start the web + api (+ postgres) containers
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  web:     http://localhost:$(WEB_PORT)"
	@echo "  api:     http://localhost:$(API_PORT)  (health: /up)"
	@echo "  adminer: http://localhost:$(ADMINER_PORT)  (server: db, user/pass/db from .env)"

start: $(ENV_FILE) ## Start containers without rebuilding
	$(COMPOSE) up -d

down: ## Stop containers (keep data volumes)
	$(COMPOSE) down

restart: ## Restart containers
	$(COMPOSE) restart

rebuild: $(ENV_FILE) ## Rebuild images from scratch and restart
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

config: $(ENV_FILE) ## Validate the resolved compose file
	$(COMPOSE) config

ps: ## List container status
	$(COMPOSE) ps

logs: ## Follow logs of all services
	$(COMPOSE) logs -f --tail=100

logs-api: ## Follow Laravel api logs
	$(COMPOSE) logs -f --tail=100 api

logs-web: ## Follow Next.js web logs
	$(COMPOSE) logs -f --tail=100 web

health: ## Smoke-test both containers (api /up + web /)
	@curl -sf http://localhost:$(API_PORT)/up && echo "  api OK"
	@curl -sf -o /dev/null http://localhost:$(WEB_PORT)/ && echo "  web OK"

migrate: ## Run pending Laravel migrations (api must be up)
	$(COMPOSE) exec api php artisan migrate --force

fresh: ## Wipe the database and re-run migrations (destroys data, no seeding: image has no dev deps)
	$(COMPOSE) exec api php artisan migrate:fresh --force

shell-api: ## Open a shell in the api container
	$(COMPOSE) exec api bash

shell-web: ## Open a shell in the web container
	$(COMPOSE) exec web sh

shell-frontend: ## Open a shell in the frontend (web) container
	$(COMPOSE) exec web sh

shell-backend: ## Open a shell in the backend (api) container
	$(COMPOSE) exec api bash

shell-db: ## Open psql in the postgres container
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

clean: ## Stop containers AND delete data volumes (destroys the database)
	$(COMPOSE) down -v
