#!/bin/sh

pm2=$(which pm2)
sudo $pm2 stop ./scripts/run.sh
sudo killall node npm
./src/rebuild_hashes.js
sudo $pm2 start ./scripts/run.sh
