#!/bin/bash

build_layer () {
  layer_directory=$(echo $1 | tr -d '\r')
  current_directory=$(pwd)

  echo "Building Layer -> $layer_directory"

  # Positioning in layer folder
  cd $layer_directory
  
  # Cleaning dependencies
  rm -rf nodejs

  # Copying package.json
  mkdir nodejs && cp package.json ./nodejs

  # Installing dependencies
  cd nodejs 
  mkdir node_modules 
  npm install
  cd ..
  
  # Copying .js files to node_modules
  # cp ./*.js ./nodejs/node_modules
  cp ./**/*.js ./nodejs/node_modules
  
  cd "$current_directory"
}

# Build layers
for layer in layers/*/; do
  build_layer $layer
done