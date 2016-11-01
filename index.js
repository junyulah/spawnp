'use strict';

let {
    spawn
} = require('child_process');

let {
    map, reduce
} = require('bolzano');

let {
    isString, likeArray
} = require('basetype');

let spawnp = (command, args, options, extra = {}) => {
    args = args || [];

    if (isString(command)) {
        return spawnCmd(command, args, options, extra);
    } else if (likeArray(command)) {
        if (command.type === 'pipe') {
            return spawnPipeLine(command, args, options, extra);
        } else {
            if (!command.length) return Promise.resolve([]);
            let cmd = command.shift();
            // run commands one by one
            return spawnp(cmd, args, options, extra).then((cmdRet) => {
                return spawnp(command, args, options, extra).then((rests) => {
                    return [cmdRet].concat(rests);
                });
            });
        }
    } else {
        return Promise.reject(new Error(`unexpected command ${command}`));
    }
};

let spawnPipeLine = (command, args, options, extra) => {
    return new Promise((resolve, reject) => {
        let lastChild = reduce(command, (prev, item) => {
            let child = spawnChild(item, args, options);
            if (prev) {
                // pipe stdout
                prev.stdout.pipe(child.stdin);
            }

            resolveChild(child, extra, command, args).catch(reject);
            return child;
        }, null);
        if (!lastChild) resolve({
            stdouts: [],
            stderrs: []
        });

        resolveChild(lastChild, extra, command, args).then(resolve).catch(reject);
    });
};

let spawnCmd = (commandStr, args, options, extra) => {
    return resolveChild(spawnChild(commandStr, args, options), extra, commandStr, args);
};

let spawnChild = (commandStr, args, options) => {
    let command = parseCommand(commandStr);
    args = parseArgs(commandStr, args);

    return spawn(command, args, options || undefined);
};

let parseArgs = (commandStr, args) => {
    let parts = commandStr.trim().split(' ');
    parts.shift();
    // merge args from command
    return parts.concat(args);
};

let parseCommand = (commandStr) => {
    let parts = commandStr.trim().split(' ');
    return parts[0];
};

let resolveChild = (child, extra, command, args) => {
    if (extra.onChild) {
        extra.onChild(child);
    }

    let stdouts = [];
    let stderrs = [];

    if (extra.stdout && child.stdout) {
        child.stdout.on('data', (chunk) => {
            stdouts.push(chunk);
        });
    }

    if (extra.stderr && child.stderr) {
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
                err.command = command;
                err.commandArgs = args;
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

spawnp.exec = (command, args, options, extra = {}) => {
    extra.stdout = true;
    return spawnp(command, args, options, extra).then(joinItem);
};

let joinItem = (ret) => {
    if (likeArray(ret)) {
        return map(ret, joinItem);
    } else {
        return ret.stdouts.join('');
    }
};

spawnp.pass = (command, args, options, extra = {}) => {
    return spawnp(command, args, options, extra).then(() => {
        return true;
    }).catch((err) => {
        if (err.code) {
            return false;
        } else {
            throw err;
        }
    });
};

spawnp.pipeLine = (commands = []) => {
    if (isString(commands))
        commands = [commands];
    commands = commands.slice(0);
    commands.type = 'pipe';
    return commands;
};

module.exports = spawnp;
