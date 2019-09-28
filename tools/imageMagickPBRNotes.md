# imageMagick PRB Notes

## create MeshStandardMaterial AoRM map example

`~/Dropbox/DEV/bforest-threejs-sketches/tools/createAoRM.sh Metal_DamagedIron_2k_ao.jpg Metal_DamagedIron_2k_roughness.jpg Metal_DamagedIron_2k_metallic.jpg`

If we're missing a material, at this point, we must make a black image to use in the above command. The image must be the same dimensions as the other images, otherwise the mapping wont line up.

`~/Dropbox/DEV/bforest-threejs-sketches/tools/makeBlackPng.sh 4096x4096`

To convert result to jpg:

`convert -quality 95 aorm.png aorm.jpg`

To strip the color profile from a png:

`convert -strip aorm.png aorm1.png`
