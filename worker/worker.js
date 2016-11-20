function doXHRQuery(url, callback) {
  var req = new XMLHttpRequest();
  req.addEventListener("load", callback);
  req.open("GET", url);
  req.send();
}

function debug(str) {
  console.log("// WORKER DEBUG " + str);
}

onmessage = function(e) {
  var url = e.data;
  var record = {};
  doXHRQuery(url, (evt) => {
    var json = JSON.parse(evt.target.response);
    var term = json.queries.request[0].searchTerms;
    debug(term);
    json.items.forEach((item) => {
      var url = item.link;
      doXHRQuery(url, (evt) => {
        record = {title: item.title, url: url, snippet: item.snippet, words: {}};
        var text = evt.target.response;
        var article = text.match(/<article class="content((.|\n)+?)<\/article>/g)[0];
        var reg = /\W ([a-zA-Z]+) \W/g;
        var words;
        while((words = reg.exec(article)) !== null) {
          var w = words[1];
          if (record.words[w]) {
            ++record.words[w];
          } else {
            record.words[w] = 1;
          }
        }
        postMessage(record);
      });
    });
  });
}
