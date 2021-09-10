#!/bin/bash
set -ex

REGISTRY="890606282206.dkr.ecr.eu-west-1.amazonaws.com"
CURRENT_DIR="${PWD##*/}"
IMAGE_NAME="core-server-clientless"
TAG=latest

$(aws ecr get-login --no-include-email)

docker build -f clientless.Dockerfile . -t ${IMAGE_NAME}
docker tag ${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:${TAG}
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}