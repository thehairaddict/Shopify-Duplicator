FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY ./backend/package*.json ./
RUN npm install --omit=dev
COPY ./backend .
EXPOSE 3000
CMD ["npm", "start"]
