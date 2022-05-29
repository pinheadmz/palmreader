'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const pkg = require('../../package.json');

class Meta extends AbstractWidget {
  constructor(options) {
    super(options);

    this.timeout = null;

    // This is a fucked up hack to mitigate some kind of bug in blessed
    // where the text in this.current keeps sliding to the left leaving
    // behind the last character in the string it should be replacing,
    // but only the very first time it renders -- HUH ?!
    this.rendered = false;

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
      left: 1,
      content: `Palm Reader 🤝 v${pkg.version}`,
      hoverText: '(c) 2022 Matthew Zipkin\nhttps://github.com/pinheadmz/palmreader\nLove and be excellent to each other ❤️',
      style: {
        bold: true,
        fg: 'yellow'
      }
    });
    blessed.text({
      parent: this.widget,
      left: '20%',
      content: ' Press (H) for help ',
      style: {
        bg: 'cyan',
        fg: 'black'
      }
    }).on('click', () => {
      return this.app.showHelp();
    });
    this.nav = blessed.box({
      parent: this.widget,
      left: 'center',
      width: 30
    });
      blessed.text({
        parent: this.nav,
        left: 0,
        content: '<<<',
        style: {
          bold: true,
          bg: 'blue',
          fg: 'white'
        }
      }).on('click', () => {
        return this.app.prevPage();
      });
      blessed.text({
        parent: this.nav,
        right: 0,
        content: '>>>',
        style: {
          bold: true,
          bg: 'blue',
          fg: 'white'
        }
      }).on('click', () => {
        return this.app.nextPage();
      });
      this.current = blessed.text({
        parent: this.nav,
        left: 'center',
        style: {
          bold: true
        }
      });
    this.message = blessed.text({
      parent: this.widget,
      right: 1,
      style: {
        bold: true,
        fg: 'red'
      }
    });

    this.refresh();
  }

  refresh() {
    if (!this.rendered) {
      // Don't update text on first refresh()
      this.rendered = true;
    } else {
      this.current.content = this.app.pages[this.app.currentPage].title;
    }
  }

  log(msg) {
    if (this.timeout)
      clearTimeout(this.timeout);

    // this.message.content = ' '.repeat(80);
    this.message.content = msg;

    this.timeout = setTimeout(
      () => {
        this.message.content = ' ';
        this.timeout = null;
      },
      3000
    );
  }
}

module.exports = Meta;
