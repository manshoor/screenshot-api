# specify base image from dockerhub
FROM node:lts-alpine3.19@sha256:e96618520c7db4c3e082648678ab72a49b73367b9a1e7884cf75ac30a198e454

LABEL version="1.0"
LABEL maintainer="Manshoor Ahmad"
LABEL description="Development image for the SCREENSHOT API"
# Installs latest Chromium (92) package.
RUN  apk -U --no-cache update && apk -U --no-cache add \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn
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
USER 0
RUN npm install -g npm@10.2.3
RUN npm install --global nodemon
RUN npm install && npm cache clean --force
# Run npm-check-updates to see available updates:
#RUN npm outdated
#RUN ncu
# Automatically update your package.json file:
#RUN ncu -u
COPY . .
ARG PORT
COPY --chown=node:node ["package.*json", "npm-shrinkwrap.json*", "./"]
## use EXPOSE command to have our port mapped by the docker daemon
EXPOSE $PORT
USER node

# default dev command
CMD [ "npm", "run", "dev" ]
