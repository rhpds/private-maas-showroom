#!/bin/bash
# Create antora symlink so nookbag SPA can find content at /antora/modules/
ln -sf . /showroom/www/antora
echo "Created /showroom/www/antora symlink"
