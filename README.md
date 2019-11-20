# Whatsapp Bulk Sender
[![dependencies Status](https://david-dm.org/tmilar/whatsapp-bulk-send/status.svg)](https://david-dm.org/tmilar/whatsapp-bulk-send)
[![devDependencies Status](https://david-dm.org/tmilar/whatsapp-bulk-send/dev-status.svg)](https://david-dm.org/tmilar/whatsapp-bulk-send?type=dev)


Chrome extension built with React 16+ and Webpack 4+

Open the extension in a new tab, load your whatsapp messages to be sent, and wait for the job to be completed.


## Installing and Running


1. Ensure [Node.js](https://nodejs.org/) version is >= 8.
2. Run `npm install` to install the dependencies.
3. Run `npm start`, this will create a `build` folder
4. Load the extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.

## Structure

All the extension's code is placed in the `src` folder.

### Webpack auto-reload and HRM

To make the workflow much more efficient this project uses the [webpack server](https://webpack.github.io/docs/webpack-dev-server.html) for development (started with `npm start`) with auto reload feature that reloads the browser extension automatically every time that we save some file in the editor.

To run the dev mode on other port, just specify the env var `port` like this:

```
$ PORT=6002 npm run start
```

### Content Scripts

Although this project uses the webpack dev server, it's also prepared to write all the bundles files on the disk at every code change. 
So we can point, on the extension manifest, to the bundles that we want to use as [content scripts](https://developer.chrome.com/extensions/content_scripts), but we need to exclude these entry points from hot reloading [(why?)](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate/issues/4#issuecomment-261788690). To do so we need to expose which entry points are content scripts on the `webpack.config.js` using the `chromeExtensionCustomOpts -> notHotReload` config.

For example, if we want to use the `myContentScript` entry point as content script, we will configure the entry point and exclude it from hot reloading, like this:

on `webpack.config.js`:

```js
{
  …
  entry: {
    myContentScript: "./src/js/myContentScript.js"
  },
  chromeExtensionCustomOpts: {
    notHotReload: ["myContentScript"]
  }
  …
}
```

and on `src/manifest.json`:

```json
{
  "content_scripts": [
    {
      "matches": ["https://www.google.com/*"],
      "js": ["myContentScript.bundle.js"]
    }
  ]
}
```

## Deploying

After the development of the extension, run the command

```
$ NODE_ENV=production npm run build
```

Now, the content of `build` folder will be the extension ready to be submitted to the Chrome Web Store. Just take a look at the [official guide](https://developer.chrome.com/webstore/publish) to more infos about publishing.

## Secrets

Just import the file `./secrets.<THE-NODE_ENV>.js` on the modules through the module named as `secrets`, so we can do things like this:

_./secrets.development.js_

```js
export default { key: '123' };
```

_./src/popup.js_

```js
import secrets from 'secrets';
ApiCall({ key: secrets.key });
```

:point_right: The files with name `secrets.*.js` already are ignored on the repository.

## Resources:

- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)
- [Chrome Extension Webpack Boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate)

---

## Credits

- Michael Xieyang Liu | [Website](https://lxieyang.github.io) - for providing the boilerplate this project started off
