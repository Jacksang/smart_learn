.PHONY: dev build deploy down restart logs status clean

# Start in development mode (local, no Docker)
dev:
	cd backend && node server.js &
	cd frontend && npm run dev

# Build Docker images
build:
	docker compose build

# Deploy (start all services)
deploy:
	docker compose up -d --build
	@echo "✅ Deployed! http://localhost"

# Stop all services
down:
	docker compose down

# Restart
restart:
	docker compose down
	docker compose up -d

# View logs
logs:
	docker compose logs -f --tail=100

# Show status
status:
	docker compose ps

# Full clean (WARNING: removes database volume!)
clean:
	docker compose down -v
	rm -rf backend/uploads/*
	@echo "🧹 Cleaned. Database volume removed."
