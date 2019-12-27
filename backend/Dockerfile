FROM node:lts-alpine

ADD dist/server.js /app/server.js
ADD dist/server.js.map /app/server.js.map
ADD config/ /app/config/

WORKDIR /app

# EXPOSE 9443

CMD ["node", "server.js"]