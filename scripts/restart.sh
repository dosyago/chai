#!/bin/sh

source ~/.nvm/nvm.sh

if [ ! -f ./secrets/key.js ]; then
  echo "You need to fill in ./secrets/key.js to set your app secret."
  exit 1
fi

pm2=$(which pm2)
sudo=""

if command -v sudo; then
  sudo="sudo"
fi


$sudo $pm2 delete run-docspark
$sudo $pm2 stop ./scripts/run-docspark.sh
$sudo killall node npm
./src/rebuild_hashes.js
$sudo $pm2 start ./scripts/run-docspark.sh
$sudo $pm2 logs run-docspark
