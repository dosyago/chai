#!/bin/sh

sudo mkdir -p /etc/ImageMagick
sudo cp policy.xml /etc/ImageMagick
sudo cp policy.xml /etc/ImageMagick-6
sudo ./install_deps.sh
sudo ./nix_install_deps.sh
npm i
npm i -g pm2
sudo npm i -g pm2



