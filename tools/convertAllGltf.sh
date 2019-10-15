#!/bin/bash
for i in $(ls); do if [ -d $i ];then  dir=${i%/}; gltf-pipeline -i "$dir/scene.gltf" -o "$dir.glb" ; fi; done