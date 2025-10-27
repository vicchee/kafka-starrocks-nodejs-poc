FROM mirror.gcr.io/library/node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8089

RUN apk add --no-cache tmux

CMD ["node", "src/index.js"]