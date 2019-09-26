# imageMagick PRB Notes

## create MeshStandardMaterial AoRM map example

`~/Dropbox/DEV/bforest-threejs-sketches/tools/createAoRM.sh Metal_DamagedIron_2k_ao.jpg Metal_DamagedIron_2k_roughness.jpg Metal_DamagedIron_2k_metallic.jpg`

If we're missing a material, at this point, we must make a black image to use in the above command. The image must be the same dimensions as the other images, otherwise the mapping wont line up.

`~/Dropbox/DEV/bforest-threejs-sketches/tools/makeBlackPng.sh 4096x4096`

To convert result to png:

`convert aorm.png aorm.jpg`

To strip the color profile from a png:

`convert -strip aorm.png aorm1.png`

# notes about creating basis pbr materials

## order

- must start with PNGs not jpgs
- create aorm map with above imagemagick scripts
- generate mip maps and convert to basis with basisu: https://github.com/BinomialLLC/basis_universal
  - example: `basisu.exe -mipmap -q 190 -linear iron1_generic/aorm.png -output_path iron1_generic/`
  - use  `-linear` for non basecolor maps
- export gltf of object containing material you want to export. In console in `dev` mode `webgl.exportGLTF(webgl.sceneObj.plane, { binary: false, embedImages: false, material: true})`
- in that exported gltf file do the following:
  - after `meshes` add:
  ``` javascript
  "extensionsUsed": [
    "GOOGLE_texture_basis",
    "KHR_texture_transform"
  ],
  "extensionsRequired": [
    "GOOGLE_texture_basis"
  ]
  ```
  - change image `"uris"` to your basis files
  - change `""mimeType""` to `"image/basis"`
  - in `"textures"` add the following to each texture dictionary. make sure to change the "source" property to match your texture's.
  ```javascript
  "extensions": {
    "GOOGLE_texture_basis": {
      "source": 2
    }
  }
  ```
- 
