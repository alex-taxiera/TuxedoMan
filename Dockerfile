FROM node:12-alpine

RUN apk add --no-cache git; mkdir -p /tuxedo
WORKDIR /tuxedo

COPY . .
RUN npm ci --no-optional --only=prod

CMD ["npm", "start"]
