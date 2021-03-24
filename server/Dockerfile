FROM node:10-alpine

WORKDIR /var/www/chat

ENV PATH /var/www/nest-chat-realtime/node_modules/.bin:$PATH

RUN adduser --disabled-password chat

COPY . /var/www/chat

COPY package.json /var/www/chat/package.json
COPY package-lock.json /var/ww/chat/package-lock.json

RUN chown -R chat:chat /var/www/chat
USER chat

RUN npm cache clean
RUN npm install

EXPOSE 3004
CMD ["npm","run","start:dev" ]