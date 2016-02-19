__rymnikAgentProxy.addEventListener(window, 'message', __rymnikAgentProxy.onMessage);

var __rymnikAgentHub = (function () {
	var windows = {}, // index of windows by their ID

		find = function (win) {
			var id;
			for (id in windows) {
				if (windows.hasOwnProperty(id) && windows[id] === win) {
					return id;
				}
			}
			return 0;
		},

		onMessage = function (event) {
			var msg = event.data,
				srcId = find(event.source),
				dstId;

			if (!msg.hasOwnProperty('type') ||
				// 'to' field is present only if the message is on it's way to the Hub
				!msg.hasOwnProperty('to') ||
				!msg.hasOwnProperty('data') ||
				!msg.hasOwnProperty('cbId')
			) {
				return 0;
			}

			if (!srcId) {
				return 0; // unknown sender
			}

			if (!windows.hasOwnProperty(msg.to)) {
				return 0; // unknown recepient
			}

			dstId = msg.to;
			msg.to = null;
			msg.from = srcId;
			windows[dstId].postMessage(msg, '*');
		};

	__rymnikAgentProxy.addEventListener(window, 'message', onMessage);

	return {
		register: function (id, win) {
			windows[id] = win;
		},

		unregister: function (id) {
			if (windows.hasOwnProperty(id)) {
				delete windows.windows[id];
			}
		}
	};
}());
// end of Hub

// We need to have our own implementation of JSON
// because the native one could be corrupted by foreign scripts.
(function () {
	var __rymnikJSON = window.__rymnikJSON = {};
	__rymnikJSON.stringify = function (value, replacer, space) {
		var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			i,
			gap = '',
			indent = '',
			meta = {    // table of character substitutions
				'\b': '\\b',
				'\t': '\\t',
				'\n': '\\n',
				'\f': '\\f',
				'\r': '\\r',
				'"': '\\"',
				'\\': '\\\\'
			},
			rep,
			quote = function (string) {
				// If the string contains no control characters, no quote characters, and no
				// backslash characters, then we can safely slap some quotes around it.
				// Otherwise we must also replace the offending characters with safe escape
				// sequences.
				escapable.lastIndex = 0;
				return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
					var c = meta[a];
					return typeof c === 'string' ? c :
						'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' : '"' + string + '"';
			},
			str = function (key, holder) {
				// Produce a string from holder[key].
				var i, // The loop counter.
					k, // The member key.
					v, // The member value.
					length,
					mind = gap,
					partial,
					value = holder[key];
				// If the value has a toJSON method, call it to obtain a replacement value.
				if (value && typeof value === 'object' &&
					typeof value.toJSON === 'function') {
					value = value.toJSON(key);
				}
				// If we were called with a replacer function, then call the replacer to
				// obtain a replacement value.
				if (typeof rep === 'function') {
					value = rep.call(holder, key, value);
				}
				// What happens next depends on the value's type.
				switch (typeof value) {
					case 'string':
						return quote(value);
					case 'number':
						// JSON numbers must be finite. Encode non-finite numbers as null.
						return isFinite(value) ? String(value) : 'null';
					case 'boolean':
					case 'null':
						// If the value is a boolean or null, convert it to a string. Note:
						// typeof null does not produce 'null'. The case is included here in
						// the remote chance that this gets fixed someday.
						return String(value);
					case 'object':
						if (!value) {
							return 'null';
						}
						gap += indent;
						partial = [];
						// Array.isArray
						if (Object.prototype.toString.apply(value) === '[object Array]') {
							length = value.length;
							for (i = 0; i < length; i += 1) {
								partial[i] = str(i, value) || 'null';
							}

							// Join all of the elements together, separated with commas, and
							// wrap them in brackets.
							v = partial.length === 0 ? '[]' : gap ?
								'[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
								'[' + partial.join(',') + ']';
							gap = mind;
							return v;
						}
						// If the replacer is an array, use it to select the members to be
						// stringified.
						if (rep && typeof rep === 'object') {
							length = rep.length;
							for (i = 0; i < length; i += 1) {
								k = rep[i];
								if (typeof k === 'string') {
									v = str(k, value);
									if (v) {
										partial.push(quote(k) + (gap ? ': ' : ':') + v);
									}
								}
							}
						} else {
							// Otherwise, iterate through all of the keys in the object.
							for (k in value) {
								if (Object.prototype.hasOwnProperty.call(value, k)) {
									v = str(k, value);
									if (v) {
										partial.push(quote(k) + (gap ? ': ' : ':') + v);
									}
								}
							}
						}

						// Join all of the member texts together, separated with commas,
						// and wrap them in braces.

						v = partial.length === 0 ? '{}' : gap ?
							'{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
							'{' + partial.join(',') + '}';
						gap = mind;
						return v;
				}
			};
		// If the space parameter is a number, make an indent string containing that
		// many spaces.
		if (typeof space === 'number') {
			for (i = 0; i < space; i += 1) {
				indent += ' ';
			}
		}
		// If the space parameter is a string, it will be used as the indent string.
		else if (typeof space === 'string') {
			indent = space;
		}

		// If there is a replacer, it must be a function or an array.
		// Otherwise, throw an error.
		rep = replacer;
		if (replacer && typeof replacer !== 'function'
			&& (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
			throw new Error('JSON.stringify');
		}

		// Make a fake root object containing our value under the key of ''.
		// Return the result of stringifying the value.
		return str('', {'': value});
	};

	__rymnikJSON.parse = function (source, reviver) {
		var at = 0, // The index of the current character
			ch = ' ', // The current character
			escapee = {
				'"': '"',
				'\\': '\\',
				'/': '/',
				b: '\b',
				f: '\f',
				n: '\n',
				r: '\r',
				t: '\t'
			},
			text = source,
			error = function (m) {
				// Call error when something is wrong.
				throw {
					name: 'SyntaxError',
					message: m,
					at: at,
					text: text
				};
			},
			next = function (c) {
				// If a c parameter is provided, verify that it matches the current character.
				if (c && c !== ch) {
					error("Expected '" + c + "' instead of '" + ch + "'");
				}
				// Get the next character. When there are no more characters,
				// return the empty string.
				ch = text.charAt(at);
				at += 1;
				return ch;
			},
			number = function () {
				// Parse a number value.
				var number,
					string = '';

				if (ch === '-') {
					string = '-';
					next('-');
				}
				while (ch >= '0' && ch <= '9') {
					string += ch;
					next();
				}
				if (ch === '.') {
					string += '.';
					while (next() && ch >= '0' && ch <= '9') {
						string += ch;
					}
				}
				if (ch === 'e' || ch === 'E') {
					string += ch;
					next();
					if (ch === '-' || ch === '+') {
						string += ch;
						next();
					}
					while (ch >= '0' && ch <= '9') {
						string += ch;
						next();
					}
				}
				number = +string;
				if (!isFinite(number)) {
					error("Bad number");
				} else {
					return number;
				}
			},
			string = function () {
				// Parse a string value.
				var hex,
					i,
					string = '',
					uffff;
				// When parsing for string values, we must look for " and \ characters.
				if (ch === '"') {
					while (next() && ch !== '"') {
						if (ch === '\\') {
							next();
							if (ch === 'u') {
								uffff = 0;
								for (i = 0; i < 4; i += 1) {
									hex = parseInt(next(), 16);
									if (!isFinite(hex)) {
										break;
									}
									uffff = uffff * 16 + hex;
								}
								string += String.fromCharCode(uffff);
							} else if (typeof escapee[ch] === 'string') {
								string += escapee[ch];
							} else {
								break;
							}
						} else {
							string += ch;
						}
					}
					if (ch === '"') {
						next();
						return string;
					}
				}
				error("Bad string");
			},
			white = function () {
				// Skip whitespace.
				while (ch && ch <= ' ') {
					next();
				}
			},
			word = function () {
				// true, false, or null.
				switch (ch) {
					case 't':
						next('t');next('r');next('u');next('e');
						return true;
					case 'f':
						next('f');next('a');next('l');next('s');next('e');
						return false;
					case 'n':
						next('n');next('u');next('l');next('l');
						return null;
				}
				error("Unexpected '" + ch + "'");
			},
			array = function () {
				// Parse an array value.
				var array = [];
				if (ch === '[') {
					next('[');
					white();
					if (ch === ']') {
						next(']');
						return array;   // empty array
					}
					while (ch) {
						array.push(value());
						white();
						if (ch === ']') {
							next(']');
							return array;
						}
						next(',');
						white();
					}
				}
				error("Bad array");
			},
			object = function () {
				// Parse an object value.
				var key,
					object = {};
				if (ch === '{') {
					next('{');
					white();
					if (ch === '}') {
						next('}');
						return object;   // empty object
					}
					while (ch) {
						key = string();
						white();
						next(':');
						if (Object.hasOwnProperty.call(object, key)) {
							error('Duplicate key "' + key + '"');
						}
						object[key] = value();
						white();
						if (ch === '}') {
							next('}');
							return object;
						}
						next(',');
						white();
					}
				}
				error("Bad object");
			},
			value = function () {
				// Parse a JSON value. It could be an object, an array, a string, a number,
				// or a word.
				white();
				switch (ch) {
					case '{':
						return object();
					case '[':
						return array();
					case '"':
						return string();
					case '-':
						return number();
					default:
						return ch >= '0' && ch <= '9' ? number() : word();
				}
			},
			result = value();
		white();
		if (ch) {
			error("Syntax error");
		}
		return result;
	};
}());
// end of __rymnikJSON

var __rymnikExtConnect = {
	callbacks: {},	// index of callback functions by their ID
	lastCallbackId: 0,

	pushCallback: function (fn) {
		if (__rymnikExtConnect.lastCallbackId === 9999) {	// hope this will be enough
			__rymnikExtConnect.lastCallbackId = 1;
		} else {
			__rymnikExtConnect.lastCallbackId += 1;
		}
		__rymnikExtConnect.callbacks[__rymnikExtConnect.lastCallbackId] = fn;
		return __rymnikExtConnect.lastCallbackId;
	},

	popCallback: function (id) {
		var res;

		if (!__rymnikExtConnect.callbacks.hasOwnProperty(id)) {
			return function () {};
		}

		res = __rymnikExtConnect.callbacks[id];
		delete __rymnikExtConnect.callbacks[id];
		return res;
	},

	encodeData: function (data) {
		var res,
			fn;

		// Hack for some JS libraries (e.g. Prototype)
		// http://stackoverflow.com/questions/710586/json-stringify-bizarreness
		if (Array.prototype.toJSON) {
			fn = Array.prototype.toJSON;
			delete Array.prototype.toJSON;
			res = __rymnikJSON.stringify(data);
			Array.prototype.toJSON = fn;
		} else {
			res = __rymnikJSON.stringify(data);
		}

		return res;
	},

	decodeData: function (data) {
		return __rymnikJSON.parse(data);
	},

	onIncomingRequest: function (event) {
		var node = event.target,
			sender = node.ownerDocument,
			data = __rymnikExtConnect.decodeData(node.textContent);

		return __rymnikExtConnect.answer(data, function (data) {
			if (!node.getAttribute('callbackId')) {
				return sender.documentElement.removeChild(node);
			}

			node.textContent = __rymnikExtConnect.encodeData(data);

			var listener = sender.createEvent('Events');
			listener.initEvent('rymnik-todoc-response', true, false);
			return node.dispatchEvent(listener);
		});
	},

	listenExtension: function () {
		__rymnikAgentProxy.addEventListener(document, 'rymnik-todoc-request', __rymnikExtConnect.onIncomingRequest);
	},

	question: function (data, callback) {
		var request = document.createElement('div');

		request.style.display = 'none';
		request.textContent = __rymnikExtConnect.encodeData(data);

		if (callback) {
			request.setAttribute('callbackId', __rymnikExtConnect.pushCallback(callback));

			var _listener = function (event) {
				var node = event.target,
					callback = __rymnikExtConnect.popCallback(node.getAttribute('callbackId')),
					response = __rymnikExtConnect.decodeData(node.textContent);

				document.documentElement.removeChild(node);
				document.removeEventListener('rymnik-fromdoc-response', _listener, false);
				return callback(response);
			};

			document.addEventListener('rymnik-fromdoc-response', _listener, false);
		}
		document.documentElement.appendChild(request);

		var sender = document.createEvent('Events');
		sender.initEvent('rymnik-fromdoc-request', true, false);
		return request.dispatchEvent(sender);
	},

	answer: function (data, callback) {
		return callback(null);	// default behaviour, override it
	}
};
// end of __rymnikExtConnect

__rymnikExtConnect.listenExtension();

var __rymnikWidgetAgent = (function () {
	var ROOT_URL = 'https://{__SERVER_HOST__}/',
		IMGS_URL = ROOT_URL + 'img/',
		FRAME_URL = ROOT_URL + 'agent/',
		UNWANTED_ELEMENTS = ['object', 'embed', 'select', 'iframe', 'frame'],
		UNWANTED_ELEMENTS_LENGTH = UNWANTED_ELEMENTS.length,
		STYLES = '\
		#rymnik-widget-popup-wrap {\
			display: block;\
			line-height: 16px;\
			margin: 0;\
			padding: 0;\
			border: 1px solid rgba(0, 0, 0, 0.3);\
			*border: 1px solid #999;\
			background-color: #FFF;\
			-webkit-border-radius: 6px;\
			-moz-border-radius: 6px;\
			border-radius: 6px;\
			-webkit-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);\
			-moz-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);\
			box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);\
		}\
		#rymnik-widget-popup-wrap iframe {\
			margin: 0;\
			padding: 0;\
			border: 0 none;\
			background-color: #FFF;\
			width: 100%;\
			height: 100%;\
			-webkit-border-radius: 6px;\
			-moz-border-radius: 6px;\
			border: 0 none;\
			background-color: #FFF;\
			width: 100%;\
			height: 100%;\
			-webkit-border-radius: 6px;\
			-moz-border-radius: 6px;\
			border-radius: 6px;\
		}\
		#rymnik-widget-popup-close {\
			font: 35px/15px "Helvetica Neue",Helvetica,Arial,sans-serif;\
			cursor: pointer;\
			color: #DDD;\
			border: 0 none;\
			background-color: transparent;\
			display: block;\
			position: absolute;\
			width: 30px;\
			height: 30px;\
			padding: 11px 0 0 9px;\
			margin: 0 0 0 940px;\
			z-index: 999999999;\
		}\
		#rymnik-widget-popup-close:hover {\
			color: #FFF;\
		}\
		\
		\
		#rymnik-widget-card-create-wrap {\
			display: block;\
			margin: 0;\
			padding: 0;\
			line-height: 16px;\
			border: 0 none;\
			background-color: transparent;\
		}\
		#rymnik-widget-card-create-wrap iframe {\
			margin: 0;\
			padding: 0;\
			border: 0 none;\
			background-color: transparent;\
			width: 100%;\
			height: 100%;\
		}\
		\
		#rymnik-widget-anchor {\
			display: block;\
			cursor: pointer;\
			width: 60px;\
			height: 70px;\
			margin: 0 0 0 -25px;\
			padding: 0;\
			background: transparent url(' + ROOT_URL + 'img/ico-agt.png?02) no-repeat 0 0;\
			z-index: 999999997;\
			-webkit-border-radius: 0 30px 30px 0;\
			-moz-border-radius: 0 30px 30px 0;\
			-webkit-transition: opacity .2s linear, margin-left .2s;\
			-moz-transition: opacity .2s linear, margin-left .2s;\
			-ms-transition: opacity .2s linear, margin-left .2s;\
			-o-transition: opacity .2s linear, margin-left .2s;\
			transition: opacity .2s linear, margin-left .2s;\
			-ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=50);\
			filter: alpha(opacity=50);\
			opacity: .5;\
			border: 0 none;\
		}\
		#rymnik-widget-anchor:hover {\
			-ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=95);\
			filter: alpha(opacity=95);\
			opacity: .95;\
			margin-left: -2px;\
		}\
		#rymnik-widget-anchor-home {\
			display: block;\
			cursor: pointer;\
			width: 27px;\
			height: 22px;\
			margin: 43px 0 0 2px;\
			border: 0 none;\
			text-decoration: none;\
			background: transparent none;\
			padding: 0;\
		}\
		\
		#rymnik-widget-popup-drag, #rymnik-widget-card-drag {\
			display: block;\
			position: absolute;\
			cursor: move;\
			margin: 0;\
			padding: 0;\
			border: 0 none;\
			font-size: 0;\
			z-index: 999999999;\
			background: transparent;\
		}\
		#rymnik-widget-popup-drag {\
			width: 680px;\
			height: 40px;\
			margin-left: 250px;\
		}\
		#rymnik-widget-card-drag {\
			width: 530px;\
			height: 70px;\
			margin-left: 20px;\
		}\
		',
		UNDEF = 'undefined',
		OBJECT = 'object',
		NUMBER = 'number',
		BLOCK = 'block',
		NONE = 'none',
		FUNC = 'function',
		SHOCKWAVE_FLASH = 'Shockwave Flash',
		SHOCKWAVE_FLASH_AX = 'ShockwaveFlash.ShockwaveFlash',
		FLASH_MIME_TYPE = 'application/x-shockwave-flash',

		doc = document,
		win = window,
		nav = navigator,
		loc = window.location,
		log = console.log,

		listenersArr = [],

		docBody,
		docHtml,

		anchorElement,
		anchorMenuElement,

		siteFrame,
		createCardFrame,
		activeFrame,
		insertedFramesNames = {},

		winOverlay,
		isImageGrabberActive = 0,

		makeElementFixed = function (element, opt) {
			opt = opt || {};
			var clearElement = function () {
				clearTimeout(opt._floatTimer);
			},
				moveElement = function () {
					element.style.left = (getDocLeft() + opt._targetLeft) + 'px';
					element.style.top = (getDocTop() + opt._targetTop) + 'px';
				},
				floatElement = function () {
					if (!element) {
						clearElement();
						return 0;
					}
					moveElement();
					opt._floatTimer = setTimeout(function () {
						if (opt.stopFloat) {
							if (!opt.stopFloat()) {
								clearElement();
								return 0;
							}
						}
						floatElement();
					}, 100);
				};
			opt.element = element;

			element.style.position = ua.fixed ? 'fixed' : 'absolute';

			if (opt.onWindowResize && typeof opt.onWindowResize === FUNC) {
				addEvent(win, 'resize', function () {
					opt.onWindowResize.apply(null, [opt]);
				});
				opt.onWindowResize.apply(null, [opt]);
			}

			opt._targetLeft = parseInt(element.style.left, 10);
			opt._targetTop = parseInt(element.style.top, 10);
			opt._targetRight = parseInt(element.style.right, 10);
			opt._targetBottom = parseInt(element.style.bottom, 10);

			opt._floatTimer = null;

			if (!ua.fixed) {
				floatElement();
			}
		},

		ua = (function () {
			if (!nav.userAgent || !nav.platform) {
				return {};
			}
			var w3cdom = typeof doc.getElementById !== UNDEF && typeof doc.getElementsByTagName !== UNDEF && typeof doc.createElement !== UNDEF,
				u = nav.userAgent.toLowerCase(),
				p = nav.platform.toLowerCase(),
				windows = p ? /win/.test(p) : /win/.test(u),
				mac = p ? /mac/.test(p) : /mac/.test(u),
				webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
				//ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
				ie = /msie/.test(u),
				ie6 = false,
				playerVersion = [0, 0, 0], d = null;

			if (typeof nav.plugins !== UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] === OBJECT) {
				d = nav.plugins[SHOCKWAVE_FLASH].description;
				if (d && !(typeof nav.mimeTypes !== UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
					//plugin = true;
					ie = false; // cascaded feature detection for Internet Explorer
					d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
					playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
					playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
					playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
				}
			} else if (typeof win.ActiveXObject !== UNDEF) {
				try {
					var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
					if (a) { // a will return null when ActiveX is disabled
						d = a.GetVariable("$version");
						if (d) {
							ie = true; // cascaded feature detection for Internet Explorer
							d = d.split(" ")[1].split(",");
							playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
						}
					}
				} catch (e) {
				}
			}

			if (ie) {
				var vie = /msie (\d+)\./.exec(u);
				ie6 = (Number(vie[1]) <= 6);
			}

			return {
				w3: w3cdom,
				pv: playerVersion,
				wk: webkit,
				gk: /gecko/.test(u),
				ie: ie,
				ie6: ie6,
				op: /(opera|presto)/.test(u),
				win: windows,
				mac: mac
			};
		}()),

		testFixed = function () {
			var test = createElement('div'),
				res;
			test.style.position = 'fixed';
			test.style.top = '0px';
			test.style.right = '0px';
			docBody.appendChild(test);
			res = (test.offsetTop === 0);
			docBody.removeChild(test);
			return res;
		},

		createElement = function (el) {
			return doc.createElement(el);
		},

		getWinWidth = function () {
			if (typeof win.innerWidth === NUMBER) {
				return win.innerWidth;
			}
			if (doc.documentElement && doc.documentElement.clientWidth) {
				return doc.documentElement.clientWidth;
			}
			if (doc.body) {
				return doc.body.clientWidth;
			}
			return 0;
		},

		getWinHeight = function () {
			if (typeof win.innerHeight === NUMBER) {
				return win.innerHeight;
			}
			if (doc.documentElement && doc.documentElement.clientHeight) {
				return doc.documentElement.clientHeight;
			}
			if (doc.body) {
				return doc.body.clientHeight;
			}
			return 0;
		},

		getDocTop = function () {
			if (typeof win.pageYOffset === NUMBER) {
				return win.pageYOffset;
			}
			if (doc.body && doc.body.scrollTop) {
				return doc.body.scrollTop;
			}
			if (doc.documentElement && doc.documentElement.scrollTop) {
				return doc.documentElement.scrollTop;
			}
			return 0;
		},

		getDocLeft = function () {
			if (typeof win.pageXOffset === NUMBER) {
				return win.pageXOffset;
			}
			if (doc.body && doc.body.scrollLeft) {
				return doc.body.scrollLeft;
			}
			if (doc.documentElement && doc.documentElement.scrollLeft) {
				return doc.documentElement.scrollLeft;
			}
			return 0;
		},

		getMousePos = function (e) {
			var pos = {x: 0, y: 0};
			e = e || win.event;
			if (e.pageX || e.pageY) {
				pos.x = e.pageX;
				pos.y = e.pageY;
			} else if (e.clientX || e.clientY) {
				pos.x = e.clientX + getDocLeft() - doc.documentElement.clientLeft;
				pos.y = e.clientY + getDocTop() - doc.documentElement.clientTop;
			}
			return pos;
		},

		getElementPos = function (e) {
			var l = e.offsetLeft,
				t = e.offsetTop,
				p;
			for (p = e.offsetParent; p; p = p.offsetParent) {
				l += p.offsetLeft - (p.offsetParent ? p.scrollLeft : 0);
				t += p.offsetTop - (p.offsetParent ? p.scrollTop : 0);
			}
			return {
				x: l,
				y: t,
				width: e.offsetWidth,
				height: e.offsetHeight
			};
		},

		setElementOpacity = function (E, O) {
			if (ua.ie) {
				E.style.filter = (O === 1) ? '' : 'alpha(opacity=' + O * 100 + ')';
			} else {
				E.style.opacity = O;
			}
		},

		setElementStyles = function (E, S) {
			var s;
			for (s in S) {
				if (S.hasOwnProperty(s)) {
					if (s === 'opacity') {
						setElementOpacity(E, parseFloat(S[s]));
					} else if (s === 'float') {
						try { E.style[ua.ie ? 'styleFloat' : 'cssFloat'] = S[s]; } catch (ex) {}
					} else if (s === 'borderRadius') {
						try {
							/*
							-webkit-border-radius: xxxx;
							-moz-border-radius: xxxx;
							border-radius: xxxx;
							*/
							E.style['-webkit-border-radius'] = S[s];
							E.style['-moz-border-radius'] = S[s];
							E.style['border-radius'] = S[s];
							E.style[s] = S[s];
						} catch (ex1) {}
					} else {
						try { E.style[s] = S[s]; } catch (ex2) {}
					}
				}
			}
			return E;
		},

		toggleUnwantedElements = function (visible) {
			var i, j, e, l;
			for (i = 0; i < UNWANTED_ELEMENTS_LENGTH; i++) {
				e = arrayFrom(docBody.getElementsByTagName(UNWANTED_ELEMENTS[i]));
				l = e.length;
				if (!l) {
					continue;
				}
				for (j = 0; j < l; j++) {
					if ((UNWANTED_ELEMENTS[i] === 'iframe' && insertedFramesNames.hasOwnProperty(e[j].getAttribute('name'))) || e[j].style.display === NONE) {
						continue;
					}
					e[j].style.visibility = visible ? 'visible' : 'hidden';
				}
			}
		},

		isEnumerable = function (item) {
			return (typeof item !== UNDEF && typeof item.length === NUMBER && Object.prototype.toString.call(item) !== '[object Function]');
		},

		arrayFrom = function (item) {
			if (typeof item === UNDEF) {
				return [];
			}
			return (isEnumerable(item) && typeof item !== 'string') ? (typeof item === 'array') ? item : Array.prototype.slice.call(item) : [item];
		},

		addEvent = function (obj, ev, fn) {
			if (typeof obj.addEventListener !== UNDEF) {
				obj.addEventListener(ev, fn, false);
				return true;
			}
			if (typeof obj.attachEvent !== UNDEF) {
				var r = obj.attachEvent('on' + ev, fn);
				listenersArr[listenersArr.length] = [obj, 'on' + ev, fn];
				return r;
			}
			return false;
		},

		removeEvent = function (obj, evType, fn) {
			if (obj.removeEventListener) {
				obj.removeEventListener(evType, fn, false);
				return true;
			}
			if (obj.detachEvent) {
				var r = obj.detachEvent('on' + evType, fn);
				return r;
			}
			return false;
		},

		stopEvent = function (e) {
			e = e || win.event;
			if (e.stopPropagation) {
				e.stopPropagation();
			} else {
				e.cancelBubble = true;
			}
			/*
			if (e.preventDefault) {
				e.preventDefault();
			} else {
				e.returnValue = false;
			}
			*/
		},

// ------------ create frame ------------
		createFrame = function (url, opt) {
			opt = opt || {};
			if (!url) {
				return 0;
			}
			var frame,
				frameWrap,
				frameDrag,
				frameClose,
				frameInserted,
				frameVisible,
				frameDraggin,
				lastFrame,
				dragListeners = {},

				onFrameDragMouseDown = function (event) {
					//console.log('createFrame.onFrameDragMouseDown()')
					stopEvent(event);
					frameDraggin = getMousePos(event);
					frameDraggin.height = frameDrag.style.height;
					frameDraggin.width = frameDrag.style.width;
					frameDraggin.marginTop = frameDrag.style.marginTop;
					frameDraggin.marginLeft = frameDrag.style.marginLeft;
					frameDrag.style.height = '10000px';
					frameDrag.style.width = '10000px';
					frameDrag.style.marginTop = '-5000px';
					frameDrag.style.marginLeft = '-5000px';
					frameDrag.onmousemove = onFrameDragMouseMove;
					frameDrag.onmouseup = onFrameDragMouseUp;
				},

				onFrameDragMouseMove = function (event) {
					if (!frameDraggin) {
						return 0;
					}
					var mp = getMousePos(event),
						dx = mp.x - frameDraggin.x,
						dy = mp.y - frameDraggin.y;

					frameWrap.style.top = (parseInt(frameWrap.style.top, 10) + dy) + 'px';
					frameWrap.style.left = (parseInt(frameWrap.style.left, 10) + dx) + 'px';

					frameDraggin.x = mp.x;
					frameDraggin.y = mp.y;
				},

				onFrameDragMouseUp = function (event) {
					//console.log('createFrame.onFrameDragMouseUp()')
					stopEvent(event);
					frameDrag.style.height = '';
					frameDrag.style.width = '';
					frameDrag.style.marginTop = '';
					frameDrag.style.marginLeft = '';
					frameDraggin = null;
					frameDrag.onmousemove = null;
					frameDrag.onmouseup = null;
				},

				hideFrame = function () {
					if (!frameWrap) {
						return 0;
					}
					toggleUnwantedElements(1);
					frameWrap.style.display = NONE;
					frameVisible = 0;
					lastFrame = activeFrame;
				},

				showFrame = function () {
					if (!frameWrap) {
						return 0;
					}
					toggleUnwantedElements(0);
					frameWrap.style.display = BLOCK;
					frameVisible = 1;
				},

				toggleFrame = function () {
					if (frameVisible) {
						hideFrame();
					} else {
						showFrame();
					}
				},

				closeFrame = function () {
					hideFrame();
					activeFrame = 0;
					if (opt.onClose) {
						opt.onClose.call(null);
					}
				},

				destroyFrame = function () {
					activeFrame = 0;
					if (frameWrap) {
						docBody.removeChild(frameWrap);
					}
					frame = null;
					frameWrap = null;
					return null;
				};

			frameWrap = createElement('div');
			frameWrap.style.display = NONE;
			if (opt.wrap) {
				if (opt.wrap.id) {
					frameWrap.setAttribute('id', opt.wrap.id);
				}
				if (opt.wrap.styles) {
					setElementStyles(frameWrap, opt.wrap.styles);
				}
			}

			frame = createElement('iframe');
			frame.src = url;
			frame.setAttribute('scrolling', opt.scrolling || 'no');
			frame.setAttribute('frameborder', '0');
			frame.setAttribute('allowtransparency', 'true');
			if (opt.name) {
				frame.setAttribute('name', opt.name);
				insertedFramesNames[opt.name] = 1;
			}
			if (opt.onLoad && typeof opt.onLoad === FUNC) {
				frame.onload = opt.onLoad;
			}

			if (opt.close) {
				frameClose = createElement('div');
				frameClose.setAttribute('id', 'rymnik-widget-popup-close');
				frameClose.setAttribute('title', 'Закрыть');
				frameClose.innerHTML = '×';
				//frameClose.style.marginLeft = FRAME_WIDTH - 42 + 'px';
				frameClose.onmouseup = closeFrame;
				frameWrap.appendChild(frameClose);
			}

			if (opt.drag) {
				frameDrag = createElement('div');
				frameDrag.setAttribute('id', opt.drag.id || 'rymnik-widget-popup-drag');
				frameDrag.onmousedown = onFrameDragMouseDown;
				frameWrap.appendChild(frameDrag);
			}

			frameWrap.appendChild(frame);
			docBody.appendChild(frameWrap);

			makeElementFixed(frameWrap, {
				onWindowResize: function (o) {
					if (!opt.width && !opt.height) {
						setElementStyles(o.element, {
							left: '0px',
							top: '0px',
							width: getWinWidth() + 'px',
							height: getWinHeight() + 'px'
						});
					} else {
						setElementStyles(o.element, {
							left: Math.floor(getWinWidth() / 2 - opt.width / 2) + 'px',
							top: Math.floor(getWinHeight() / 2 - opt.height / 2) + 'px',
							width: opt.width + 'px',
							height: opt.height + 'px'
						});
					}
				}
			});

			frameInserted = 1;
			frameVisible = 0;

			return {
				instance: frame,
				show: showFrame,
				hide: hideFrame,
				toggle: toggleFrame,
				close: closeFrame,
				destroy: destroyFrame
			};
		}, // /createFrame

// ------------ anchor ------------
		onAnchorClick = function () {
			if (createCardFrame) {
				return createCardFrame;
			}
			createCardFrame = createFrame(FRAME_URL + '#' + 'agentcreateframe', {
				name: 'rymnik-frame-' + new Date().getTime().toString(36),
				wrap: {
					id: 'rymnik-widget-card-create-wrap',
					styles: {
						zIndex: 999999997
					}
				},
				width: 600,
				height: 450,
				drag: {
					id: 'rymnik-widget-card-drag'
				},
				//close: 1,
				onLoad: onCardFrameLoad,
				onClose: function () {
					createCardFrame = createCardFrame.destroy();
				}
			});
			activeFrame = createCardFrame;
			activeFrame.show();
		},

		onAnchorHomeLinkClick = function (e) {
			stopEvent(e);
		},

		insertAnchor = function () {
			var homeLink = createElement('a');
			anchorElement = createElement('div');
			anchorElement.setAttribute('id', 'rymnik-widget-anchor');
			homeLink.setAttribute('id', 'rymnik-widget-anchor-home');
			homeLink.setAttribute('href', ROOT_URL);
			homeLink.setAttribute('target', '_blank');
			homeLink.setAttribute('title', 'Открыть сайт NameYourHorse');
			addEvent(anchorElement, 'mouseup', onAnchorClick);
			addEvent(homeLink, 'mouseup', onAnchorHomeLinkClick);
			anchorElement.appendChild(homeLink);
			docBody.appendChild(anchorElement);
			makeElementFixed(anchorElement, {
				onWindowResize: function (opt) {
					opt.element.style.top = Math.floor(getWinHeight() - 100) + 'px';
					opt.element.style.left = '0px';
				}
			});
		},

		insertStyle = function () {
			var el = createElement('style');
			el.innerHTML = STYLES.replace(/\s+/gi, ' ');
			docBody.appendChild(el);
		},

		showOverlay = function () {
			if (winOverlay) {
				hideOverlay();
			}
			winOverlay = createElement('div');
			setElementStyles(winOverlay, {
				position: 'fixed',
				border: '0 none',
				margin: '0',
				padding: '0',
				left: '0px',
				top: '0px',
				width: '100%',
				height: '100%',
				backgroundColor: '#FFF',
				opacity: 0.8,
				zIndex: '999999997'
			});
			docBody.appendChild(winOverlay);
		},

		hideOverlay = function () {
			if (!winOverlay) {
				return 0;
			}
			docBody.removeChild(winOverlay);
			winOverlay = null;
		},

		onSiteFrameLoad = function () {
			__rymnikAgentHub.register('rymnik-site-frame', siteFrame.instance.contentWindow);
		},

		onCardFrameLoad = function () {
			__rymnikAgentHub.register('rymnik-create-card-frame', createCardFrame.instance.contentWindow);
		},

		prepare = function () {
			if (!Array.prototype.forEach) {
				Array.prototype.forEach = function (fn, scope) {
					var i, l;
					for (i = 0, l = this.length; i < l; i++) {
						if (this.hasOwnProperty(i)) {
							fn.call(scope, this[i], i, this);
						}
					}
				};
			}
			docBody = doc.getElementsByTagName('body')[0];
			docHtml = doc.getElementsByTagName('html')[0];
			ua.fixed = !(ua.ie6 || !testFixed()); // position fixed support
			__rymnikExtConnect.answer = agentExtAnswer;
			__rymnikAgentProxy.answer = agentProxyAnswer;
			__rymnikAgentHub.register('rymnik-agent', window);	// window === window.top
		},

		agentExtAnswer = function (data, fn) {
			//console.log('Incoming request from extension: ' + __rymnikJSON.stringify(data));
			return fn({});
		},

		agentProxyAnswer = function (from, data, fn) {
			//console.log('ROOT: Incoming message from: ' + from + ' data: ' + data);
			if (data.method && typeof sharedMethods[data.method] === FUNC) {
				return sharedMethods[data.method](data, fn);
			}
			return fn();
		},

		isElementInViewport = function (element, opt) {
			opt = opt || {};
			var r = opt.elementRects || element.getBoundingClientRect(),
				p = opt.elementPosition || getElementPos(element);
			if ((r.top < -p.height / 2 || r.bottom < -p.height / 2) ||
				(r.left < -p.width / 2 || r.right < -p.width / 2)
			) {
				return 0;
			}
			return 1;
		},

		isElementVisible = function (element, opt) {
			opt = opt || {};
			var p = opt.elementPosition || getElementPos(element),
				r = opt.elementRects || element.getBoundingClientRect();
			if (p.width <= 0 || p.height <= 0 ||
				element.style.visibility === 'hidden' || element.style.display === NONE ||
				!isElementInViewport(element, opt)
				) {
				return 0;
			}
			if (typeof doc.elementFromPoint === UNDEF) {
				return 1;
			}
			if (doc.elementFromPoint(Math.floor(r.left + p.width * 0.5), Math.floor(r.top + p.height * 0.5)) !== element &&
				doc.elementFromPoint(Math.floor(r.left + p.width * 0.1), Math.floor(r.top + p.height * 0.1)) !== element &&
				doc.elementFromPoint(Math.floor(r.left + p.width * 0.9), Math.floor(r.top + p.height * 0.9)) !== element
				) {
				return 0;
			}
			return 1;
		},

// ------------ imageGrabber ------------
		imageGrabber = function (opt, fn) {
			//console.log('imageGrabber: enter')
			var docImageElements,
				docImageElementsTimer,
				docImageViewElements,
				isSelectionRedraw,

				onWindowScroll = function () {
					if (isSelectionRedraw) {
						return 0;
					}
					isSelectionRedraw = 1;
					removeCloneImages();
					winOverlay.style.display = NONE;
					cloneImages();
					winOverlay.style.display = BLOCK;
					setTimeout(function () {
						isSelectionRedraw = 0;
					}, 50);
				},

				filterImages = function () {
					var filtered = [];
					docImageElements.forEach(function (e) {
						if (!e.src ||
							e.src.indexOf('data:image') !== -1 ||
							(e.width < 100 && e.height < 60)) {
							return 0;
						}
						filtered.push(e);
					});
					docImageElements = filtered;
					return docImageElements && docImageElements.length;
				},

				cloneImages = function () {
					if (!docImageElements || !docImageElements.length) {
						return 0;
					}
					docImageViewElements = [];
					docImageElements.forEach(function (e) {
						var p = getElementPos(e),
							r = e.getBoundingClientRect();
						if (!isElementVisible(e, {
							elementPosition: p,
							elementRects: r
						})) {
							return 0;
						}
						var I = createElement('img'),
							E = createElement('div'),
							url = e.style && e.style.backgroundImage ? e.style.backgroundImage : e.src;
						I.onload = function () {
							if (I.width < 100 || I.height < 60) {
								I = null;
								return 0;
							}
							I.width = p.width;
							I.height = p.height;
							setElementStyles(E, {
								position: 'fixed',
								margin: '0',
								padding: '0',
								top: r.top - 1 + 'px',
								left: r.left - 1 + 'px',
								width: p.width + 'px',
								height: p.height + 'px',
								border: '1px solid red',
								cursor: 'pointer',
								zIndex: '999999998'
							});
							E.onmousedown = function (event) {
								//console.log('imageGrabber: img click')
								var url = [I.src];
								stopEvent(event);
								destroyImageSelection();
								//console.log(url)
								fn({
									u: url
								});
							};
							E.appendChild(I);
							docBody.insertBefore(E, docBody.firstChild);
							docImageViewElements.push(E);
						};
						I.src = url;
						I.alt = '';
					});
				},

				removeCloneImages = function () {
					if (!docImageViewElements || !docImageViewElements.length) {
						return 0;
					}
					docImageViewElements.forEach(function (element) {
						element.onmousedown = null;
						docBody.removeChild(element);
					});
					docImageViewElements = [];
				},

				destroyImageSelection = function () {
					opt = opt || {};
					clearTimeout(docImageElementsTimer);
					isImageGrabberActive = 0;
					removeEvent(win, 'scroll', onWindowScroll);
					removeEvent(win, 'resize', onWindowScroll);
					removeCloneImages();
					if (activeFrame) {
						activeFrame.toggle();
					}
					toggleUnwantedElements(1);
					hideOverlay();
					docImageElements = [];
					docImageElementsTimer = null;
				},

				getDocumentImagesElements = function (timer) {
					docImageElements = docBody.getElementsByTagName('img');
					docImageElements = arrayFrom(docImageElements);
					if (timer) {
						docImageElementsTimer = setTimeout(function () {
							getDocumentImagesElements(1);
							filterImages();
						}, 1000);
					}
				};

			getDocumentImagesElements();
			if (!docImageElements || !docImageElements.length) {
				return fn();
			}
			if (!filterImages()) {
				return fn();
			}
			getDocumentImagesElements(1);
			if (activeFrame) {
				activeFrame.toggle();
			}
			toggleUnwantedElements(0);
			cloneImages();
			showOverlay();
			winOverlay.onmousedown = function (event) {
				//console.log('imageGrabber: overlay click')
				stopEvent(event);
				destroyImageSelection();
				fn();
				return false;
			};
			addEvent(win, 'scroll', onWindowScroll);
			addEvent(win, 'resize', onWindowScroll);
			isImageGrabberActive = 1;
		}, // /imageGrabber

// ------------ take screenshot ------------
		screenShotRect = function (opt, fn) {
			var rectElement = createElement('div'),
				rectMouse = {},
				overlayMouseDown = function (event) {
					stopEvent(event);
					var p = getMousePos(event);
					rectMouse.x1 = p.x;
					rectMouse.y1 = p.y;
					winOverlay.onmouseup = overlayMouseUp;
					rectElement.onmouseup = overlayMouseUp;
					winOverlay.onmousemove = overlayMouseMove;
					rectElement.onmousemove = overlayMouseMove;
					rectElement.style.top = rectMouse.y1 + 'px';
					rectElement.style.left = rectMouse.x1 + 'px';
				},
				overlayMouseMove = function (event) {
					stopEvent(event);
					var p = getMousePos(event),
						dx, dy;
					rectMouse.x2 = p.x;
					rectMouse.y2 = p.y;
					dx = rectMouse.x2 - rectMouse.x1;
					dy = rectMouse.y2 - rectMouse.y1;
					rectMouse.w = dx > 0 ? dx : 0;
					rectMouse.h = dy > 0 ? dy : 0;
					rectElement.style.width = rectMouse.w + 'px';
					rectElement.style.height = rectMouse.h + 'px';
				},
				overlayMouseUp = function (event) {
					stopEvent(event);
					winOverlay.onmousedown = null;
					winOverlay.onmouseup = null;
					winOverlay.onmousemove = null;
					destroy();
					setTimeout(function () {
						__rymnikExtConnect.question({
							method:	'getScreenshot',
							params:	{
								left: rectMouse.x1,
								top: rectMouse.y1,
								width: rectMouse.w,
								height: rectMouse.h
							}
						}, function (r) {
							activeFrame.show();
							fn({
								d: r
							});
						});
					}, 500);
				},
				destroy = function () {
					hideOverlay();
					docBody.removeChild(rectElement);
					rectElement = null;
					toggleUnwantedElements(1);
				};
			activeFrame.hide();
			showOverlay();
			setElementStyles(rectElement, {
				position: 'absolute',
				width: 0,
				height: 0,
				top: 0,
				left: 0,
				borderRadius: '3px',
				border: '2px solid #2A2AFF',
				backgroundColor: '#2AAAFF',
				opacity: 0.7,
				zIndex: '999999999'
			});
			docBody.appendChild(rectElement);
			setElementStyles(winOverlay, {
				cursor: 'crosshair',
				opacity: 0
			});
			winOverlay.onmousedown = overlayMouseDown;
		},

// ------------ share methods ------------
		sharedMethods = {
			getPageInfo: function (opt, fn) {
				//console.log('sharedMethods.getPageInfo()')
				fn({
					u: loc.href,
					t: doc.title
				});
			},

			getImages: function (opt, fn) {
				//console.log('sharedMethods.getImages()')
				if (isImageGrabberActive) {
					//console.log('getImages(): isImageGrabberActive')
					return fn();
				}
				imageGrabber(opt, fn);
			},

			getScreenshot: function (opt, fn) {
				screenShotRect(opt, fn);
			},

			closeActive: function (opt, fn) {
				if (activeFrame) {
					activeFrame.close();
				}
			}
		},

// ------------ main ------------
		main = function () {
			if (typeof __rymnikExtConnect === UNDEF ||
				typeof __rymnikAgentProxy === UNDEF) {
				return 0;
			}
			prepare();
			insertStyle();
			insertAnchor();
			return 1;
		};

	return main();
}());
