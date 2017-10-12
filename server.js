 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });

app.get("/latest", function (request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(queryCatalogue));
})

app.get("/imagesearch/:query", function (request, response) {
  var page,
      time = new Date();
  if (request.query.offset == 0 || request.query.offset == null) {
    return page = 1;
  } else if (request.query.offset < 0) {
    return page = 1;
  } else if (request.query.offset == Math.abs(request.query.offset)) {
    return page = request.query.offset + 1;
  } else {
    response.end("Offset entry is invalid. Please type a number or leave it blank.");
  };
  queryCatalogue.push({
    term: request.params.query,
    page: page,
    when: time.toString()
  });
  var url = "https://www.googleapis.com/customsearch/v1?q=" + request.params.query +"&cx=" + process.env.CSE_ID + "&key=" + process.env.API_KEY +
             "&searchType=image&start=" + page,
      xhr = new XMLHttpRequest(),
      packet = [];
  xhr.open("GET", url);
  xhr.send();
  xhr.onload = function() {
    var json = JSON.parse(xhr.responseText).items;
    json.forEach(function (item) {
      packet.push({
        url: item.link,
        snippet: item.snippet,
        thumbnail: item.image.thumbnailLink,
        context: item.image.contextLink
      });
    });
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(packet));
  };
});

var queryCatalogue = []; 

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('error in image query');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});