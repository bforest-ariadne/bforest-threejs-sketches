for d in */; do
  test "$d" = "notOpen/" && continue
  test "$d" = "studio_small_02_512/" && continue
  test "$d" = "studio_small_02_1024/" && continue
  echo "$d";
  cd $d;
  if [[ -e aorm.jpg ]]; then cd ../ && continue; fi
  # ls;
  ~/Dropbox/DEV/bforest-threejs-sketches/tools/renameTextures.sh
  echo "$d converted"
  cd ../
done