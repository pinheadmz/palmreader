'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const pkg = require('../../package.json');

class Meta extends AbstractWidget {
  constructor(options) {
    super(options);

    this.timeout = null;

    // Meta widget is NOT in a grid and so we never call this.set()
    this.widget = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      height: 1
    });
    this.title = blessed.text({
      parent: this.widget,
      left: 'center',
      content: `Palm Reader 🤝 v${pkg.version}`,
      hoverText: '(c) 2022 Matthew Zipkin\nhttps://github.com/pinheadmz/palmreader\nLove and be excellent to each other ❤️',
      style: {
        bold: true,
        fg: 'yellow'
      }
    });
    this.message = blessed.text({
      parent: this.widget,
      right: 1,
      width: 80,
      style: {
        bold: true,
        fg: 'red'
      }
    });
    blessed.text({
      parent: this.widget,
      left: 1,
      content: '[Press (H) for help or click here]',
      style: {
        bg: 'cyan',
        fg: 'black'
      }
    }).on('click', () => {
      return this.app.showHelp();
    });

    this.refresh();
  }

  refresh() {
    // TODO update with page number, maybe current wallet / account
  }

  log(msg) {
    if (this.timeout)
      clearTimeout(this.timeout);

    this.message.content = ' '.repeat(80);
    this.message.content = msg.padStart(80, ' ');

    this.timeout = setTimeout(
      () => {
        this.message.content = ' '.repeat(80);
        this.timeout = null;
      },
      3000
    );
  }
}

module.exports = Meta;
