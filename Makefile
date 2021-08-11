ifneq (,$(wildcard ./.env))
	include .env
	export
	ENV_FILE_PARAM = --env-file .env
endif

build:
	docker-compose up --build --remove-orphans

build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build --remove-orphans

up:
	docker-compose up

up-d:
	docker-compose up -d

up-d-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

down:
	docker-compose down

down-V:
	docker-compose down -v

volume:
	docker volume inspect node-screenshot-v2_redisdata

