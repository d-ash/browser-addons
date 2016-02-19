// use opera.postError('smth') instead of console.log()
(function () {

	var isActive = true,
		button,

		getScreenshot = function (params, callback) {
			if (params.hasOwnProperty('left') &&
				params.hasOwnProperty('top') &&
				params.hasOwnProperty('width') &&
				params.hasOwnProperty('height')) {

				// Note that these features will not be part of the final Opera 12 release, but a later release.
				if (opera.extension.getScreenshot) {
					opera.postError('TODO: opera.extension.getScreenshot()');
					return callback('');
					/*
					opera.extension.getScreenshot(function (imageData) {
						opera.postError('WOW:');
						opera.postError(imageData);

						var canvas = document.createElement('canvas');
						canvas.width = imageData.width;
						canvas.height = imageData.height;
						var ctx = canvas.getContext('2d');
						ctx.putImageData(imageData, 0, 0);
						var body = document.body;
						body.innerHTML = '';
						body.appendChild(canvas);
						opera.postError('Snapshot appended to current page.');
					});
					*/
				}
				opera.postError('opera.extension.getScreenshot() is not available');
				return callback('');
			}
			return callback('');
		},

		onRequestFromInjected = function (request, sendResponse) {
			switch (request.type) {
				case 'handshake':
					return sendResponse({ 'isActive': isActive });
				case 'getScreenshot':
					return getScreenshot(request.data, sendResponse);
				default:
					return sendResponse({});
			}
		},

		onRequest = function (event) {
			var request = event.data,
				sender = event.source;

			if (!request.hasOwnProperty('type') ||
				!request.hasOwnProperty('cbId') ||
				!request.hasOwnProperty('data')) {

				return 0;
			}

			if (request.type === 'q') {
				return onRequestFromInjected(request.data, function (respData) {
					sender.postMessage({
						type: 'a',
						cbId: request.cbId,
						data: respData
					});
				});
			}

			return 0;
		},

		onButtonClick = function () {
			if (isActive) {
				isActive = false;
				button.icon = 'icons/icon_off.png';
			} else {
				isActive = true;
				button.icon = 'icons/icon_on.png';
			}
		},

		onExtLoad = function () {
			/*
			var ToolbarUIItemProperties = {
					disabled: false,
					title: 'Turn on/off',
					icon: 'icons/icon_on.png',	// 18 x 18
					onclick: onButtonClick
				},
				toolbar = opera.contexts.toolbar;

			button = toolbar.createItem(ToolbarUIItemProperties);
			toolbar.addItem(button);
			*/

			opera.extension.onmessage = onRequest;
		},

		main = function () {
			window.addEventListener('load', onExtLoad, false);
		};	// end of variables declaration

	main();

}());
