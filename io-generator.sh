#!/bin/bash

GENERATOR_PATH="node_modules/@aitheon/core-server/dist/io-generator";

if [ ! -f $GENERATOR_PATH ]; then
  # Package not deployed
  node $GENERATOR_PATH
fi