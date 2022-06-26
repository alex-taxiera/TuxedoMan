FROM node:16-alpine

RUN apk update && apk add --no-cache git openssh
RUN mkdir -p /tuxedo
WORKDIR /tuxedo

COPY package.json package-lock.json ./
RUN npm ci --no-optional --only=prod --ignore-scripts
COPY . .

CMD ["npm", "start"]
