#!/bin/bash

# # remove everything before last underscore
# find . -type f -name "*_*" -exec bash -c 'f="$1"; g="${f/*_/}"; mv -- "$f" "$g"' _ '{}' \;

# # convert name to lowercase - consider doing this first?
# for f in *; do mv "$f" "$f.tmp"; mv "$f.tmp" "`echo $f | tr "[:upper:]" "[:lower:]"`"; done

python ~/Dropbox/DEV/bforest-threejs-sketches/tools/renamePbr.py $PWD

# standardize texture names
# for f in a*.*; do    mv "$f" "ao.${f##*.}"; done
# for f in o*.*; do    mv "$f" "ao.${f##*.}"; done
# for f in r*.*; do    mv "$f" "roughness.${f##*.}"; done
# for f in ma*.*; do    mv "$f" "_mask.${f##*.}"; done
# for f in m*.*; do    mv "$f" "metallic.${f##*.}"; done
# for f in _mask*.*; do    mv "$f" "mask.${f##*.}"; done

# for f in n*.*; do    mv "$f" "normal.${f##*.}"; done
# for f in c*.*; do    mv "$f" "basecolor.${f##*.}"; done
# for f in b*.*; do    mv "$f" "basecolor.${f##*.}"; done
# for f in h*.*; do    mv "$f" "height.${f##*.}"; done
# for f in d*.*; do    mv "$f" "height.${f##*.}"; done

# convert ao r and m textures to jpg
if [ -f ao.jpg ]; then
    mogrify -format png ao.jpg
fi

if [ -f roughness.jpg ]; then
    mogrify -format png roughness.jpg
fi

if [ -f metallic.jpg ]; then
    mogrify -format png metallic.jpg
fi

# strip color profile from roughness texture
convert roughness.png -strip roughness.png

# if no ao.png create white image
if [ ! -f ao.png ]; then
    convert roughness.png -evaluate set 100% -alpha off ao.png
fi

# if no metallic.png create black image
if [ ! -f metallic.png ]; then
    convert roughness.png -evaluate set 0 -alpha off metallic.png
fi

# strip color profiles from ao and metallic textures
convert ao.png -strip ao.png 
convert metallic.png -strip metallic.png 

# create combined ao roughness and metalic texture.
~/Dropbox/DEV/bforest-threejs-sketches/tools/createAoRM.sh ao.png roughness.png metallic.png


# convert any pngs we created into jpgs
for f in *.*; do    if [ ! -f "${f%.*}.jpg" ]; then    mogrify -format jpg -quality 95 "${f%.*}.png";  fi; done

if [ -f normal.jpg ]; then
    convert normal.jpg -strip normal.jpg
fi

if [ -f height.jpg ]; then
    convert height.jpg -strip height.jpg
fi

if [ -f mask.jpg ]; then
    convert mask.jpg -strip mask.jpg
fi


for f in basecolor*.jpg; do    mv "$f" "basecolor.${f##*.}"; done

# remove the pngs we made
rm *.png

# remove the store file if its there
rm store
