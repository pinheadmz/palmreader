'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const AbstractModal = require('./abstract');
const {addInputH, addButton, doosToHNS, hsd} = require('../util');
const {Script, resource} = hsd;

class SignTransaction extends AbstractModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Sign Transaction'
    });
    this.txDisplay = blessed.box({
      parent: this.widget,
      top: 1,
      left: 1,
      right: 1,
      bottom: 6,
      mouse: true,
      keys: true,
      interactive: true,
      scrollable: true
    });
      this.txDetails = contrib.table({
        parent: this.txDisplay,
        top: 0,
        columnSpacing: 1,
        columnWidth: [14, 100],
        selectedBg: 'black',
        selectedFg: 'green'
      });
      this.txInputs = contrib.table({
        parent: this.txDisplay,
        top: 6,
        columnSpacing: 1,
        columnWidth: [64, 16, 20, 10, 14],
        selectedBg: 'black',
        selectedFg: 'green'
      });
      this.txOutputs = contrib.table({
        parent: this.txDisplay,
        columnSpacing: 1,
        columnWidth: [64, 16, 20, 10, 63],
        selectedBg: 'black',
        selectedFg: 'green'
      });
      this.txRecords = blessed.text({
        parent: this.txDisplay,
        left: 1,
        fg: 'green',
        tags: true
      });
    this.passphraseInput = addInputH(
      this.widget,
      'Passphrase:',
      'passphrase',
      {
        censor: true,
        bottom: 2,
        left: 20,
        right: 20
      }
    );
    this.passphraseInput.key(['enter'], async () => {
      return this.sign();
    });
    addButton(
      this.widget,
      'Sign TX',
      {
        bottom: 1,
        right: 1
      }
    ).on('press', async () => {
      return this.sign();
    });
  }

  async sign() {
    const mtx = this.state.mtx;
    if (!mtx) {
      this.app.log('No MTX to sign.');
      this.close();
      return;
    }

    const wallet = this.state.getWallet();
    if (!wallet)
      return;
    const {passphrase} = this.widget.submit();

    try {
      await wallet.sign(mtx, passphrase);
      if (!mtx.isSigned()) {
        this.app.exportTX(mtx);
      } else {
        await wallet.sendMTX(mtx);
      }
    } catch (e) {
      this.app.log(e.message);
    } finally {
      this.reset();
      this.close();
    }
  }

  refresh() {
    const mtx = this.state.mtx;
    if (!mtx) {
      this.txDisplay.content = 'No MTX in state.';
      return;
    }

    let balanceDelta = 0;

    const txInputs = [];
    for (let i = 0; i < mtx.inputs.length; i++) {
      let addr = '?';
      let value = '?';
      let derivation = '';
      let policy = '?';
      let sigsNeeded = '?';
      const input = mtx.input(i);
      if (!input) {
        txInputs.push(['Unreadble input!', '', '']);
        break;
      }
      const witness = input.witness;
      if (witness) {
        // Get policy from redeem script
        const script = Script.decode(witness.items[witness.items.length - 1]);
        let [m, n] = script.getMultisig();
        m = m === -1 ? 1 : m;
        n = n === -1 ? 1 : n;
        policy = `${m}-of-${n}`;

        // Count existing sigs
        // Multisig stacks always start with an empty element
        let i = m > 1 ? 1 : 0;
        // ...and the last element is either script or public key
        for (; i < witness.items.length - 1; i++) {
          const item = witness.get(i);
          if (item.length !== 0)
            m--;
        }
        sigsNeeded = m;
      }
      const coin = mtx.view.getCoinFor(input);
      if (coin) {
        addr = coin.address.toString(this.app.wdb.network);
        value = doosToHNS(coin.value).padStart(14, ' ');
      }
      const path = mtx.view.getPathFor(input);
      if (path) {
        balanceDelta -= coin.value;
        derivation = path.toPath();
      }

      txInputs.push([addr, value, derivation, policy, sigsNeeded]);
    }

    const txOutputs = [];
    let records = '{bold}NAME RECORDS:{/bold}\n\n';
    for (let i = 0; i < mtx.outputs.length; i++) {
      let addr = '?';
      let value = '?';
      let derivation = '';
      const output = mtx.output(i);
      if (!output) {
        txOutputs.push(['Unreadable output!', '', '']);
        break;
      }
      addr = output.address.toString(this.app.wdb.network);
      value = doosToHNS(output.value).padStart(14, ' ');
      const path = output.path;
      if (path) {
        balanceDelta += output.value;
        derivation = path.toPath();
        if (path.branch === 1)
          derivation += ' (change)';
      }
      let name = '';
      let action = '';

      if (output.covenant.isName()) {
        const json = output.covenant.toJSON();
        action = json.action;
        const nameHash = json.items[0];
        if (action === 'OPEN') {
          // Won't be in the hash table yet, but luckily...
          name = Buffer.from(json.items[2], 'hex').toString('ascii');
        } else {
          const maybeName = this.state.namesByHash.get(nameHash);
          name = maybeName ? maybeName : '';
        }

        if (action === 'UPDATE' || action === 'REGISTER') {
          const data = Buffer.from(json.items[2], 'hex');
          let res;
          try {
            res = resource.Resource.decode(data);
            records += name + ':\n';
            for (const rec of res.records) {
              records += ' ' + JSON.stringify(rec.getJSON()) + '\n';
            }
          } catch (e) {
            this.app.log(e.message);
          }
        }
      }

      txOutputs.push([addr, value, derivation, action, name]);
    }

    const delta = doosToHNS(balanceDelta);
    const fee = doosToHNS(mtx.getFee()).padStart(delta.length, ' ');
    this.txDetails.setData({
      headers: [' TX Details:'],
      data: [
        ['txid', mtx.txid()],
        ['Balance Δ', delta],
        ['Fee', fee]
      ]
    });
    this.txInputs.setData({
      headers: [' INPUTS:', ' Value', ' Path', ' Policy', ' Sigs Needed'],
      data: txInputs
    });
    this.txOutputs.setData({
      headers: [' OUTPUTS:', ' Value', ' Path', ' Action', ' Name'],
      data: txOutputs
    });
    this.txOutputs.top = this.txInputs.top + txInputs.length + 3;
    this.txRecords.content = records;
    this.txRecords.top =
      this.txInputs.top + txInputs.length + txOutputs.length + 6;

    this.passphraseInput.focus();
  }

  reset() {
    this.widget.reset();
  }
}

module.exports = SignTransaction;
