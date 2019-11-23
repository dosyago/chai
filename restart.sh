#!/bin/sh

sudo pm2 stop ./run.sh
sudo killall node npm
./rebuild_hashes.js
sudo pm2 start ./run.sh
