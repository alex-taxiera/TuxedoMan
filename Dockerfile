FROM node:12-alpine

RUN apk add --no-cache git; mkdir -p /tuxedo
WORKDIR /tuxedo

COPY src src
COPY migrations migrations
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY knexfile.js .
RUN npm install --only=prod

CMD ["npm", "start"]
