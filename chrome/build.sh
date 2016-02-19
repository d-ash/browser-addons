#!/bin/bash

if [ -z "$1" ]; then
	echo 'Usage: ./build.sh <version>'
	exit 1
fi

VERSION="$1"
SCRIPTSTR="		SCRIPT_URL = 'https:\/\/nameyourhorse.com\/js\/agent.js',"
SRC='src'
TMP='tmp'
PUBLICDIR='../../public/addons/chrome'
FN="$PUBLICDIR/nameyourhorse-$VERSION.crx"
UPDATEFN="$PUBLICDIR/update.xml"
ID='kjjahhhefcflldlhkndfiolnmhnlpcff'	# based on public key, chrome://extensions

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

sed -i -e "s/^.\+SCRIPT_URL =.\+$/$SCRIPTSTR/g" init.js
# Because Chrome does not allow {__EXTENSION_VERSION__} in development mode:
sed -i -e "s/^.\+\"version\":.\+$/	\"version\": \"$VERSION\",/" manifest.json

cd ..
echo 'Packing...'
chrome --pack-extension=$TMP --pack-extension-key=secret.pem
rm -rf $TMP
mv $TMP.crx $FN

cp update.xml.dev $UPDATEFN
sed -i -e "s/{__EXTENSION_VERSION__}/$VERSION/g" $UPDATEFN
sed -i -e "s/{__EXTENSION_ID__}/$ID/g" $UPDATEFN

read -p "Set this version as the latest (y/n)? " -n 1
if [ $REPLY == "y" ]; then
	cd $PUBLICDIR
	ln -f -s ../$FN nameyourhorse-latest.crx
	cd -
	echo "Ok, nameyourhorse-latest.crx is linked to $FN now."
fi

