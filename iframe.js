var onLoad = function() {
  var url = String(document.location.hash);
  if (url) {
    url = url.substring(1);
    postToUrl(url);
  }
};

var postToUrl = function(url, params) {
  var form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', url);
  
  for(var key in params) {
    if (params.hasOwnProperty(key)) {
      var hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', params[key]);
      form.appendChild(hiddenField);
    }
  }
  form.onsubmit = function() {
    return false;
  };
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};