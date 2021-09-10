# a Node.js application container
FROM node:13.2.0-alpine as builder

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
ENV LIB_GENERATE_USE_NPM true

RUN set -x \
    && apk add --no-cache \
    openjdk8 \
    && [ "$JAVA_HOME" = "$(docker-java-home)" ]

# RUN npm install @openapitools/openapi-generator-cli@cli-3.3.4 -g
# COPY openapi-generator-cli.jar /opt/openapi-generator-cli.jar
ADD https://isabel-data.s3-eu-west-1.amazonaws.com/PUBLIC/openapi-generator-cli.jar /opt/openapi-generator-cli.jar

# RUN apk add --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
#   vips-dev fftw-dev gcc g++ make libc6-compat

RUN mkdir -p /opt/app
WORKDIR /opt/app

ENV NODE_OPTIONS=--max_old_space_size=7680

ONBUILD ARG NPM_TOKEN
ONBUILD ARG MONGODB_URI
ONBUILD ARG BUILD_ID
ONBUILD ARG NPM_CLIENT_LIB_NAME
ONBUILD ARG NPM_IGNORE_PUBLISH

ONBUILD COPY .npmrc /opt/app/.npmrc
ONBUILD COPY .npmrc /opt/app/client/.npmrc 

# copy for faster install
ONBUILD COPY package.json /opt/app/package.json
ONBUILD COPY package-lock.json /opt/app/package-lock.json
ONBUILD RUN npm i

ONBUILD COPY client/package.json /opt/app/client/package.json
ONBUILD COPY client/package-lock.json /opt/app/client/package-lock.json
ONBUILD RUN cd client && npm i && cd ..

# Copy all code
ONBUILD COPY . /opt/app
ONBUILD RUN npm run server:build
ONBUILD RUN node_modules/@aitheon/core-server/generate-node-rest.sh && rm -rf /opt/app/dist-libs
ONBUILD RUN node_modules/@aitheon/core-server/generate-rest.sh
ONBUILD RUN node_modules/@aitheon/core-server/io-generator.sh

ONBUILD RUN npm run client:lib
ONBUILD RUN node_modules/@aitheon/core-server/publish-lib.sh
ONBUILD RUN npm run client:build:prod


ONBUILD RUN rm -rf .npmrc client/node_modules
