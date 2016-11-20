"use strict";

const gURL = "https://www.googleapis.com/customsearch/v1?key=" + API_KEY +"&cx=" + CX + "&q=";

window.addEventListener("load", () => { new BlogAnalysis(); });

function debug(str) {
  console.log("// DEBUG " + str);
}

function doXHRQuery(url, callback) {
  var req = new XMLHttpRequest();
  req.addEventListener("load", callback);
  req.open("GET", url);
  req.send();
}

class BlogAnalysis {
  constructor() {
    debug("init");

    this.keyword = document.getElementById("keyword");
    this.result = document.getElementById("result");
    this.worker = new Worker("worker.js");

    this.keyword.addEventListener("change", () => {
      debug(keyword.value);
      var url = gURL + encodeURIComponent(keyword.value);
      this.doOrCallWorker(url);
    });
  }

  doOrCallWorker(url) {
    if (this.worker) {
      debug("WORKER!!!");
      this.worker.postMessage(url);
      this.worker.onmessage = (function(e) {
        var div = document.createElement('div');
        div.textContent = e.data.title;
        var words = e.data.words;
        for (var w in words) {
          if (words.hasOwnProperty(w)) {
            var span = document.createElement('div');
            span.textContent = " - " + w + " " + words[w]; 
            div.appendChild(span);
          }
        }
        this.result.appendChild(div);
      }).bind(this);
    } else {
      // fallback
      doXHRQuery(url, this.parseSearchResult.bind(this));
    }
  }

  parseSearchResult(evt) {
    var json = JSON.parse(evt.target.response);
    var term = json.queries.request[0].searchTerms;
    debug(term);
    json.items.forEach((item) => {
      var div = document.createElement('div');
      div.textContent = item.snippet;
      this.result.appendChild(div);
      var url = item.link;
      doXHRQuery(url, (evt) => {
        var text = evt.target.response;
        var div = document.createElement('div');
        var article = text.match(/<article class="content((.|\n)+?)<\/article>/g)[0];
        var reg = /\W ([a-zA-Z]+) \W/g;
        var words;
        while((words = reg.exec(article)) !== null) {
          div.textContent += words[1] + ' ';
        }
        this.result.appendChild(div);
      });
    });
  }
}
