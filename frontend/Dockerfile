FROM node:alpine as build_front

WORKDIR '/usr/app'
COPY package.json package.json
RUN npm install
COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]