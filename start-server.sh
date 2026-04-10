#!/bin/bash
cd /home/sheng/.openclaw/workspace/projects/Smart_Learn
export DB_HOST=127.0.0.1
export DB_NAME=eva3_db
export DB_USER=eva3
export DB_PASSWORD=evapass123
export NODE_ENV=development
node backend/config/server.js
