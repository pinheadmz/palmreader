'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');
const {addInputH, addButton, HNStoDoos, doosToHNS} = require('../util');

class Actions extends AbstractWidget {
  constructor(options) {
    super(options);

    this.action1 = null;
    this.action2 = null;

    this.set(this.coords, blessed.form, {
      label: 'Actions (X)'
    });
    this.inputName = addInputH(
      this.widget,
      'Name:',
      'name',
      {
        top: 1,
        left: 1,
        right: 1
      }
    );
    this.inputName.key(['enter'], async () => {
      try {
        await this.app.selectName(this.inputName.value);
      } catch (e) {
        this.app.log(e.message);
      }
    });
    this.stats = contrib.table({
      parent: this.widget,
      columnSpacing: 1,
      columnWidth: [30, 50],
      top: 3,
      left: 1,
      right: 1,
      height: 10,
      border: {
        type: 'line',
        fg: 'green'
      },
      selectedBg: 'default',
      selectedFg: 'green'
    });
    this.history = contrib.table({
      parent: this.widget,
      columnSpacing: 1,
      columnWidth: [16, 16, 16, 8],
      interactive: true,
      mouse: true,
      keys: true,
      top: 13,
      left: 1,
      right: 1,
      bottom: 5,
      border: {
        type: 'line',
        fg: 'green'
      },
      selectedBg: 'default',
      selectedFg: 'green'
    });
    this.input1 = addInputH(
      this.widget,
      '             ',
      'input1',
      {
        bottom: 3,
        width: 32,
        hidden: true
      }
    );
    this.input2 = addInputH(
      this.widget,
      '             ',
      'input2',
      {
        bottom: 1,
        width: 32,
        hidden: true
      }
    );
    this.button1 = addButton(
      this.widget,
      '',
      {
        bottom: 1,
        right: 1,
        hidden: true
      }
    );
    this.button1.on('press', async () => {
      if (this.action1)
        this.action1();
    });
    this.button2 = addButton(
      this.widget,
      '',
      {
        bottom: 1,
        left: 1,
        hidden: true
      }
    );
    this.button2.on('press', async () => {
      if (this.action2)
        this.action2();
    });
  }

  refresh() {
    const ns = this.state.selectedNameState;

    this.hide(false);

    if (!ns) {
      this.stats.setData({
        headers: ['',''],
        data: [['', '']]
      });
      this.history.setData({
        headers: ['', '', ''],
        data: [['', '', '']]
      });
      return;
    }

    // Name stats
    {
      const data = [
        ['Reserved', ns.reserved ? 'yes' : 'no'],
        ['Expired', ns.expired ? 'yes' : 'no']
      ];
      for (const stat of Object.keys(ns.stats)) {
        const value = ns.stats[stat];
        let key = stat.replace(/([A-Z])/g, ' ' + '$1');
        key = key[0].toUpperCase() + key.slice(1).toLowerCase();
        data.push([key, String(value)]);
      }

      this.stats.setData({
        headers: [
          `State: ${ns.state}`,
          `In wallet: ${ns.inWallet ? 'yes' : 'no'}     ` +
          `Owned: ${ns.own ? 'yes' : 'no'}`
        ],
        data
      });
    }

    // Bids and reveals history
    let ownedBids = 0;
    let ownedReveals = 0;
    let needsRedeem = false;
    {
      const data = [];
      if (ns.bids) {
        for (const bid of ns.bids) {
          if (bid.own)
            ownedBids++;

          let bidValue = '';
          let revealValue = '';
          if (bid.value >= 0) {
            // Our own bid
            bidValue = doosToHNS(bid.value);
          }

          // Have we revealed?
          if (ns.reveals) {
            for (const reveal of ns.reveals) {
              if (!reveal.bid || !reveal.own)
                continue;

              if (   reveal.bid.hash.equals(bid.prevout.hash)
                  && reveal.bid.index === bid.prevout.index) {
                revealValue = doosToHNS(reveal.value);
                break;
              }
            }
          }

          data.push([
            bidValue.padStart(12, ' '),
            revealValue.padStart(12, ' '),
            bid.lockup >= 0 ? doosToHNS(bid.lockup).padStart(12, ' ') : '?',
            bid.own ? 'yes' : ''
          ]);
        }
      }
      if (ns.reveals) {
        for (const reveal of ns.reveals) {
          if (reveal.own) {
            ownedReveals++;

            // Losing reveal needs redeem
            if (reveal.unspent
                && (   reveal.prevout.hash.toString('hex') !== ns.owner.hash
                    || reveal.prevout.index !== ns.owner.index))
              needsRedeem = true;

            // Our own reveal values are already linked with the bids
            continue;
          }
          data.push([
            '',
            doosToHNS(reveal.value).padStart(12, ' '),
            '',
            ''
          ]);
        }
      }
      this.history.setData({
        headers: ['Bid', 'Reveal', 'Lockup', 'Mine'],
        data
      });
    }

    // Display controls based on name state
    if ((ns.state === 'NONE' && !ns.reserved) || ns.expired) {
      this.action1 = this.makeOpen;
      this.button1.content = 'OPEN';
      this.button1.hidden = false;
      return;
    }
    switch (ns.state) {
      case 'OPENING':
        return;
      case 'BIDDING':
        this.action1 = this.makeBid;
        this.input1.hidden = false;
        this.input1.labelBox.hidden = false;
        this.input1.labelBox.content = 'Bid value:';
        this.input2.hidden = false;
        this.input2.labelBox.hidden = false;
        this.input2.labelBox.content = 'Total lockup:';
        this.button1.content = 'BID';
        this.button1.hidden = false;
        return;
      case 'REVEAL':
        this.action1 = this.makeReveal;
        this.button1.content = 'REVEAL';
        if (ownedBids !== ownedReveals)
          this.button1.hidden = false;
        return;
      case 'CLOSED':
        if (ns.own) {
          this.action1 = this.createUpdate;
          this.button1.content = ns.registered ? 'UPDATE' : 'REGISTER';
          this.button1.hidden = false;
        }
        if (needsRedeem) {
          this.action2 = this.makeRedeem;
          this.button2.content = 'REDEEM';
          this.button2.hidden = false;
        }
        return;
    }

    this.hide(true);
  }

  hide(clear) {
    this.action1 = null;
    this.input1.hidden = true;
    this.input1.labelBox.hidden = true;
    this.input2.hidden = true;
    this.input2.labelBox.hidden = true;
    this.button1.hidden = true;
    this.button2.hidden = true;
    if (clear) {
      this.button1.content = '';
      this.input1.value = '';
      this.input2.value = '';
    }
  }

  async makeOpen() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const mtx = await wallet.createOpen(
        this.state.selectedName,
        false,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    }
  }

  async makeBid() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const {input1, input2} = this.widget.submit();

      const mtx = await wallet.createBid(
        this.state.selectedName,
        HNStoDoos(input1), // bid
        HNStoDoos(input2), // lockup
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    }
  }

  async makeReveal() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const mtx = await wallet.createReveal(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    }
  }

  async makeRedeem() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const mtx = await wallet.createRedeem(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    }
  }

  async createUpdate() {
    await this.app.createUpdate();
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = Actions;
