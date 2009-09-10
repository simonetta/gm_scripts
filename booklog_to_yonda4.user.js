// ==UserScript==
// @name           booklog to yonda4
// @namespace      http://github.com/simonetta
// @include        http://booklog.jp/addbook.php*
// ==/UserScript==

(function() {

var form = $X('id("frm")');
if (form.length == 1) {
  $X('.//input[@type="button" and @onclick="document.frm.submit();"]', form[0]).forEach(function(e) {
    e.addEventListener('click', function() {
      var title = $X('.//table//h3/text()', form[0]);
      var comment = $X('id("comment")')[0].value;
      var status = '@yonda4 ' + title + (comment ? ' ' + comment : '');
      postStatus(status);
    }, false);
  });
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
