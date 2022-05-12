'use strict';

const cp = require('child_process');
const blessed = require('blessed');

// NodeJS plugins that require their host package are funny things,
// especially when a dependency isn't in a folder called node_modules.
// HSD WHERE ARE YOU?
try {
  // Are you installed globally like npm install -g ?
  exports.hsd = require('hsd');
} catch (e) {
  try {
    // Are you the host package? If Palm Reader was installed
    // as described in the README, you're here.
    exports.hsd = require('../../../lib/hsd');
  } catch(e) {
    // Ok, maybe you are a sibling package.
    // I like to have all my git repositories in a work/ directory,
    // maybe hsd and Palm Reader are next-door neighbors.
    exports.hsd = require('../../hsd/lib/hsd');
  }
}

// From bcoin-org/bterm/lib/utils/common.js
exports.copy = (text, callback) => {
  callback = callback || function() {};

  const exec = (args, cb) => {
    const file = args.shift();
    const ps = cp.spawn(file, args, {
      stdio: ['pipe', 'ignore', 'ignore']
    });
    ps.stdin.on('error', cb);
    ps.on('error', cb);
    ps.on('exit', (code) => {
      return cb(code !== 0 ? new Error('Exit code: ' + code) : null);
    });
    ps.stdin.end(String(text));
  };

  // X11:
  return exec(['xsel', '-i', '-p'], (err) => {
    if (!err)
      return callback(null);
    return exec(['xclip', '-i', '-selection', 'primary'], (err) => {
      if (!err)
        return callback(null);
      // Mac:
      return exec(['pbcopy'], (err) => {
        if (!err)
          return callback(null);
        return callback(new Error('Failed to set clipboard contents.'));
      });
    });
  });
};

// Helper to add horizontally-labeled text input to form
exports.addInputH = (parent, label, name, options) => {
  // Label
  const labelBox = blessed.text({
    parent,
    content: label,
    left: 1,
    ...options,
    width: null
  });
  // Actual input field
  const input = blessed.textbox({
    parent,
    name,
    inputOnFocus: true,
    mouse: true,
    right: 1,
    height: 1,
    style: {
      bg: 'blue'
    },
    ...options,
    left: 1 + labelBox.left + label.length
  });
  input.labelBox = labelBox;
  return input;
};

// Helper to add vertically-labeled text area to form
exports.addInputV = (parent, label, name, options) => {
  // Label
  blessed.text({
    parent,
    content: label,
    left: 1,
    ...options,
    width: null,
    height: 1
  });
  // Actual input field
  let input;
  if (options.height && options.height === 1) {
    input = blessed.textbox({
      parent,
      name,
      inputOnFocus: true,
      mouse: true,
      left: 1,
      right: 1,
      style: {
        bg: 'blue'
      },
      ...options
    });
  } else {
    input = blessed.textarea({
      parent,
      name,
      inputOnFocus: true,
      mouse: true,
      left: 1,
      right: 1,
      style: {
        bg: 'blue'
      },
      ...options
    });
  }
  input.top += 0; // "HUH?!"
  return input;
};

// Helper to add floating button to form
exports.addButton = (parent, label, options) => {
  return blessed.button({
    parent,
    content: label,
    keys: true,
    mouse: true,
    padding: 1,
    shrink: true,
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
    ...options
  });
};

// Display subunits integer as human readable HNS with 6 decimals
exports.doosToHNS = (doos) => {
  const string = exports.hsd.Amount.fromBase(doos).toString();
  const words = string.split('.');
  words[1] = words[1].padEnd(6, '0');
  return words.join('.');
};

// ...and the reverse
exports.HNStoDoos = (HNS) => {
  return exports.hsd.Amount.fromCoins(HNS).toValue();
};
