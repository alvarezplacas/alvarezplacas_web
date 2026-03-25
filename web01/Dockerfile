# Using Node 22 Alpine as per instructions-ia.md
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# "npm run dev -- --host 0.0.0.0" as per instructions-ia.md
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
