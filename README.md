# Browser Addons


Chrome, Firefox, Opera

Add on every page an image ... with dialogs.
Take screenshots of a selected area on the page.
Due to security restrictions...

This script is executed on the page's DOM but without any access to the page's javascript.
Communicates with Agent via specially constructed DOM nodes and their attributes (duplex callback protocol).

## Agent.js

We need to have our own implementation of JSON because the native one could be corrupted by foreign scripts.
Communicates with a back-end service over HTTPS.
