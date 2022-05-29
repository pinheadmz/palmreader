'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH, addButton, doosToHNS, HNStoDoos} = require('../util');

class CreateTransaction extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Transaction (T)'
    });
    let top = 0;
    addInputH(
      this.widget,
      '     Address:',
      'address',
      {
        top: top += 1
      }
    );
    addInputH(
      this.widget,
      'Amount (HNS):',
      'value',
      {
        top: top += 2
      }
    );
    this.feeRate = addInputH(
      this.widget,
      'Fee (HNS/kB):',
      'rate',
      {
        top: top += 2
      }
    );
    addButton(
      this.widget,
      'Create TX',
      {
        bottom: 1,
        right: 1
      }
    ).on('press', async () => {
      return this.createTransaction();
    });
  }

  async createTransaction() {
    try {
      const {
        address,
        value,
        rate
      } = this.widget.submit();

      const wallet = this.state.getWallet();
      if (!wallet)
        return;

      const mtx = await wallet.createTX({
        account: this.state.selectedAccount,
        rate: HNStoDoos(rate),
        paths: true,
        outputs: [{
          address,
          value: HNStoDoos(value)
        }]
      });

      await this.app.signTX(mtx);
    } catch (e) {
      this.app.log(e.message);
    } finally {
      // This method clears all inputs
      this.widget.reset();
      // ...put back default values
      this.feeRate.value = doosToHNS(this.state.feeRate);
    }
  }

  refresh() {
    this.feeRate.value = doosToHNS(this.state.feeRate);
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateTransaction;
