FROM node:12-alpine

RUN apk add --no-cache git; mkdir -p /tuxedo
WORKDIR /tuxedo

COPY package.json package-lock.json ./
RUN npm ci --no-optional --only=prod
COPY . .

CMD ["npm", "start"]
