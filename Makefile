.PHONY: up down build logs test test-be test-fe clean

# -V recreates the frontend's anonymous node_modules volume so new deps get picked up
up:
	docker compose up --build -V

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test: test-be test-fe

test-be:
	docker compose run --rm --no-deps backend pytest

test-fe:
	docker compose run --rm --no-deps frontend npm test

# stop everything and delete the SQLite volume
clean:
	docker compose down -v
