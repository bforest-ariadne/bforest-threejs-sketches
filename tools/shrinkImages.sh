#!/bin/bash

mkdir "512"

# convert any pngs we created into jpgs
for f in *; do
  convert "$f" -resize 512x512\> "512/${f}"
done

mkdir "256"

# convert any pngs we created into jpgs
for f in *; do
  convert "$f" -resize 256x256\> "256/${f}"
done

mkdir "1024"

# convert any pngs we created into jpgs
for f in *; do
  convert "$f" -resize 1024x1024\> "1024/${f}"
done

