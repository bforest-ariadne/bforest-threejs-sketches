#!/bin/bash

RED=${1?Error: no red channel given}
GREEN=${2?Error: no green channel given}
BLUE=${3?Error: no blue channel given}

convert $1 $2 $3 -set colorspace RGB -combine aorm.png

convert -strip aorm.png aorm.png