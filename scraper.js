'use strict';

(function (){

  const fs = require('fs');
  const cheerio = require('cheerio');
  const request = require('request');
  const csv = require('csv-stringify');

  const url = "http://www.shirts4mike.com/";

  var dataArray = [];

  var dateGetter = function() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth();
    var date = d.getDate();

    return y + '-' + m + '-' + date;
  };

  var makeDir = function(directory, callback) {
    fs.stat(directory, function(error) {
      if(error && error.code === 'ENOENT') {
        fs.mkdir(directory, callback)
      } else {
        callback(error);
      }
    });
  };

  var scrape = function(url, body) {
    var $ = cheerio.load(body);
    var data = {
      'Title': $(body).find('div.shirt-details h1').text().slice(4),
      'Price': $(body).find('div.shirt-details span.price').text(),
      'ImageURL': $(body).find('div.shirt-picture img').attr('src'),
      'URL': url,
      'Time': new Date().toString()
    };
    dataArray.push(data);
  };

  request(url, function (error, response, body) {
    if(error) {
        console.error(error.message);
    } else {
      var $ = cheerio.load(body);
      var href = $('li.shirts a').attr('href');
      var nextUrl = url + href;
      request(nextUrl, function (error, response, body) {
        if(error) {
          console.error(error.message);
        } else {
          var $ = cheerio.load(body);
          var products = 'ul.products a';
          $(products).each(function() {
            var href = $(this).attr('href');
            var finalUrl = url + href;
            request(finalUrl, function(error, response, body) {
              if(error) {
                console.error(error.message);
              } else {
                scrape(finalUrl, body);
                if(dataArray.length === (products.length - 5)) {
                  makeDir('./data/', function(error){
                    if(error) {
                      console.error(error.message);
                    } else {
                      csv(dataArray,{'header': true}, function(error,csvString) {
                        if(error) {
                          console.error(error.message);
                        } else {
                          fs.writeFile('./data/' + dateGetter() + '.csv', csvString, function(error) {
                            if(error) {
                              console.error(error.message);
                            }
                          });
                        }
                      });
                    }
                  });
                }
              }
            });
          });
        }
      });
    }
  });

// The end
})();
