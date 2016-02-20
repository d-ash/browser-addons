# Browser Add-ons

## Overview

These browser add-ons (extensions) were a part of one of my previous projects. They are essentially the same, the difference is in ... API.


## User Interface

These add-ons add a sticky button onto every page opened by a user. When the button is clicked, a dialog pops over the page contents, and the user can take several actions. The add-ons communicate with a remote back-end service over HTTPS.

#### Default state of the button
![Default state of the button](screenshots/default.png)

#### Dialog on the page
![Dialog on the page](screenshots/dialog.png)

#### Taking a screenshot of a selected area
![Taking a screenshot](screenshots/taking-ss.png)

## Implementation

(indirectly, via an angent script).

that inject addition functionality into every page a user visits.

The add-ons are (Chrome, Firefox, and Opera).
Here are three extensions 



Add on every page a button ... with dialogs.
Take screenshots of a selected area on the page.





Due to security restrictions...
This script is executed on the page's DOM but without any access to the page's javascript.
Communicates with Agent via specially constructed DOM nodes and their attributes (duplex callback protocol).

### Agent.js

We need to have our own implementation of JSON because the native one could be corrupted by foreign scripts.
Communicates with a back-end service over HTTPS.
