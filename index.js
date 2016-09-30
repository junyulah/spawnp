'use strict';

let {
    spawn
} = require('child_process');

module.exports = (command, args, options, extra = {}) => {
    args = args || [];
    let parts = command.trim().split(' ');
    command = parts.shift();
    // merge args from command
    args = parts.concat(args);

    let child = spawn(command, args, options || undefined);

    if (extra.onChild) {
        extra.onChild(child);
    }

    let stdouts = [];
    let stderrs = [];

    if (extra.stdout) {
        child.stdout.on('data', (chunk) => {
            stdouts.push(chunk);
        });
    }

    if (extra.stderr) {
        child.stderr.on('data', (chunk) => {
            stderrs.push(chunk);
        });
    }

    return new Promise((resolve, reject) => {
        child.on('error', (err) => {
            err.type = 'bad_command';
            err.stderrs = stderrs;
            reject(err);
        });
        child.on('close', (code) => {
            if (code !== 0) {
                let err = new Error(`child process exited with code ${code}`);
                err.type = 'error_exist';
                err.code = code;
                err.stderrs = stderrs;
                reject(err);
            } else {
                resolve({
                    child,
                    stdouts,
                    stderrs
                });
            }
        });
    });
};
