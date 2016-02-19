//
// This script executed inside the page's scope.
//
(function () {

	var HI = 'hi',	// do not delete this line!
		SCRIPT_URL = 'https://nameyourhorse.com/js/agent.js',	// CRITICAL: works only with global DNS

		// Messaging with Background script.
		// We need this mechanics because opera.extension.postMessage() does not have it's own callbacks.
		bgConnect = {
			callbacks: {}, // index of callback functions to the background script
			lastCallbackId: 0,	// zero value is not used for indexing callbacks (dummy)

			pushCallback: function (fn) {
				if (bgConnect.lastCallbackId === 9999) {	// hope this will be enough
					bgConnect.lastCallbackId = 1;
				} else {
					bgConnect.lastCallbackId += 1;
				}
				bgConnect.callbacks[bgConnect.lastCallbackId] = fn;
				return bgConnect.lastCallbackId;
			},

			popCallback: function (id) {
				var res;

				if (!bgConnect.callbacks.hasOwnProperty(id)) {
					return function () {};
				}

				res = bgConnect.callbacks[id];
				delete bgConnect.callbacks[id];
				return res;
			},

			answer: function (event) {
				var msg = event.data,
					callback;

				if (!msg.hasOwnProperty('type') ||
					!msg.hasOwnProperty('cbId') ||
					!msg.hasOwnProperty('data')) {

					return 0;
				}

				if (msg.type === 'a') {
					callback = bgConnect.popCallback(msg.cbId);
					return callback(msg.data);
				}
				return 0;
			},

			// analogue of chrome.extension.sendRequest()
			question: function (data, fn) {
				var cbId = 0;

				if (typeof fn === 'function') {
					cbId = bgConnect.pushCallback(fn);
				}

				opera.extension.postMessage({
					type: 'q',
					cbId: cbId,
					data: data
				});
			}
		},
		// end of bgConnect

		docConnect = {
			myName: '', // filled after successful 'regme' action
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
					alert('Opera browser does not have the ability to take screenshots.');
					/*
					return bgConnect.question({
						type: 'getScreenshot',
						data: data.params
					}, callback);
					*/
				}

				return callback(null);
			}
		},
		// end of docConnect

		isTopPage = function (doc) {
			var win = doc.defaultView;
			if (doc.nodeName !== '#document' || // only documents
				win !== win.top || // only top window.
				win.frameElement || // skip iframes/frames
				doc.location.href === 'about:blank' // skip new empty pages
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
			opera.extension.onmessage = bgConnect.answer;
			bgConnect.question({ type: 'handshake' }, function (res) {
				var doc = document,
					win = window;

				if (!res.isActive) {
					return 0;
				}

				if (isTopPage(doc)) {
					docConnect.listenDocument(doc);
					win.addEventListener('unload', onTopPageUnload, true);
					insertScript(doc, SCRIPT_URL);
				}
			});
		},

		onTopPageUnload = function () {
		},

		main = function () {
			window.addEventListener('DOMContentLoaded', onPageLoad, false);
		};	// end of variables declaration

	main();

}());
