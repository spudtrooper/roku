Roku = {};

/**
 * A roku controller.
 * @param {string} host Host on the local network.
 * @param {number} port Port of the roku box on the local network, defaults
 *     to 8060.
 */
Roku.Controller = function(opt_host, opt_port) {
  /** @private {string} */
  this.host_ = opt_host || '192.168.1.110';
  
  /** @private {number} */
  this.port_ = opt_port ? Number(opt_port) : 8060;

  /** @private {Array.<!Roku.Channels>} */
  this.apps_ = null;
};

/** @return {string} The host of this box. */
Roku.Controller.prototype.getHost = function() {
  return this.host_;
}

Roku.Controller.prototype.postToUrl_ = function(url, params) {
  var iframe = document.getElementById('iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  var iframeUrl = 'iframe.html?' + (Math.random()) + '#' + url;
  log(iframeUrl);
  
  iframe.src = iframeUrl;
};

/**
 * Sends a key press to the roku box.
 * @param {string} The key name -- e.g. 'Home'.
 */
Roku.Controller.prototype.pressKey = function(key) {
  this.sendCommand(['keypress', key]);
};


/**
 * Launches the app.
 * @param {!Roku.Channel} app
 */
Roku.Controller.prototype.launchApp = function(app) {
  log('Launching app ' + app);
  this.launchChannel_(app.getId());
}


/**
 * Launches a channel from the channel id.
 * @param {number} The channel id.
 */
Roku.Controller.prototype.launchChannel_ = function(channelId) {
  this.sendCommand(['launch', channelId]);
}

/**
 * Gets the url of the icon for the app.
 * @param {!Roku.Channel} app
 */
Roku.Controller.prototype.getIconPath = function(app) {
  return this.getUrl_(['query', 'icon', app.getId()]);
};

Roku.Controller.prototype.getUrl_ = function(opt_path) {
  var path = opt_path || '';
  if (!Array.isArray(path)) {
    path = [path];
  }
  var url = 'http://' + this.host_;
  if (this.port_) {
    url += ':' + this.port_;
  }
  url += '/';
  url += path.join('/');
  return url;
};

/** @return {Array.<!Roku.Channel>} The apps or null. */
Roku.Controller.prototype.appsFromXml_ = function(xml) {
  // TODO: This check sucks
  if (xml.indexOf('Warning') > -1) {
    return null;
  }
  var parser = new DOMParser();
  xmlDoc = parser.parseFromString(xml,"text/xml");
  var appNodes = xmlDoc.getElementsByTagName('app');
  var apps = [];
  for (var i = 0; i < appNodes.length; i++) {
    var appNode = appNodes[i];
    var app = new Roku.Channel(
      appNode.getAttribute('id'), 
      appNode.getAttribute('version'),
      appNode.getAttribute('name'));
    apps.push(app);
  }
  return apps;
};


/**
 * Gets the apps.
 * @param {function(!Array.<!Roku.Channel>, !Roku.Controller}:} callback
 */
Roku.Controller.prototype.getApps = function(callback) {
  log('getApps');
  var thiz = this;
  if (this.apps_) {
    log('getApps_: have apps');
    callback(this.apps_, this);
    return;
  }
  var url = getBaseUrl() + 'apps.php?n=' + this.host_.replace(/.*\./, '');
  log('getApps_: looking up apps - ' + url);
  ajax(url, function(xml) {
    var apps = thiz.appsFromXml_(xml);
    log('Found ' + (apps ? apps.length : null) + ' apps');
    if (apps) {
      thiz.apps_ = apps;
      callback(thiz.apps_, thiz);
    }
  });
};

Roku.Controller.prototype.sendCommand = function(path, values) {
  var url = this.getUrl_(path);
  if (values) {
    var first = true;
    for (key in values) {
      if (values.hasOwnProperty(key)) {
	url += (first ? '?' : '&');
	url += key + '=' + escape(values[key]);
	first = false;
      }
    }
  }
  log('sendCommand: ' + url);
  this.postToUrl_(url);
};

/**
 * A Roku application.
 * @param {string} id The app id.
 * @param {string} verison The app version.
 * @param {string} name The app name.
 */
Roku.Channel = function(id, version, name) {
  this.id_ = id;
  this.version_ = version;
  this.name_ = name;
};

/** @return {string} The app id. */
Roku.Channel.prototype.getId = function() {
  return this.id_;
};

/** @return {string} The app version. */
Roku.Channel.prototype.getVersion = function() {
  return this.version_;
};

/** @return {string} The app name. */
Roku.Channel.prototype.getName = function() {
  return this.name_;
};

/** @return {string} */
Roku.Channel.prototype.toString = function() {
  return this.name_;
};


/**
 * GUI control for a Roku.
 * @param {!Roku.Controller} roku
 */
Roku.Gui = function(roku) {
  this.roku_ = roku;
};

Roku.Gui.prototype.init = function() {
  var thiz = this;
  this.roku_.getApps(function(apps, c) {
    thiz.showIcons_(apps);
    thiz.showHost(c);
  });
};

Roku.Gui.prototype.showHost = function(controller) {
  var div = document.getElementById('host');
  div.value = controller.getHost();
};

Roku.Gui.prototype.showIcons_ = function(apps) {
  var div = getOrAddElement('channels', 'div');
  var thiz = this;
  for (var i = 0; i < apps.length; i++) {
    var app = apps[i];
    var imgUrl = this.roku_.getIconPath(app);
    var a = document.createElement('a');
    a.href ='#';
    a.addEventListener('click', (function() {
      var roku_ = thiz.roku_;
      var app_ = app;
      return function(e) {
	roku_.launchApp(app_);
      }
    })(), false);
    var img = document.createElement('img');
    img.className = 'icon';
    img.addEventListener('error', (function() {
      var img_ = img;
      return function(e) {
	img_.parentNode.removeChild(img_);
      }
    })(), false);
    img.src = imgUrl;
    div.appendChild(a);
    a.appendChild(img);
  }
};

/**
 * Finds a roku player and calls back with the first one.
 * @param {number=} opt_startByte The first byte of the start local address to
 *     use -- e.g. 192.168.1.<opt_startByte>.
 * @param {number=} opt_endByte The first byte of the end local address to
 *     use -- e.g. 192.168.1.<opt_startByte>.
 */
Roku.Provider = function(opt_startByte, opt_endByte) {
  this.startByte = opt_startByte || 100;
  this.endByte = opt_endByte || 255;
  this.controller_ = null;
  this.looking_ = false;
};

/**
 * Gets the controller.
 * @param {function(!Roku.Controller):} callback
 */
Roku.Provider.prototype.getController = function(callback) {
  if (this.controller_) {
    callback(this.controller_);
    return;
  }
  this.looking_ = true;
  log('Looking from ' + this.startByte + ' to ' + this.endByte);
  for (var i = this.startByte; i <= this.endByte; i++) {
    this.getController_(i, callback);
  }
};

Roku.Provider.prototype.getController_ = function(hostByte, callback) {
  var host = '192.168.1.' + hostByte;
  var controller = new Roku.Controller(host);
  var thiz = this;
  log('Trying to get controller from ' + host);
  controller.getApps(function(apps, c) {
    if (!thiz.looking_) {
      return;
    }
    if (!apps) {
      return;
    }
    this.looking_ = false;
    callback(c);
  });
};

/**
 * Sets the controller.
 * @param {!Roku.Controller} controller
 */
Roku.Provider.prototype.setController = function(controller) {
  this.controller_ = controller;
};

/** 
 * Resets the controller so that the next call to {@code
 * #getController} will not used the cached one.
 */
Roku.Provider.prototype.reset = function() {
  this.controller_ = null;
  this.looking_ = true;
};


function getOrAddElement(id, nodeName) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement(nodeName);
    el.id = id;
    document.body.appendChild(id);
  }
  return el;
};

function log(msg) {
  var str = '[Roku ' + Date() + '] ' + msg;
  try {console.log(str);} catch (_) {}
}

function getBaseUrl() {
  var loc = document.location;
  return loc.origin + loc.pathname;
}

/**
 * Makes an async request to url and calls 'f' with the text result.
 * @param {string} url The path.
 * @param {function(string):} callback The callback.
 */
function ajax(url, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      callback(xmlhttp.responseText);
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}