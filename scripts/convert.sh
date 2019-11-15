#!/bin/sh

echo $1

base=$2
format=$3

if [ -z $format ]; then
  format="png"
fi

cp $base/index.html $1.html

convert -verbose -density 100 -background ivory -alpha remove -alpha off $1 +adjoin $1-%04d.$format

