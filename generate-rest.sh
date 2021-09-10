#!/bin/bash
set -ex

if [ -f ".env" ]; then
 export $(cat .env | xargs)
fi

CURRENT_DIR="${PWD##*/}"
PROJECT_NAME=${CURRENT_DIR:3}

NPM_CLIENT_LIB_NAME=${NPM_CLIENT_LIB_NAME:-$PROJECT_NAME}
# cleanup
rm -rf client/projects/aitheon/$NPM_CLIENT_LIB_NAME/src/lib/rest
# install deps
# npm i 
# build docs builder
# npm run server:build-ts
# generate swagger docs
node node_modules/@aitheon/core-server/dist/docs-build.js
# generate client code
COMMAND="docker run --rm -v ${PWD}:/local aitheon/openapi-generator-cli"
FOLDER_PREFIX="/local/"
if [[ $LIB_GENERATE_USE_NPM == "true" ]]; then
  echo "Using NPM to generate rest";
  COMMAND="java -jar /opt/openapi-generator-cli.jar"
  FOLDER_PREFIX=""
fi

$COMMAND generate --skip-validate-spec \
    -i ${FOLDER_PREFIX}server/docs/swagger.json \
    -g typescript-angular \
    -o ${FOLDER_PREFIX}client/projects/aitheon/$NPM_CLIENT_LIB_NAME/src/lib/rest \
    -D ngVersion=7.0.0 \
    -D fileNaming=kebab-case \
    -D providedInRoot=true \
    -D serviceSuffix=RestService \
    -D modelPropertyNaming=original \
    -D prependFormOrBodyParameters=true
