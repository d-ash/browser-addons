Components.utils.import("resource://gre/modules/Services.jsm");	// for logInXul()

// global
var __onRymnikButtonClick = null,
	__unloadRymnikExt = null;

(function () {

	var isActive = true,
		SCRIPT_URL = 'https://favnote.valentin.ws/js/agent.js',

		logInXul = function (s) {
			Services.console.logStringMessage(s);
		},

		// The following messaging is based on:
		// https://developer.mozilla.org/en/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
		docConnect = {
			connected: [],
			callbacks: {},	// index of callback functions by their ID
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
				var res = docConnect.callbacks[id];
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
				request.textContent = docConnect.encodeData(data);	// TODO for IE < 9 do the same but with .innerText

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
					return getScreenshot(sender, data.params, callback);
				}

				return callback('unknown method');
			}
		},	// end of docConnect

		installButton = function (toolbarId, id, afterId) {
			if (!document.getElementById(id)) {
				var toolbar = document.getElementById(toolbarId);

				// If no afterId is given, then append the item to the toolbar
				var before = null,
					elem;
				if (afterId) {
					elem = document.getElementById(afterId);
					if (elem && elem.parentNode === toolbar) {
						before = elem.nextElementSibling;
					}
				}

				toolbar.insertItem(id, before);
				toolbar.setAttribute('currentset', toolbar.currentSet);
				document.persist(toolbar.id, 'currentset');

				if (toolbarId === 'addon-bar') {
					toolbar.collapsed = false;
				}
			}
		},

		onButtonClick = function (event) {
			var button = document.getElementById('rymnik-toolbar-button');

			if (isActive) {
				isActive = false;
				button.className += ' turnedoff';
			} else {
				isActive = true;
				button.className = button.className.replace(' turnedoff', '');
			}
		},

		isTopPage = function (doc) {
			var win = doc.defaultView;
			if (doc.nodeName !== '#document' ||  // only documents
				win !== win.top ||  // only top window
				win.frameElement ||  // skip iframes/frames
				doc.location.href === 'about:blank' ||  // skip new empty pages
				/^chrome:/i.test(doc.location.href)  // skip XUL windows (e.g. Firebug)
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

			if (doc.body) {
				doc.body.appendChild(script);
			}
		},

		getScreenshot = function (doc, params, callback) {
			var win = doc.defaultView,
				canvas = doc.createElement('canvas'),
				ctx = canvas.getContext('2d'),
				dataUrl = '';

			if (params.hasOwnProperty('left') &&
				params.hasOwnProperty('top') &&
				params.hasOwnProperty('width') &&
				params.hasOwnProperty('height')) {

				canvas.setAttribute('width', params.width);
				canvas.setAttribute('height', params.height);
				ctx.drawWindow(win,
					params.left,
					params.top,
					params.width,
					params.height,
					'rgb(255,255,255)');
				dataUrl = canvas.toDataURL('image/png');
			}

			canvas = null;
			return callback(dataUrl);
		},

		onPageLoad = function (aEvent) {
			var doc = aEvent.originalTarget, // document that triggered 'onload' event
				win = doc.defaultView; // window for the doc

			if (!isActive) {
				return 0;
			}

			if (isTopPage(doc) || win.frameElement) {
				docConnect.listenDocument(doc);
				win.addEventListener('unload', onDocUnload, true);
			}

			if (isTopPage(doc)) {
				win.addEventListener('unload', onTopPageUnload, true);
				insertScript(doc, SCRIPT_URL);
			}
		},

		onDocUnload = function (event) {
			// TODO remove listener on the document (free memory)
		},

		onTopPageUnload = function (event) {
		},

		main = function () {
			var appcontent = document.getElementById('appcontent');   // browser
			if (appcontent) {
				// The event can be DOMContentLoaded, pageshow, pagehide, load or unload.
				appcontent.addEventListener('DOMContentLoaded', onPageLoad, true);
				__unloadRymnikExt = function () {
					appcontent.removeEventListener('DOMContentLoaded', onPageLoad, true);
					__onRymnikButtonClick = null;
					__unloadRymnikExt = null;
				};
			}

			__onRymnikButtonClick = onButtonClick;	// expose the handler to the global scope
		};	// end of var declarations

	main();

}());
