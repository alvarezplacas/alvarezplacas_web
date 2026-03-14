# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json .

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

CMD ["node", "./dist/server/entry.mjs"]
