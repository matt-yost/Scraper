'use strict';

(function (){

  const fs = require('fs');
  const cheerio = require('cheerio');
  const request = require('request');
  const csv = require('csv-stringify');

  const url = "http://www.shirts4mike.com/";

  var scrape = function(url, body) {
    var $ = cheerio.load(body);
    var data = {
      'Title': $(body).find('div.shirt-details h1').text().slice(4),
      'Price': $(body).find('div.shirt-details span.price').text(),
      'ImageURL': $(body).find('div.shirt-picture img').attr('src'),
      'Time': new Date().toString()
    }
    console.log(data);
  }

  request(url, function (error, response, body) {
    if(error) {
        console.error(error.message);
    } else {
      var $ = cheerio.load(body);
      var href = $('li.shirts a').attr('href');
      var nextUrl = url + href;
      //console.log(nextUrl);
      request(nextUrl, function (error, response, body) {
        if(error) {
          console.error(error.message);
        } else {
          var $ = cheerio.load(body);
          $('ul.products a').each(function() {
            var href = $(this).attr('href');
            var nextUrl = url + href;
            request(nextUrl, function(error, response, body) {
              if(error) {
                console.error(error.message);
              } else {
                scrape(nextUrl, body);
              }
            });
          });
        }
      });
    }
  });

// The end
})();
