#!/bin/sh


OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  # Mac OS X
  ./scripts/mac_install_deps.sh
   cp policy.xml /opt/homebrew/etc/ImageMagick-*/
elif [ "$OS" = "FreeBSD" ]; then
  # FreeBSD
  sudo ./scripts/install_deps.sh
  sudo mkdir -p /etc/ImageMagick
  sudo cp policy.xml /etc/ImageMagick/
  sudo cp policy.xml /etc/ImageMagick-*/
else
  sudo ./scripts/nix_install_deps.sh
  sudo mkdir -p /etc/ImageMagick
  sudo cp policy.xml /etc/ImageMagick/
  sudo cp policy.xml /etc/ImageMagick-*/
fi


mkdir -p pdfs
if [ ! -f "pdfs/hashes.json" ]; then
  echo "[]" > pdfs/hashes.json
fi

npm i
which pm2 || npm i -g pm2


