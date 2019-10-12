import os
import sys

folder = '/Users/bglawe/Production/textures/pbr/new/RustyPaintedMetal01_mult/'
folder=sys.argv[1]
# print(folder)
# taken from https://stackoverflow.com/questions/7160865/replacing-filename-characters-with-python
count = 0
for root, dirs, filenames in os.walk(folder):
  for filename in filenames:
    # exclude hidden files
    new_name, ext = os.path.splitext(filename)
    if not filename[0] == '.':
      # print(filename) #should display AC-5400ES.txt
      new_name = filename.lower()
      new_name = new_name.replace("base_color_","basecolor")
      new_name = new_name.rsplit('_', 1)[-1]
      new_name, ext = os.path.splitext(new_name)
      if new_name[0] == 'a':
        new_name = 'ao'
      if new_name[0] == 'o':
        new_name = 'ao'
      if new_name[0] == 'r':
        new_name = 'roughness'
      if new_name[0] == 'ma':
        new_name = '_mask'
      if new_name[0] == 'm':
        new_name = 'metallic'
      if new_name[0] == '_mask':
        new_name = 'mask'
      if new_name[0] == 'n':
        new_name = 'normal'
      if new_name[0] == 'c':
        new_name = 'basecolor'
      if new_name[0] == 'b':
        new_name = 'basecolor'
      if new_name[0] == 'd':
        new_name = 'height'
      if new_name[0] == 'h':
        new_name = 'height'

      if new_name == 'basecolor':
        count+=1
      if new_name == 'basecolor' and count > 1:
        new_name = new_name+'_'+str(count-1)

      new_name += ext
      print(new_name) #should display AC-5400ES_manual.txt
      fullpath_src = os.path.join(root, filename)
      fullpath_dst = os.path.join(root, new_name)
      os.rename(fullpath_src, fullpath_dst)