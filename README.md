# WrathJs - Simplified PhantomJs for node

WrathJs is a phantomjs bridge for node with simplified api for easy testing. It injects jQuery by default. Did I mention it uses promises? It does ^^

WrathJs is a wrapper for node-phantom-simple.

```
npm install --save wrathjs
```

## API

```
page.open(url) -> Promise(status)

page.get(name) -> Promise(result)

page.set(name, value) -> Promise(null)

page.evaluate(fn, ...args) -> Promise(result)
// fn to be run in phantomjs context

page.click(selector) -> null
page.focus(selector) -> null
page.type(selector, text, delay) -> null
// delay between writing letters {default: 80}

page.render(file, selector = null) -> Promise(null)
// Renders full page without selector

page.waitClick(selector = null) -> Promise(null)
// Clicks on selector if it gets one
// Then waits for the new page to load

page.wait() -> Promise(null)

page.close() -> null
```

## Examples
You can find more examples in tests folder

```
var wrath = new Wrathjs();
page = wrath.create();

page.open('http://www.google.com').then(function () {
    this.type('[name=q]', 'valoare');
    this.click('[name=btnI]');

    return this.waitClick();
}).then(function() {
    // console.log('Page title is', result);

    return this.render('poza.jpg');
}).catch(function(err) {
    console.log(err.stack);
}).finally(function() {
    console.log('exit');
    wrath.exit();
});

```