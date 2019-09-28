#!/bin/bash

# remove everything before last underscore
find . -type f -name "*_*" -exec bash -c 'f="$1"; g="${f/*_/}"; mv -- "$f" "$g"' _ '{}' \;

# convert name to lowercase
for f in *; do mv "$f" "$f.tmp"; mv "$f.tmp" "`echo $f | tr "[:upper:]" "[:lower:]"`"; done

# convert files to png if not png TODO: try * instead of *.jpg
# mogrify -format png *.jpg

for f in a*.*; do    mv "$f" "ao.${f##*.}"; done
for f in o*.*; do    mv "$f" "ao.${f##*.}"; done
for f in r*.*; do    mv "$f" "roughness.${f##*.}"; done
for f in ma*.*; do    mv "$f" "_mask.${f##*.}"; done
for f in m*.*; do    mv "$f" "metallic.${f##*.}"; done
for f in mask*.*; do    mv "$f" "mask.${f##*.}"; done

for f in n*.*; do    mv "$f" "normal.${f##*.}"; done
for f in c*.*; do    mv "$f" "basecolor.${f##*.}"; done
for f in b*.*; do    mv "$f" "basecolor.${f##*.}"; done
for f in h*.*; do    mv "$f" "height.${f##*.}"; done
for f in d*.*; do    mv "$f" "height.${f##*.}"; done

mogrify -format png ao.jpg
mogrify -format png roughness.jpg
mogrify -format png metallic.jpg

# remove old jpgs
# rm *.jpg

# standardize names
# mv n*.png normal.png
# mv c*.png basecolor.png
# mv b*.png basecolor.png
# mv r*.png roughness.png
# # prevent mask from being converted to metallic
# mv ma*.png _mask.png
# mv m*.png metallic.png
# mv _mask.png mask.png

# mv a*.png ao.png
# mv o*.png ao.png
# mv h*.png height.png
# mv d*.png height.png

convert roughness.png -strip roughness.png

# if no ao.png create white image
if [ ! -f ao.png ]; then
    convert roughness.png -evaluate set 100% -alpha off ao.png
fi

# if no metallic.png create black image
if [ ! -f metallic.png ]; then
    convert roughness.png -evaluate set 0 -alpha off metallic.png
fi

convert ao.png -strip ao.png 
convert metallic.png -strip metallic.png 

~/Dropbox/DEV/bforest-threejs-sketches/tools/createAoRM.sh ao.png roughness.png metallic.png

# mogrify -format jpg -quality 95 *.png

for f in *.*; do    if [ ! -f "${f%.*}.jpg" ]; then    echo mogrify -format jpg -quality 95 "${f%.*}.jpg";  fi; done

rm *.png

rm store
