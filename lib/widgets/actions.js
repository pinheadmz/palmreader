'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const AbstractWidget = require('./abstract');
const {hsd, addInputH, addButton, HNStoDoos, doosToHNS} = require('../util');
const {Address} = hsd;

class Actions extends AbstractWidget {
  constructor(options) {
    super(options);

    this.action1 = null;
    this.action2 = null;
    this.action3 = null;
    this.action4 = null;

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
        this.app.error(e.message);
      }
    });
    this.stats = contrib.table({
      parent: this.widget,
      columnSpacing: 1,
      columnWidth: [40, 20],
      top: 3,
      left: 1,
      width: '49%',
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
      top: 3,
      left: '50%',
      right: 1,
      height: 10,
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
          left: 50,
          hidden: true
        }
      );
      this.button1.on('press', async () => {
        if (this.action1)
          this.action1();
      });
        this.button2 = addButton(
          this.widget,
          'renew',
          {
            bottom: 1,
            left: '60%',
            hidden: true
          }
        );
        this.button2.on('press', async () => {
          if (this.action2)
            this.action2();
        });
          this.button3 = addButton(
            this.widget,
            'finalize',
            {
              bottom: 1,
              left: '75%',
              hidden: true
            }
          );
          this.button3.on('press', async () => {
            if (this.action3)
              this.action3();
          });
            this.button4 = addButton(
              this.widget,
              'cancel',
              {
                bottom: 1,
                right: 1,
                hidden: true
              }
            );
            this.button4.on('press', async () => {
              if (this.action4)
                this.action4();
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
          `State: ${ns.state}`.padEnd(20, ' ') +
          `In wallet: ${ns.inWallet ? 'yes' : 'no'}     `,
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
        headers: ['  Bid', '  Reveal', '  Lockup', 'Mine'],
        data
      });
    }

    // Display controls based on name state
    if ((ns.state === 'NONE' && !ns.reserved) || ns.expired) {
      this.action4 = this.makeOpen;
      this.button4.content = 'OPEN';
      this.button4.hidden = false;
      return;
    }
    switch (ns.state) {
      case 'OPENING':
        return;
      case 'BIDDING':
        this.input1.hidden = false;
        this.input1.labelBox.hidden = false;
        this.input1.labelBox.content = 'Bid value:';

        this.input2.hidden = false;
        this.input2.labelBox.hidden = false;
        this.input2.labelBox.content = 'Total lockup:';

        this.button1.hidden = false;
        this.button1.content = 'BID';
        this.action1 = this.makeBid;
        return;
      case 'REVEAL':
        if (ownedBids !== ownedReveals) {
          this.button4.hidden = false;
          this.button4.content = 'REVEAL';
          this.action4 = this.makeReveal;
        }
        return;
      case 'CLOSED':
        if (ns.own) {
          if (!ns.registered) {
            this.button4.hidden = false;
            this.button4.content = 'REGISTER';
            this.action4 = this.makeUpdate;
          } else {
            if (ns.transfer === 0) {
              this.input1.hidden = false;
              this.input1.labelBox.hidden = false;
              this.input1.labelBox.content = 'New address:';

              this.button1.hidden = false;
              this.button1.content = 'TRANSFER';
              this.action1 = this.makeTransfer;

              this.button3.hidden = false;
              this.button3.content = 'RENEW';
              this.action3 = this.makeRenewal;

              this.button4.hidden = false;
              this.button4.content = 'UPDATE';
              this.action4 = this.makeUpdate;
            } else {
              if (   this.app.wdb.height + 1
                  >= ns.transfer + this.app.wdb.network.names.transferLockup) {
                this.input1.hidden = false;
                this.input1.labelBox.hidden = false;
                this.input1.labelBox.content = 'Payment (HNS):';

                this.input2.labelBox.hidden = false;
                this.input2.labelBox.content =
                  '(Required for atomic swap only)';

                this.button1.hidden = false;
                this.button1.content = 'FINALIZE';
                this.action1 = this.makeFinalize;
              }

              this.button3.hidden = false;
              this.button3.content = 'CANCEL';
              this.action3 = this.makeCancel;

              this.button4.hidden = false;
              this.button4.content = 'REVOKE';
              this.action4 = this.makeRevoke;
            }
          }
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
    this.action2 = null;
    this.action3 = null;
    this.action4 = null;
    this.input1.hidden = true;
    this.input1.labelBox.hidden = true;
    this.input2.hidden = true;
    this.input2.labelBox.hidden = true;
    this.button1.hidden = true;
    this.button2.hidden = true;
    this.button3.hidden = true;
    this.button4.hidden = true;
    if (clear) {
      this.button1.content = '';
      this.input1.value = '';
      this.input2.value = '';
      this.button2.content = '';
      this.button3.content = '';
      this.button4.content = '';
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
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
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
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
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
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
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
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async makeUpdate() {
    await this.app.createUpdate();
    this.hide(true);
  }

  async makeTransfer() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const {input1} = this.widget.submit();

      const mtx = await wallet.createTransfer(
        this.state.selectedName,
        Address.fromString(input1),
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async makeFinalize() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const {input1} = this.widget.submit();
      if (input1) {
        // ATOMIC SWAP
        throw new Error('Atomic swap not supported yet.');
      }

      const mtx = await wallet.createFinalize(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async makeRenewal() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;

      const mtx = await wallet.createRenewal(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async makeCancel() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;

      const mtx = await wallet.createCancel(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  async makeRevoke() {
    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;

      const mtx = await wallet.createRevoke(
        this.state.selectedName,
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
      this.hide(true);
    } catch (e) {
      this.app.error(e.message);
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = Actions;
