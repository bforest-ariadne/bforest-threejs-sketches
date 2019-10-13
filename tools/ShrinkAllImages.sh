#!/bin/bash

for d in */; do
  echo "$d";
  cd $d;
  if [![ -e aorm.jpg ]]; then cd ../ && continue; fi
  # ls;
  ~/Dropbox/DEV/bforest-threejs-sketches/tools/shrinkImages.sh
  echo "$d converted"
  cd ../
done

