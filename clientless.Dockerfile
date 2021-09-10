# a Node.js application container
FROM node:10-alpine as builder

# install curl
RUN apk update && apk add \
    curl bash \
    && rm -rf /var/cache/apk/*

ENV LANG C.UTF-8

# add a simple script that can auto-detect the appropriate JAVA_HOME value
# based on whether the JDK or only the JRE is installed
RUN { \
    echo '#!/bin/sh'; \
    echo 'set -e'; \
    echo; \
    echo 'dirname "$(dirname "$(readlink -f "$(which javac || which java)")")"'; \
    } > /usr/local/bin/docker-java-home \
    && chmod +x /usr/local/bin/docker-java-home
ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
ENV PATH $PATH:/usr/lib/jvm/java-1.8-openjdk/jre/bin:/usr/lib/jvm/java-1.8-openjdk/bin

ENV JAVA_VERSION 8u201
ENV JAVA_ALPINE_VERSION 8.201.08-r1
ENV LIB_GENERATE_USE_NPM true

RUN set -x \
    && apk add --no-cache \
    openjdk8 \
    && [ "$JAVA_HOME" = "$(docker-java-home)" ]

# RUN npm install @openapitools/openapi-generator-cli@cli-3.3.4 -g
COPY openapi-generator-cli.jar /opt/openapi-generator-cli.jar

RUN mkdir -p /opt/app
WORKDIR /opt/app

ONBUILD ARG NPM_TOKEN
ONBUILD ARG MONGODB_URI
ONBUILD ARG BUILD_ID

ONBUILD ARG NPM_CLIENT_LIB_NAME
ONBUILD ARG NPM_IGNORE_PUBLISH

ONBUILD COPY .npmrc /opt/app/.npmrc
# ONBUILD COPY .npmrc /opt/app/client/.npmrc 

# copy for faster install
ONBUILD COPY package.json /opt/app/package.json
ONBUILD COPY package-lock.json /opt/app/package-lock.json
ONBUILD RUN npm install

# ONBUILD COPY client/package.json /opt/app/client/package.json
# ONBUILD COPY client/package-lock.json /opt/app/client/package-lock.json
# ONBUILD RUN cd client && npm install && cd ..

# Copy all code
ONBUILD COPY . /opt/app
ONBUILD RUN npm run server:build
ONBUILD RUN node_modules/@aitheon/core-server/io-generator.sh
#  node node_modules/@aitheon/core-server/dist/io-generator

# ONBUILD RUN node_modules/@aitheon/core-server/generate-node-rest.sh && rm -rf /opt/app/dist-libs

# ONBUILD RUN npm run client:lib
# ONBUILD RUN node_modules/@aitheon/core-server/publish-lib.sh
# ONBUILD RUN npm run client:build:prod

ONBUILD RUN rm -rf .npmrc
