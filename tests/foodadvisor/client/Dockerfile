FROM node:16 
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile


COPY . .
RUN yarn build

EXPOSE 3000

CMD [ "yarn", "dev" ]