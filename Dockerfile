FROM node:12-alpine

RUN mkdir -p $HOME/bot
WORKDIR $HOME/bot

COPY src src
COPY migrations migrations
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY knexfile.js .
RUN npm install --only=prod

CMD ["npm", "start"]
