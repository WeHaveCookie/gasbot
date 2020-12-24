# must use full node for some node-gyp and script stuffs
FROM node:12:latest

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

CMD [ "node", "index.js" ]
