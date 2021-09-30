#!/bin/sh

pm2=$(which pm2)
sudo $pm2 stop ./run.sh
sudo killall node npm
./rebuild_hashes.js
sudo $pm2 start ./run.sh
