'use strict';

let spawnp = require('..');
let assert = require('assert');

describe('index', () => {
    it('base', () => {
        return spawnp('ls');
    });

    it('fail exec', (done) => {
        spawnp('bad cmmand').catch(err => {
            assert.equal(err.type, 'bad_command');
            done();
        });
    });

    it('error code', (done) => {
        spawnp('ls', ['ooooooooooooooooooooo']).catch(err => {
            assert.equal(err.type, 'error_exist');
            done();
        });
    });

    it('onChild', () => {
        return spawnp('echo', ['123'], null, {
            onChild: (child) => {
                child.stdout.on('data', (chunk) => {
                    assert.equal(chunk.toString(), '123\n');
                });
            }
        });
    });

    it('stdout', () => {
        return spawnp('echo', ['123'], null, {
            stdout: true
        }).then(({
            stdouts
        }) => {
            assert.equal(stdouts.join(''), '123\n');
        });
    });

    it('stderr', () => {
        return spawnp('ls', ['oooooooooo'], null, {
            stderr: true
        }).catch(({
            stderrs
        }) => {
            assert.equal(stderrs.join('').indexOf('No such file') !== -1, true);
        });
    });

    it('expand command', () => {
        return spawnp('echo 123', ['456'], null, {
            stdout: true
        }).then(({
            stdouts
        }) => {
            assert.equal(stdouts.join(''), '123 456\n');
        });
    });
});
