Neutrino Metrics client library
=========

For use by electron applications to feed analytics data to [Neutrino Metrics](https://neutrinometrics.net).

## Installing

Using npm:

```bash
$ npm install neutrino-metrics --save
```


## Usage
In your index.html (or entry js file in renderer process), add the following script:  

```html
<script>
     const neutrino = require('neutrino-metrics');
     neutrino.init("<YOUR APP ID>");
</script>
```
**NOTE***: renderer process runs your "web page" code. Check out the electron docs [Renderer Process](http://electron.atom.io/docs/tutorial/quick-start/#renderer-process) for more info.


#### Custom Events
After initializing **neutrino** instance, you can send your own custom events:
```javascript
neutrino.event("CLICKED_RED_BUTTON");
```

## Support
You can email the team at Neutrino for support at [info@neutrinometrics.net](mailto:info@neutrinometrics.net)