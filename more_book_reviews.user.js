// ==UserScript==
// @name           more book reviews
// @namespace      http://github.com/simonetta
// @include        http://www.amazon.co.jp/*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// ==/UserScript==

(function() {

var Services = {
  yonda4: {
    header: '読んだ4!のレビュー',
    URL: 'http://yonda4.com',

    getUrl: function(asin) {
      return this.URL + '/asin/' + asin;
    },
    checkDocument: function(doc) {
      return !!($('.pagination_desc', doc).get(0));
    },
    createReviewList: function(doc) {
      var URL = this.URL;
      return $('.pagination_desc', doc).eq(0).next().find('tr').map(function() {
        var cells = $('td', $(this));
        var links = $('a', cells.eq(1));
        return {
          user: links.eq(0).text(),
          userLink: URL + links.eq(0).attr('href'),
          permalink: links.eq(1).attr('href'),
          date: links.eq(1).text(),
          review: $.trim(cells.eq(2).text())
        };
      });
    }
  },

  Booklog: {
    option: {
      overrideMimeType: 'text/plain; charset=EUC-JP'
    },
    header: 'ブクログのレビュー',

    getUrl: function(asin) {
      return 'http://detail.booklog.jp/asin/' + asin;
    },
    checkDocument: function(doc) {
      return !!($('.asin_start', doc).get(0));
    },
    createReviewList: function(doc) {
      var re = {
        user: / さんのレビュー$/,
        userLink: /\/archives\/\d+/,
        date: /\d+-\d+-\d+/
      };
      return $('.autopagerize_page_element > div', doc).map(function() {
        var permalink = $('a', this).eq(0).attr('href');
        var review = $('.asin_userbox_com', this)
          .contents().filter(function() { return this.nodeType == 3; }).eq(0);

        return {
          user: $('b:first', this).text().replace(re.user, ''),
          userLink: permalink.replace(re.userLink, ''),
          permalink: permalink,
          date: $('div:last', this).text().match(re.date)[0],
          review: review
        };
      });
    }
  },

  DokushoMeter: {
    header: '読書メーターのレビュー',
    URL: 'http://book.akahoshitakuya.com',

    getUrl: function(asin) {
      return this.URL + '/b/' + asin;
    },
    checkDocument: function(doc) {
      return !!($('h2:contains("読書したみんなとコメント・感想")', doc).get(0));
    },
    createReviewList: function(doc) {
      var URL = this.URL;
      return $('h2:contains("読書したみんなとコメント・感想")', doc).nextAll().map(function() {
        var link = $('a', this).eq(0);
        var texts = $(this).contents().filter(function() { return this.nodeType == 3; });
        return {
          user: link.text(),
          userLink: URL + link.attr('href'),
          date: texts.get(0).nodeValue.split('：')[0],
          review: $.trim(texts.get(1).nodeValue)
        };
      });
    }
  }

};

var re1 = /^(ISBN-10|ASIN):$/;
var re2 = /^(ISBN-10|ASIN):\s*/;
var asin = $('li b').filter(function() { return re1.test($(this).text()); })
                    .parent().text().replace(re2, '');

if (asin) {
  $.each([
    '#customerReviews ~ hr.bucketDivider',
    'div.bucket:contains("カスタマーレビュー") ~ hr.bucketDivider',
    // カスタマーレビューが見つからない場合は適当に(目立つように上の方)
    'hr.bucketDivider:first'
  ], function(i, s) {
    var e = $(s);
    if (!!e.get(0)) {
      for (var name in Services) {
        request(Services[name], asin, e.eq(0));
      }
      return false;
    }
    return true;
  });
}

function request(service, asin, bucketDivider) {
  var row = $('<tr>').append($('<td>').attr('valign', 'top'))
                     .append($('<td>').append($('<div>').css('width', '3em').append('&nbsp;'))
                     .append('&nbsp;'))
                     .append($('<td>').attr({ width: 305, valign: 'top' }));
  var table = $('<table>').attr({ cellspacing: 0, cellpadding: 0, border: 0, width: '94%' })
                                .append($('<tbody>').append(row));
//  var cell = $('td:first', row).text('読み込み中...');
  var cell = $('td:first', row).append(getLoadingImage());

  // bucketDivider
  $('<hr>').attr({ 'class': 'bucketDivider', align: 'left', noshade: 'noshade', size: 1 })
           .insertBefore(bucketDivider);

  // bucket
  var bucket = $('<div>').attr('class', 'bucket')
                         .append($('<h2>').text(service.header))
                         .append($('<div>').attr('class', 'content').append(table))
                         .insertBefore(bucketDivider);

  GM_xmlhttpRequest($.extend({
    method: 'GET',
    url: service.getUrl(asin),
    onload: function(res) {
      var doc = createHTMLDocument(res.responseText);
      if (service.checkDocument(doc)) {
        cell.empty()
            .append($('<p>').append($('<a>').attr('href', this.url)
                                            .text($('title', doc).text())));
        $.each(service.createReviewList(doc), function() {
          if (this.review) {
            cell.append(createReviewTable(this));
          }
        });
      }
      else {
        cell.text('該当するページはありません。');
      }
    },
    onerror: function(r) { cell.text('エラーが発生しました。'); }
  }, service.option));
}

function createReviewTable(data) {
  var row = $('<tr>')
    .append($('<td>').attr({ align: 'right', width: 0, valign: 'top' })
                     .append('&nbsp;'))
    .append($('<td>').attr({ align: 'left', width: '100%', valign: 'top' })
                     .append(createReviewHeader(data))
                     .append(data.review)
                     .append($('<div>').css({ 'padding-top': '10px', clear: 'both', width: '100%' })));
  return $('<table>').attr({ cellspacing: 0, cellpadding: 0, border: 0 })
                     .append($('<tbody>').append(row));
}

function createReviewHeader(data) {
  var user = $('<a>').attr('href', data.userLink)
                     .append($('<span>').css('font-weight', 'bold').append(data.user));
  var date = data.permalink
    ? $('<a>').attr('href', data.permalink).append($('<nobr>').append(data.date))
    : $('<nobr>').append(data.date);

  var row = $('<tr>').append($('<td>').attr('valign', 'top').append('By&nbsp;'))
                     .append($('<td>').append(user).append(' - ').append(date));
  var table = $('<table>').attr({ cellspacing: 0, cellpadding: 0, border: 0 })
                          .append($('<tbody>').append(row));

  return $('<div>').css('margin-bottom', '0.5em').append(table);
}

// 文字列から HTML ドキュメントを生成 (autopagerize.user.js)
function createHTMLDocument(text) {
  var re = /^[\s\S]*?<html(?:[ \t\r\n][^>]*)?>|<\/html[ \t\r\n]*>[\w\W]*$/ig;
  text = text.replace(re, '');
  var doc = document.implementation.createDocument(null, 'html', null);
  var range = document.createRange();
  range.setStartAfter(document.body);
  var df = range.createContextualFragment(text);
  try {
    df = doc.adoptNode(df);
  } catch (e) {
    df = doc.importNode(df, true);
  }
  doc.documentElement.appendChild(df);
  return doc;
}

function getLoadingImage() {
  return $('<img>').attr('src', 'data:image/gif;base64,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');
}

})();
