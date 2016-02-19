Firefox
=======

1.	Create separate Firefox profile 'dev' and use it instead of your personal one.

	firefox -no-remote -P dev

2.	Create file 'firefoxaddon@nameyourhorse.com' in the 'extensions' folder:

	for Windows 7:
		C:\Users\<User>\Application Data\Mozilla\Firefox\Profiles\<DEV PROFILE>\extensions\
	for Unix:
		~/.mozilla/firefox/<DEV-PROFILE>/extensions/

	The contents of this file should be the full path to the extension folder (with trailing slash!)

3.	Start firefox as:

	Set extensions.logging.enabled = true via 'about:config' for debugging.
	firefox -console -jsconsole -no-remote -P dev

4. Packaging: zip contents of the folder (without containing folder itself), rename it to .xpi

	or simply run ./build.sh

	https://developer.mozilla.org/en/Code_snippets/On_page_load
	https://developer.mozilla.org/en/Setting_up_extension_development_environment

5. Updating

	Download: https://developer.mozilla.org/en/McCoy
	mccoy.profile.backup has to be restored to ~/.mozilla/mccoy
	Password for McCoy is in the mccoy.pwd
	
	After running ./build.sh with correct (new) version number,
	you must sign $PUBLICDIR/update.rdf manually!

	Webhosting MUST be configured properly:
		application/x-xpinstall .xpi
		text/xml .rdf

	http://www.borngeek.com/firefox/automatic-firefox-extension-updates/
	https://developer.mozilla.org/en/Install_Manifests


Chrome
======

1. Open addons panel and expand "+ Developer mode"
2. Click "Load unpacked extension...", select extension folder.
3. Packaging: http://code.google.com/chrome/extensions/packaging.html
4. Hosting: http://code.google.com/chrome/extensions/hosting.html

http://code.google.com/chrome/extensions/overview.html
http://code.google.com/chrome/extensions/content_scripts.html
http://code.google.com/chrome/extensions/messaging.html
http://code.google.com/chrome/extensions/manifest.html


Opera
=====

1. Open config.xml in the Opera, restart it.
2. Packaging: zip contents of the folder (without containing folder itself), rename it to .oex
4. Hosting:

	MIME type: application/x-opera-extension .oex

http://dev.opera.com/addons/extensions/


Safari
======


Internet Explorer
=================


