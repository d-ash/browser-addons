#!/bin/bash

if [ -z "$1" ]; then
	echo 'Usage: ./build.sh <version>'
	exit 1
fi

VERSION="$1"
SCRIPTSTR="		SCRIPT_URL = 'https:\/\/nameyourhorse.com\/js\/agent.js',"
SRC='src'
TMP='tmp'
PUBLICDIR='../../public/addons/opera'
FN="$PUBLICDIR/nameyourhorse-$VERSION.oex"
UPDATEFN="$PUBLICDIR/update.xml"

if [ -f $FN ]; then
	rm $FN
fi

if [ -d $TMP ]; then
	echo "'$TMP' already exists"
	exit 1
fi

echo 'Coping...'
cp -R $SRC $TMP
find $TMP -type f -name '*~' | xargs rm
find $TMP -type f -name '*.swp' | xargs rm
cd $TMP

sed -i -e "s/^.\+SCRIPT_URL =.\+$/$SCRIPTSTR/g" includes/injected.js
sed -i -e "s/{__EXTENSION_VERSION__}/$VERSION/g" config.xml

echo 'Ziping...'
zip -r ../$FN *
cd ..
rm -rf $TMP

cp update.xml.dev $UPDATEFN
sed -i -e "s/{__EXTENSION_VERSION__}/$VERSION/g" $UPDATEFN

read -p "Set this version as the latest (y/n)? " -n 1
if [ $REPLY == "y" ]; then
	cd $PUBLICDIR
	ln -f -s ../$FN nameyourhorse-latest.oex
	cd -
	echo "Ok, nameyourhorse-latest.oex is linked to $FN now."
fi
