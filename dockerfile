# -------- Stage 1: Build --------
FROM node:20-alpine AS builder

WORKDIR /app

# copy package files
COPY package*.json ./

# install deps
RUN npm ci

# copy source
COPY . .

# build project
RUN npm run build


# -------- Stage 2: Production --------
FROM node:20-alpine

WORKDIR /app

# copy only needed files
COPY package*.json ./
RUN npm ci --only=production

# copy dist from builder
COPY --from=builder /app/dist ./dist

# expose port
EXPOSE 6500

# start app
CMD ["node", "dist/main.js"]