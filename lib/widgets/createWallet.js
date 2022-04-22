'use strict';

const blessed = require('blessed');
const AbstractWidget = require('./abstract');
const {addInputH, addInputV, addButton} = require('../util');

class CreateWallet extends AbstractWidget {
  constructor(options) {
    super(options);

    this.set(this.coords, blessed.form, {
      label: 'Create Wallet (C)'
    });
    let top = 0;
    addInputH(
      this.widget,
      'Wallet name:',
      'id',
      {
        top: top++
      }
    );
    addInputH(
      this.widget,
      ' Passphrase:',
      'passphrase',
      {
        top: top++,
        censor: true
      }
    );
    this.m = addInputH(
      this.widget,
      '          M:',
      'm',
      {
        top: top++,
        width: 3,
        value: '1',
        resetValue: '1'
      }
    );
    this.n = addInputH(
      this.widget,
      '          N:',
      'n',
      {
        top: top++,
        width: 3,
        value: '1',
        resetValue: '1'
      }
    );
    addInputV(
      this.widget,
      'Import seed phrase:',
      'mnemonic',
      {
        top,
        right: 16,
        bottom: 0
      }
    );
    addButton(
      this.widget,
      'Create',
      {
        bottom: 0,
        right: 1
      }
    ).on('press', async () => {
      return this.createWallet();
    });
  }

  async createWallet() {
    try {
      const {
        id,
        passphrase,
        mnemonic,
        m,
        n
      } = this.widget.submit();

      if (!id)
        throw new Error('New wallet needs a name');

      await this.app.wdb.create({
        id,
        passphrase,
        mnemonic,
        m: parseInt(m),
        n: parseInt(n)
      });
      // This method clears all inputs
      this.widget.reset();
      // ...put back default values
      this.m.value = '1';
      this.n.value = '1';
      await this.app.loadWallet();
    } catch (e) {
      this.app.log(e.message);
    }
  }

  initWallet() {
    this.bindChildren();
  }
}

module.exports = CreateWallet;
