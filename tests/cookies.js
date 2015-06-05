// var phantom = require('phantom');

// phantom.create(function(ph) {
//     ph.createPage(function(page) {
//         page.open("https://mail.google.com", function(status) {
//             console.log("opened google? ", status);
//             // console.log(page.injectJs);
//             // console.log(page.evaluateJavaScript);
//             page.get('cookies', function(data) {
//                 console.log('data', data);
//             })
//             page.evaluate(function() {
//                 return document.title;
//             }, function(result) {
//                 console.log('Page title is ' + result);
//                 ph.exit();
//             });
//         });
//     });
// });

var phantom = require('node-phantom-simple');

phantom.create(function(err, ph) {
    return ph.createPage(function(err, page) {
        return page.open("http://mail.yahoo.com", function(err, status) {
            console.log("opened site? ", status);
            page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function(err) {
                //jQuery Loaded.
                //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
                setTimeout(function() {
                    return page.evaluate(function() {
                        //Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
                        var h2Arr = [],
                            pArr = [];
                        $('h2').each(function() {
                            h2Arr.push($(this).html());
                        });
                        $('p').each(function() {
                            pArr.push($(this).html());
                        });

                        return {
                            h2: h2Arr,
                            p: pArr
                        };
                    }, function(err, result) {
                        console.log(result);
                        ph.exit();
                    });
                }, 5000);
            });
        });
    });
});
