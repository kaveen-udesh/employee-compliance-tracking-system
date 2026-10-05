.PHONY: api dashboard job events seed install

install:
	cd api && npm install
	cd dashboard && npm install
	python3 -m venv scheduler/.venv
	scheduler/.venv/bin/pip install -r scheduler/requirements.txt

seed:
	cd api && npx prisma db push && npx prisma db seed

api:
	cd api && npm run start:dev

dashboard:
	cd dashboard && npm run dev

job:
	scheduler/.venv/bin/python -m scheduler

events:
	scheduler/.venv/bin/python -m scheduler.receive
