# replace-in-js

[Source Map v3] aware replace for JS files. Dedicated for quick adjustments of values inside bundles or compile-time function execution (especially translation inlining).

Works in _O(n)_ (where _n_ is source file size).

## API

```js
const replace = require('replace-in-js');

replace(/foo/g, 'bar', options);
```

First two arguments mimic [String.prototype.replace] behavior.

`options` allow you to specify in and out file (work in progress, see [example](./example.js) for currently working version).

## Use-cases

The main motivation is inlining translations in the bundles, so replacing `const copy = t('button_cta');` with `const copy = 'Click me!'`.

Using AST based tools is super slow on big files, and to out knowledge there is no source-map aware replace implementation.

## Previous work
* [nsams/sourcemap-aware-replace](https://github.com/nsams/sourcemap-aware-replace) - supports only string → string replacement, _O(n²)_

## License
MIT

<!-- links -->

[string.prototype.replace]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
[source map v3]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k
