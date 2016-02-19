//
// This script is executed in the extension context (not content_script's one)
//
(function () {

	var isActive = true,

		onButtonClick = function () {
			var icon;

			if (isActive) {
				isActive = false;
				icon = 'icon_off.png';
			} else {
				isActive = true;
				icon = 'icon_on.png';
			}
			chrome.browserAction.setIcon({ 'path': icon });
		},

		onRequest = function (request, sender, sendResponse) {
			switch (request.type) {
				case 'handshake':
					return sendResponse({ 'isActive': isActive });
				case 'getVisibleArea':
					// we can get only visible area of the page
					return chrome.tabs.captureVisibleTab(null, { format: 'png' }, sendResponse);
				default:
					return sendResponse({});	// free memory
			}
		},

		main = function () {
			/*
			chrome.browserAction.setIcon({ 'path': 'icon_on.png' });
			chrome.browserAction.onClicked.addListener(onButtonClick);
			*/
			chrome.extension.onRequest.addListener(onRequest);
		};	// end of variable declarations

	main();

}());
