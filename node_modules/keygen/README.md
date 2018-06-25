# Keygen

> A set of functions for url-friendly, random, unique key/token generation

## Getting Started

Install Keygen:

```shell
npm install keygen --save
```

## Overview

Keygen can be used to generate url-friendly or hexadecimal keys.  The url-friendly variety should be favored where possible since they can represent a significantly larger keyspace with shorter keys.

## Examples

### URL Friendly Keys:

```js
var keygen = require('keygen');

// generate a small url-friendly key
keygen.url(keygen.small);  //-> 'u3WZbDyN57J'

// generate a medium url-friendly key
keygen.url(keygen.medium);  //-> '5yQZwZsLCaW9W3kmKxx7Ac'

// generate a default-sized (medium) key
keygen.url();  //-> '4wUtvcP5izgTRwV7GPZp9f'

// generate a large url-friendly key
keygen.url(keygen.large);  //-> 'zj6BYUikZeDFwrj8yn9xRdFVXQbKPTQWDs8fqq9fRkqj'

// generate a huge url-friendly key via a custom length
keygen.url(89);  //-> '7BrhcHQb47GUeJBXA5kksScVbihrQikB4Nf9KX8sA8xRmkhf7ysrtUvhFPa9cNhvdyKiLpjC5jq2b73tTJSEPnXm7'
```

### Hexadecimal Keys:

```js
var keygen = require('keygen');

// generate a small hex key
keygen.hex(keygen.small);  //-> 'e9732d18888'

// generate a medium hex key
keygen.hex(keygen.medium);  //-> '910886cd435e93eef7e22e'
// or
keygen.hex();  //-> '8f07d173de8786d5488e3e'

// generate a large hex key
keygen.hex(keygen.large);  //-> '9c90543d255fe6f71a593f807034b5e123f26081ca73'

// generate a huge hex key via a custom length
keygen.hex(179);  //-> '39e122ca2b33ba9471d36463d1a01664ad654c77f82da653dca42590ecbf61794ebe25ac6952bfb325caa2c50bd59bd842922be8976035fbcdc8ac1afcee6d02a979e809e459a653167c7fef452b3e16b8f05b9d23edb895680'
```

### Asynchronous Key Generation:
Cryptographically random key generation may result in minimal blocking for sufficient entropy. For this reason, all the synchronous examples listed above have asynchronous counterparts.

```js
var keygen = require('keygen');

// generate a medium url-friendly key asynchronously
keygen.url(keygen.medium, function(key) {
  console.log(key);  //-> '5yQZwZsLCaW9W3kmKxx7Ac'
}); //-> undefined

// generate a default-sized (medium) hexadecimal key asynchronously
keygen.hex(function(key) {
  console.log(key);  //-> '8f07d173de8786d5488e3e'
}); //-> undefined
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Release History
_(Nothing yet)_
