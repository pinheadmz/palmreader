'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');

class Names extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Names (N)'
    });
    this.sort = blessed.checkbox({
      parent: this.widget,
      text: 'Sort by state',
      mouse: true,
      keys: true,
      interactive: true,
      top: 1,
      left: 1
    });
    this.owned = blessed.checkbox({
      parent: this.widget,
      text: 'Owned',
      mouse: true,
      keys: true,
      interactive: true,
      top: 1,
      left: 22
    });
    this.expiring = blessed.checkbox({
      parent: this.widget,
      text: 'Expire <100 days',
      mouse: true,
      keys: true,
      interactive: true,
      top: 1,
      left: 36
    });
    this.table = contrib.table({
      parent: this.widget,
      scrollable: true,
      mouse: true,
      keys: true,
      interactive: true,
      top: 3,
      columnSpacing: 1,
      columnWidth: [10, 70]
    });
  }

  refresh() {
    this.state.names.sort((a, b) => {
      if (!this.sort.checked || a.state === b.state)
        return a.name < b.name ? -1 : 1;

      return a.state < b.state ? -1 : 1;
    });

    const data =[];
    for (const ns of this.state.names) {
      if (this.owned.checked && !ns.own)
        continue;
      if (   this.expiring.checked
          && ns.stats
          && ns.stats.daysUntilExpire
          && ns.stats.daysUntilExpire >= 100)
        continue;

      data.push([
        ns.state,
        ns.name
      ]);
    }
    this.table.setData({
      headers: [' State', ` Name (${data.length})`],
      data
    });
  }

  initWallet() {
    // Rows in table are clickable, choose name
    this.table.rows.on('select', async (node) => {
      // Text in rows are padded with tons of spaces for visual layout
      const words = node.content.trim().split(' ');
      const name = words[words.length - 1];
      await this.app.selectName(name);
    });

    this.bindChildren();
  }
}

module.exports = Names;
