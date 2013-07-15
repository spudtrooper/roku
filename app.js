Roku.App = function() {
  this.provider_ = new Roku.Provider();
};

Roku.App.prototype.pressKey = function(key) {
  this.provider_.getController(function(roku) {
    roku.pressKey(key);
  });
}

Roku.App.prototype.init = function() {
  var host = null;
  // Look for the host in params
  var params = getParams();
  if (params['host']) {
    host = params['host'];
    log('Found host from params');
  }
  // Look in local storage
  if (!host) {
    host = localStorage['host'];
    log('Found host in localStorage');
  }
  if (host) {
    var roku = new Roku.Controller(host);
    this.provider_.setController(roku);
    this.initRoku_(roku);
  } else {
    this.reset_();
  }
};

/** Resets and looks for a new controller. */
Roku.App.prototype.reset = function() {
  localStorage['host'] = null;
  this.reset_();
};

Roku.App.prototype.reset_ = function() {
  var thiz = this;
  this.provider_.getController(function(roku) {
    thiz.initRoku_(roku);
  });
};

Roku.App.prototype.initRoku_ = function(roku) {
  log('initRoku_: roku=' + roku);
  var gui = new Roku.Gui(roku);
  gui.init();
};

function getParams() {
  /*
   * http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
   */
  var params = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (typeof params[pair[0]] === "undefined") {
      params[pair[0]] = pair[1];
    } else if (typeof params[pair[0]] === "string") {
      var arr = [params[pair[0]], pair[1]];
      params[pair[0]] = arr;
    } else {
      params[pair[0]].push(pair[1]);
    }
  } 
  return params;
}