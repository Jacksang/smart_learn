FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
