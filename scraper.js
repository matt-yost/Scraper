(function (){

  'use strict';
  // Require modules
  const fs = require('fs');

  /*------------
    cheerio

    1. Straight forward usage and set up
    2. Brings the familiarity of JQuery to node
    3. Widely used: Over 2 million downloads from NPM in the past month
    4. 80 contributors
  -------------*/
  const cheerio = require('cheerio');

  /*------------
    request

    1. Straight forward usage and set up
    2. Simple way to make HTTP & HTTPS calls, but can be expanded on for more complex task
    3. Widely used: Over 19 million downloads from NPM in the past month
    4. 268 contributors
  -------------*/
  const request = require('request');

  /*------------
    csv-stringify

    1. Straight forward usage and set up. Tried json2csv initially and found csv-stringify much easier to work with
    2. Easy to customize options for the CSV
    3. Widely used: Over 300 thousand downloads from NPM in the past month
    4. 35 contributors
  -------------*/
  const csv = require('csv-stringify');

  // Base url
  const url = "http://www.shirts4mike.com/";

  // Establish array in global scope for use in muitple functions
  var dataArray = [];

  // Function to handle any errors
  var handleError = function(error) {
    // Create time stamp
    var d = new Date();
    var message = error.message;
    // Construct error message
    var errorMessage = '[' + d + '] ' + message + '\n';
    // Append message to 'scraper-error.log' and start a new line
    fs.appendFile('scraper-error.log', errorMessage, function(error) {
      if(error) throw error;
    });
  };

  // Function that returns date in yyyy-mm-dd format
  var dateGetter = function() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth();
    var date = d.getDate();

    return y + '-' + m + '-' + date;
  };

  // Make a 'data' directory if one does not already exist
  var makeDir = function(directory, callback) {
    // Check status for error and error code matching non-existing
    fs.stat(directory, function(error) {
      if(error && error.code === 'ENOENT') {
        fs.mkdir(directory, callback);
      } else {
        callback(error);
      }
    });
  };

  // Scrape data from specified url and push data into global array
  var scrape = function(url, body) {
    var $ = cheerio.load(body);
    var data = {
      // Need to remove price from text
      'Title': $(body).find('div.shirt-details h1').text().slice(4),
      'Price': $(body).find('div.shirt-details span.price').text(),
      'ImageURL': $(body).find('div.shirt-picture img').attr('src'),
      'URL': url,
      'Time': new Date().toString()
    };
    dataArray.push(data);
  };

  // Navigate to main url
  request(url, function (error, response, body) {
    if(error) {
        handleError(error);
    } else {

      // Grab href for list of all shirts, attach it to the main URL and make another requst
      var $ = cheerio.load(body);
      var href = $('li.shirts a').attr('href');
      var nextUrl = url + href;
      request(nextUrl, function (error, response, body) {
        if(error) {
          handleError(error);
        } else {

          var $ = cheerio.load(body);
          // Define 'products' element for later use
          var products = 'ul.products a';
          // For each of the anchor elements within 'products' grab the href, and make another request
          $(products).each(function() {
            var href = $(this).attr('href');
            var finalUrl = url + href;
            request(finalUrl, function(error, response, body) {
              if(error) {
                handleError(error);
              } else {

                // Run the scrape function over each url for each indiviual shirt to get information
                scrape(finalUrl, body);

                // When the scrape is complete check to see if a directory needs to be made
                if(dataArray.length === (products.length - 5)) {
                  makeDir('./data/', function(error){
                    if(error) {
                      handleError(error);
                    } else {

                      // Data from 'dataArray' gets converted to CSV
                      csv(dataArray,{'header': true}, function(error,csvString) {
                        if(error) {
                          handleError(error);
                        } else {

                          // Create a CSV file with today's date in the correct format
                          fs.writeFile('./data/' + dateGetter() + '.csv', csvString, function(error) {
                            if(error) {
                              handleError(error);
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
