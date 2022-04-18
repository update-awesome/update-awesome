#!/bin/bash

# node main $1
cd $1

BRANCH=`git branch --show-current`

git checkout -b with-stars

mv 'awesome-with-stars.md' 'README.md'

git add .

git commit -m 'update README to with stars'

git push -u origin with-stars

git checkout $BRANCH