# specify base image from dockerhub
FROM node:lts-alpine3.14@sha256:2fbaecb39357dec8af7afacaba214bba1ecb1da55ba8163f6afe531534787f80

LABEL version="1.0"
LABEL maintainer="Manshoor Ahmad"
LABEL description="Development image for the SCREENSHOT API"
RUN apk add --update --no-cache \
            chromium \
            nodejs \
            npm
# Do not use puppeteer embedded chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
ENV CHROMIUM_PATH="/usr/bin/chromium-browser"
ENV PUPPETEER_EXECUTABLE_PATH="${CHROMIUM_PATH}"
# workdir is where our code shall live in the container
# all commands executed relative to this directory
WORKDIR /usr/src/app

# Add node packages to path #
# hadolint ignore=DL3044
ENV PATH="/usr/src/app/node_modules/.bin:${PATH}"

COPY --chown=node:node ["package.*json", "npm-shrinkwrap.json*", "./"]
# Install dependencies and clear npm cache
#RUN npm install && npm cache clean --force
RUN npm i --only=production && npm cache clean --force
COPY . .
# use EXPOSE command to have our port mapped by the docker daemon
EXPOSE 3000
USER node

# default dev command
#CMD [ "npm", "run", "dev" ]
CMD [ "npm", "run", "build" ]
CMD [ "npm", "run", "production" ]
