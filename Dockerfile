FROM node:16-alpine

ARG RUN_NUMBER
ENV BUILD_NUMBER $RUN_NUMBER

RUN mkdir -p /tuxedo
WORKDIR /tuxedo

COPY package.json package-lock.json ./
RUN npm ci --no-optional --only=prod --ignore-scripts
COPY . .

CMD ["npm", "start"]
