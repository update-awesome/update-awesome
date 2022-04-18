#!/bin/bash
set -e
cd $1

BRANCH=`git branch --show-current`
WITH_STARS=`git branch --list with-stars`

# echo $BRANCH $WITH_STARS
if [[ -z ${WITH_STARS} ]]; then
  git checkout -b with-stars
else
  git checkout with-stars
fi

trap 'git checkout $BRANCH' EXIT

mv 'awesome-with-stars.md' 'README.md'

STATUS=`git status -s`
if [[ -n ${STATUS} ]]; then
  git add .
  git commit -m 'update README to with stars'
  git push -u origin with-stars
fi
