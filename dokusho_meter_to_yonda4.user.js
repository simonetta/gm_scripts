// ==UserScript==
// @name           dokusho meter to yonda4
// @namespace      http://github.com/simonetta
// @include        http://book.akahoshitakuya.com/b/*
// ==/UserScript==

(function() {

var form = $X('//div[@class="book_edit_area"]/form[@action="/b" and @method="post" and not(@class) and not(@onsubmit)]');
if (form.length == 1) {
  form[0].addEventListener('submit', function() {
    var title = $X('//h1["#title"]/text()');
    var comment = $X('./input[@name="comment"]', form[0])[0].value;
    var status = '@yonda4 ' + title + (comment ? ' ' + comment : '');
    postStatus(status);
  }, false);
}

function postStatus(status) {
  GM_xmlhttpRequest({
    method: 'POST',
    url: 'http://twitter.com/statuses/update.xml',
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    data: 'status=' + encodeURIComponent(status),
    onerror: function(r) { alert(r.status + ':' + r.statusText); }
  });
}

// cho45 - http://lowreal.net/
function $X(expression, context) {
  var Node = unsafeWindow.Node;
  if (!context) context = document;
  var doc = context.ownerDocument || context;
  var resolver = function(prefix) {
    var o = doc.createNSResolver(context)(prefix);
    return o ? o : (doc.contentType == 'text/html') ? '' : 'http://www.w3.org/1999/xhtml';
  };
  var exp = doc.createExpression(expression, resolver);

  var result = exp.evaluate(context, XPathResult.ANY_TYPE, null);
  switch (result.resultType) {
    case XPathResult.STRING_TYPE: return result.stringValue;
    case XPathResult.NUMBER_TYPE: return result.numberValue;
    case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: {
      result = exp.evaluate(context, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var ret = [];
      for (var i = 0, len = result.snapshotLength; i < len; i++) {
        var item = result.snapshotItem(i);
        switch (item.nodeType) {
          case Node.ATTRIBUTE_NODE:
          case Node.TEXT_NODE:
            ret.push(item.textContent);
            break;
          default:
            ret.push(item);
        }
      }
      return ret;
    }
  }
  return null;
}

})();
