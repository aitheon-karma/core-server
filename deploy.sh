#!/bin/bash

set -ex

COMMAND_PREFIX="./node_modules/@aitheon/core-server"
# build and push image to registery
${COMMAND_PREFIX}/build.sh ${1} ${2}
CURRENT_DIR="${PWD##*/}"
NAMESPACE="$CURRENT_DIR"

# deploy k8s
kubectl apply -f ./k8s/0-namespace.yaml --namespace=$NAMESPACE
kubectl get secret shared-config --export -o yaml | kubectl apply --namespace=$NAMESPACE -f -
if [ -f "k8s/init.sh" ]; then
  ./k8s/init.sh
fi
kubectl apply -f ./k8s --namespace=$NAMESPACE
