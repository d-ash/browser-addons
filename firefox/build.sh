#!/bin/bash

if [ -z "$1" ]; then
	echo 'Usage: ./build.sh <version>'
	exit 1
fi

VERSION="$1"
SCRIPTSTR="		SCRIPT_URL = 'https:\/\/nameyourhorse.com\/js\/agent.js',"
SRC='src'
TMP='tmp'
PUBLICDIR='../../public/addons/firefox'
FN="$PUBLICDIR/nameyourhorse-$VERSION.xpi"
UPDATEFN="$PUBLICDIR/update.rdf"

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

sed -i -e "s/{__EXTENSION_VERSION__}/$VERSION/g" 'install.rdf'
sed -i -e "s/^.\+SCRIPT_URL =.\+$/$SCRIPTSTR/g" chrome/content/init.js

echo 'Ziping...'
zip -r ../$FN *
cd ..
rm -rf $TMP

cp update.rdf.dev $UPDATEFN
sed -i -e "s/{__EXTENSION_VERSION__}/$VERSION/g" $UPDATEFN
HASH=$(sha256sum "$FN" | cut -f1 -d' ')
sed -i -e "s/{__XPI_HASH__}/$HASH/g" $UPDATEFN

read -p "Set this version as the latest (y/n)? " -n 1
if [ $REPLY == "y" ]; then
	cd $PUBLICDIR
	ln -f -s ../$FN nameyourhorse-latest.xpi
	cd -
	echo "Ok, nameyourhorse-latest.xpi is linked to $FN now."
fi

printf "\nMUST: run McCoy and do Update -> Sign Update Manifest on $UPDATEFN\n\n"

