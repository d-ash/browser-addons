// USEFUL: http://erikvold.com/blog/index.cfm/2010/10/28/restartless-firefox-addons-part-1-giving-your-addon-the-bootstrap

const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/Services.jsm");

function logInXul(s) {
	Services.console.logStringMessage(s);
}

function alertInXul(s) {
	Services.prompt.alert(null, 'Alert in restartless addon', s);
}

// Check this for how the url should look like:
// https://developer.mozilla.org/en/mozIJSSubScriptLoader
function loadScript(url, window) {
	var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
	loader.loadSubScript(url, window);
}

var WindowListener = {
	setupBrowserUI: function (window) {
		loadScript('chrome://nameyourhorse/content/init.js', window);
	},

	tearDownBrowserUI: function (window) {
		if (typeof window.__unloadRymnikExt === 'function') {
			window.__unloadRymnikExt();
		}
	},

	// nsIWindowMediatorListener functions
	onOpenWindow: function (xulWindow) {
		// A new window has opened
		let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIDOMWindowInternal);

		// Wait for it to finish loading
		domWindow.addEventListener("load", function listener() {
			domWindow.removeEventListener("load", listener, false);

			// If this is a browser window then setup its UI
			if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
				WindowListener.setupBrowserUI(domWindow);
		}, false);
	},

	onCloseWindow: function (xulWindow) {
	},

	onWindowTitleChange: function (xulWindow, newTitle) {
	}
};

function startup(data, reason) {
	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
	getService(Ci.nsIWindowMediator);

	// Get the list of browser windows already open
	let windows = wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

		WindowListener.setupBrowserUI(domWindow);
	}

	// Wait for any new browser windows to open
	wm.addListener(WindowListener);
}

function shutdown(data, reason) {
	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (reason == APP_SHUTDOWN) {
		return;
	}

	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
	getService(Ci.nsIWindowMediator);

	// Get the list of browser windows already open
	let windows = wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

		WindowListener.tearDownBrowserUI(domWindow);
	}

	// Stop listening for any new browser windows to open
	wm.removeListener(WindowListener);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
