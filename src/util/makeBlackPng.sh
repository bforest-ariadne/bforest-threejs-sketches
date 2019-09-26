#!/bin/bash
SIZE=${1?Error: no size given: example: 2048x2048}

convert -size 4096x4096 xc:black blackimage.png