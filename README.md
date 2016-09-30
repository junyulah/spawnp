# spawnp

node spawn but return promise.

[![Build Status](https://travis-ci.org/LoveKino/spawnp.svg)](https://travis-ci.org/LoveKino/spawnp.svg)

[![Coverage Status](https://coveralls.io/repos/github/LoveKino/spawnp/badge.svg?branch=master)](https://coveralls.io/github/LoveKino/spawnp?branch=master)

## install

`npm i spawnp --save`

## example

```js
let spawnp = require('spawnp');

spawnp('echo', ['123']).then(() => {
    // finshed
}).catch(() => {
    // erorred
});
```

## api

`spawnp(command[, args][, options][, extra])`

- command

Just like spawn's command, but support arg in command, like `echo 123`

```js
spawnp('echo 123', ['456']); // 123 456\n
```

- args

Just like spawn's args

- options

Just like spawn's options

- extra

Object, {onChild, stdout, stderr}, see next.

## onChild

```js
spawnp('echo', ['123'], null, {
    onChild: (child) => {
        child.stdout.on('data', (chunk) => {
            console.log(chunk.toString()); //123\n
        });
    };
}); // return a promise
```

## stdout

```js
spawnp('echo', ['123'], null, {
    stdout: true // config stdout option
}).then(({
    stdouts // then will get stdout chunks
}) => {
    console.log(stdouts.join('')); //'123\n';
});
```

## stderr

```js
spawnp('ls', ['oooooooooo'], null, {
    stderr: true
}).catch(({
    stderrs
}) => {
    console.log(stderrs.join(''));
});
```
