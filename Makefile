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
	docker volume inspect screenshot-api_redisdata

monitor-all:
	docker-compose logs

monitor-node:
	docker-compose logs node-app

monitor-redis:
	docker-compose logs redis

monitor-nginx:
	docker-compose logs nginx

clean-up-deep:
	docker image prune --all -f; docker container prune -f; docker volume prune -f; docker rmi $(docker images -q); docker rmi $(docker images -q -f dangling=true); docker rmi $(docker images | grep "^<none>" | awk "{print $3}"); docker volume rm $(docker volume ls -qf dangling=true);

