'use strict';
var blessed = require('blessed')
  , Node = blessed.Node
  , Box = blessed.Box;


const stripAnsi = function (str) {
  return typeof str === 'string' ? str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, '') : str;
};

function Table(options) {

  var self = this;

  if (!(this instanceof Node)) {
    return new Table(options);
  }

  if (Array.isArray(options.columnSpacing)) {
    throw 'Error: columnSpacing cannot be an array.\r\n' +
           'Note: From release 2.0.0 use property columnWidth instead of columnSpacing.\r\n' +
           'Please refere to the README or to https://github.com/yaronn/blessed-contrib/issues/39';
  }

  if (!options.columnWidth) {
    throw 'Error: A table must get columnWidth as a property. Please refer to the README.';
  }

  options = options || {};
  options.columnSpacing = options.columnSpacing==null? 10 : options.columnSpacing;
  options.bold = true;
  options.selectedFg = options.selectedFg || 'white';
  options.selectedBg = options.selectedBg || 'blue';
  options.fg = options.fg || 'green';
  options.bg = options.bg || '';
  options.interactive = (typeof options.interactive === 'undefined') ? true : options.interactive;
  options.headers = options.headers===false ? false : true;
  this.options = options;
  Box.call(this, options);

  this.rows = blessed.list({
    //height: 0,
    top: options.headers ? 2 : 0,
    width: 0,
    left: 1,
    style: { selected: {
      fg: options.selectedFg
      , bg: options.selectedBg
    }
    , item: {
      fg: options.fg
      , bg: options.bg
    }},
    keys: options.keys,
    vi: options.vi,
    mouse: options.mouse,
    tags: true,
    interactive: options.interactive,
    screen: this.screen
  });

  this.append(this.rows);

  this.on('attach', function() {
    if (self.options.data) {
      self.setData(self.options.data);
    }
  });

}

Table.prototype = Object.create(Box.prototype);

Table.prototype.focus = function(){
  this.rows.focus();
};

Table.prototype.render = function() {

  this.rows.width = this.width-3;
  this.rows.height = this.height-2;

  if (this.style.border && this.options.headers)
    this.rows.height -= 2;

  // if (this.options.headers)
  //   this.rows.height -= 2;

  Box.prototype.render.call(this);
  if(this.screen.focused == this.rows)
    this.rows.focus();
};


Table.prototype.setData = function(table) {
  var self = this;

  var dataToString = function(d) {
    var str = '';
    d.forEach(function(r, i) {
      var colsize = self.options.columnWidth[i]
        , strip = stripAnsi(r.toString())
        , ansiLen = r.toString().length - strip.length
        , spaceLength = colsize - strip.length + self.options.columnSpacing;
      r = r.toString().substring(0, colsize + ansiLen); //compensate for ansi len
      if (spaceLength < 0) {
        spaceLength = 0;
      }
      var spaces = new Array(spaceLength).join(' ');
      str += r + spaces;
    });
    return str;
  };

  var formatted = [];

  table.data.forEach(function(d) {
    var str = dataToString(d);
    formatted.push(str);
  });
  if (this.options.headers) { this.setContent(dataToString(table.headers)) };
  this.rows.setItems(formatted);
};

Table.prototype.getOptionsPrototype = function() {
  return  { keys: true
    , fg: 'white'
    , interactive: false
    , label: 'Active Processes'
    , width: '30%'
    , height: '30%'
    , border: {type: 'line', fg: 'cyan'}
    , columnSpacing: 10
    , columnWidth: [16, 12]
    , data: { headers: ['col1', 'col2']
      , data: [ ['a', 'b']
        , ['5', 'u']
        , ['x', '16.1'] ]}
  };
};

Table.prototype.type = 'table';

module.exports = Table;
