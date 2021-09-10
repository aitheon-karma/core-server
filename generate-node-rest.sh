#!/bin/bash
set -ex

if [ -f ".env" ]; then
 export $(cat .env | xargs)
fi

CURRENT_DIR="${PWD##*/}"
PROJECT_NAME=${CURRENT_DIR:3}

NPM_CLIENT_LIB_NAME=${NPM_CLIENT_LIB_NAME:-$PROJECT_NAME}
# prefix with server
NPM_CLIENT_LIB_NAME=${NPM_CLIENT_LIB_NAME}-server

echo "Generate lib: $NPM_CLIENT_LIB_NAME"
# cleanup
rm -rf dist-libs/$NPM_CLIENT_LIB_NAME
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

echo "Generating code..."
$COMMAND generate --skip-validate-spec \
    -i ${FOLDER_PREFIX}server/docs/swagger.json \
    -g typescript-node \
    -o ${FOLDER_PREFIX}dist-libs/${NPM_CLIENT_LIB_NAME} \
    -D modelPropertyNaming=original \
    -D supportsES6=true \
    -D prependFormOrBodyParameters=true \
    -D sortParamsByRequiredFlag=true \
    -D npmName=@aitheon/${NPM_CLIENT_LIB_NAME}
echo "Code generation done."

set +e
VERSION=$(npm show @aitheon/$NPM_CLIENT_LIB_NAME version)
COMMAND_PREFIX="./node_modules/@aitheon/core-server"

mkdir -p dist-libs/

if [ $NPM_IGNORE_PUBLISH = "true" ]; then
  echo "Ignoring publish lib from as per param";
  exit 0
fi

echo "Downloading previous lib..."
AUTH_HEADER="Authorization: Bearer ${NPM_TOKEN}"
curl -X GET \
  https://registry.npmjs.org/@aitheon/${NPM_CLIENT_LIB_NAME}/-/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz \
  -H "$AUTH_HEADER" --output dist-libs/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz
tar -xzf dist-libs/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz -C dist-libs

echo "Checking lib changes..."
dir1="./dist-libs/${NPM_CLIENT_LIB_NAME}"
dir2="./dist-libs/package"
files=$(cd $dir1 && find . -type f ! -name '.gitignore' ! -name 'package.json' | cut -d: -f1)
LIB_IS_DIFFERENT="";

for file in $files; do
    # echo "$dir1/$file VS $dir2/$file"
    DIFF_RESULT=$(diff -q -N $dir1/$file $dir2/$file)
    if [ ! -z "$DIFF_RESULT" ]; then
      echo "Library different. Need to publish new library. Changes at $file"
      LIB_IS_DIFFERENT="true"
    # else
    #   echo "$file - No changes"
    fi
done
echo "Check changes done."
set -e

USE_VERSION_UP="true"
if [ ! -d "dist-libs/package" ]; then
  # Package not deployed
  LIB_IS_DIFFERENT="true"
  USE_VERSION_UP="false"
  # Always version up lib
  echo "Package not exist. Publish new version"
fi

if [[ $LIB_IS_DIFFERENT = 'true' ]]; then
    if [[ $USE_VERSION_UP = 'true' ]]; then
      NPM_CLIENT_LIB_VERSION=$($COMMAND_PREFIX/increment_version.sh -m $VERSION)
      cd "dist-libs/${NPM_CLIENT_LIB_NAME}"
      echo "Change version to $NPM_CLIENT_LIB_VERSION"
      npm version $NPM_CLIENT_LIB_VERSION 
    else 
      cd "dist-libs/${NPM_CLIENT_LIB_NAME}"
    fi
    echo "Start build lib... "
    cd "/opt/app/dist-libs/${NPM_CLIENT_LIB_NAME}"
    npm install && npm install --only=dev
    echo "Installed dependencies. Start compile."
    echo $(ls node_modules/.bin)
    node_modules/.bin/tsc
    echo "Build done."
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
    echo "Start publish lib..."
    npm publish
    echo "Lib published"
else 
    echo "Library not changed. Skip publish."
fi
