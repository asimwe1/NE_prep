#!/bin/bash
# FireShield — first-time setup helper
# Run: bash scripts/setup-env.sh

set -e

echo "🔥 FireShield Setup"
echo "==================="

# Root .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Created root .env"
fi

# Each service
for dir in api-gateway services/auth-service services/customer-service \
           services/notification-service services/escalation-service \
           services/email-service frontend; do
  if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "✅ Created $dir/.env"
  fi
done

echo ""
echo "📝 Next steps:"
echo "  1. Edit each .env file with your actual values"
echo "  2. Set the same JWT_SECRET in all services"
echo "  3. Set your SMTP credentials in services/email-service/.env"
echo "  4. Create the database: psql -U postgres -c \"CREATE DATABASE fire_ext_db;\""
echo "  5. Install dependencies: npm run setup"
echo "  6. Run migrations: npm run db:migrate"
echo "  7. (Optional) Seed test data: npm run db:seed"
echo "  8. Start all services: npm run dev"
echo ""
echo "🌐 Services will run on:"
echo "  API Gateway  → http://localhost:3000"
echo "  Auth         → http://localhost:3001"
echo "  Customer     → http://localhost:3002"
echo "  Notification → http://localhost:3003"
echo "  Escalation   → http://localhost:3004"
echo "  Email        → http://localhost:3005"
echo "  Frontend     → http://localhost:3006"
