#!/bin/bash

VERSION=$(npm show @aitheon/$NPM_CLIENT_LIB_NAME version)
COMMAND_PREFIX="./node_modules/@aitheon/core-server"

mkdir -p client/dist/

if [ $NPM_IGNORE_PUBLISH = "true" ]; then
  echo "Ignoring publish lib from as per param";
  exit 0
fi

if [ ! -d "./client/dist/aitheon/${NPM_CLIENT_LIB_NAME}/lib" ]; then
  echo "Lib not builded. ignoring publish."
   exit 0
fi

AUTH_HEADER="Authorization: Bearer ${NPM_TOKEN}"
curl -X GET \
  https://registry.npmjs.org/@aitheon/${NPM_CLIENT_LIB_NAME}/-/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz \
  -H "$AUTH_HEADER" --output client/dist/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz
tar -xzf client/dist/${NPM_CLIENT_LIB_NAME}-${VERSION}.tgz -C client/dist


# cd client
# echo 'Building lib...'
# npm run lib:build
# echo 'Lib builded'
# cd ..


dir1="./client/dist/aitheon/${NPM_CLIENT_LIB_NAME}/lib"
dir2="./client/dist/package/lib"
files=$(cd $dir1 && find . -type f | cut -d: -f1)
LIB_IS_DIFFERENT="";
# NPM_CLIENT_LIB_VERSION="${VERSION:-minor}"

for file in $files; do
    # echo "$dir1/$file VS $dir2/$file"
    DIFF_RESULT=$(diff -q -N $dir1/$file $dir2/$file)
    if [ -z "$DIFF_RESULT" ]
    then
        echo "$file - No changes"
    else
        echo "Library different. Need to publish new library"
        LIB_IS_DIFFERENT="true"
    fi
done

set -ex

USE_VERSION_UP="true"
if [ ! -d "client/dist/package/lib" ]; then
  # Package not deployed
  LIB_IS_DIFFERENT="true"
  USE_VERSION_UP="false"
  # Always version up
  echo "Package not exist. Publish new version"
fi

if [[ $LIB_IS_DIFFERENT = 'true' ]]; then
    if [[ $USE_VERSION_UP = 'true' ]]; then
    NPM_CLIENT_LIB_VERSION=$($COMMAND_PREFIX/increment_version.sh -m $VERSION)
    cd "client/projects/aitheon/${NPM_CLIENT_LIB_NAME}"
    echo "Change version to $NPM_CLIENT_LIB_VERSION"
    npm version $NPM_CLIENT_LIB_VERSION 
    cd ../../..
    else 
    cd "client"
    fi
    echo "Start publish lib..."
    npm run lib:publish
    echo "Lib published"
else 
    echo "Library not changed. Skip publish."
fi
