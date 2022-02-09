FROM node:16
ARG NPM_TOKEN
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY ./config /opt/app/config
COPY ./src /opt/app/src
# COPY ./.env /opt/app/
COPY ./package.json ./
# COPY ./yarn.lock ./
COPY .npmrc.docker .npmrc
COPY ./exfabrica-plugin-cms-analyzer-v1.0.0-beta.0.tgz ./
ENV PATH /opt/node_modules/.bin:$PATH
RUN yarn config set network-timeout 600000 -g
RUN yarn install
RUN rm -f .npmrc

WORKDIR /opt/app
COPY ./ .
RUN yarn build
RUN yarn seed
EXPOSE 1337

# need to install puppeteer chrome dependencies
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get install libnspr4 libnss3 libnss3-tools
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
CMD ["yarn", "develop"]