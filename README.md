```
REGISTRY="890606282206.dkr.ecr.eu-west-1.amazonaws.com"
CURRENT_DIR="${PWD##*/}"
IMAGE_NAME="$CURRENT_DIR"
TAG=latest

docker build -t ${IMAGE_NAME} .
docker tag ${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:${TAG}
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
```





NPM_CLIENT_LIB_NAME=@aitheon/item-manager
docker run --rm -v ${PWD}:/local aitheon/openapi-generator-cli generate --skip-validate-spec \
-i /local/server/docs/swagger.json \
-g typescript-node \
-o /local/libs/${NPM_CLIENT_LIB_NAME}-server \
-D modelPropertyNaming=original \
-D supportsES6=true \
-D prependFormOrBodyParameters=true \
-D sortParamsByRequiredFlag=true \
-D npmName=${NPM_CLIENT_LIB_NAME}-server