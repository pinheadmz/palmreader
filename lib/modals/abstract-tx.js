'use strict';

const blessed = require('blessed');
const contrib = require('../../src/blessed-contrib');
const AbstractModal = require('./abstract');
const {doosToHNS, hsd} = require('../util');
const {Script, resource, HDPublicKey, Address} = hsd;
const {
  LedgerInput,
  LedgerChange,
  LedgerCovenant
} = require('hsd-ledger');

class AbstractTXModal extends AbstractModal {
  constructor(options) {
    super(options);

    // As we parse the MTX to display all its details in refresh(),
    // we can also prepare for possible Ledger-signing by building
    // the metadata objects the device will need.
    this.ledgerOptions = {
      inputs: [],
      covenants: [],
      change: null
    };

    // Abstract class, never calls this.set()
  }

  afterSet() {
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
  }

  refresh() {
    const mtx = this.state.mtx;
    if (!mtx) {
      this.txDisplay.content = 'No MTX in state.';
      return;
    }

    const info = this.state.getAccountInfo();

    // Reset
    this.ledgerOptions = {
      inputs: [],
      covenants: [],
      change: null
    };

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
      } else {
        // Wallet probably didn't spend this input so we
        // can't know it's value without extra indexing.
        // We can, however, guess the address based on the witness.
        if (witness)
          addr = witness.getInputAddress();
      }

      const path = mtx.view.getPathFor(input);
      // It's ours
      if (path) {
        balanceDelta -= coin.value;
        derivation = path.toPath();
      }

      txInputs.push([addr, value, derivation, policy, sigsNeeded]);

      // Skip this if we don't have enough data to construct
      // the LedgerInput. If we are signing an
      // atomic swap or other CoinJoin it might be fine to skip.
      if (witness && witness.length > 0 && coin && path) {
        let redeem, publicKey;

        const lastStackItem = witness.items[witness.items.length - 1];
        // Multisig
        if (coin.address.version === 0 && coin.address.hash.length === 32) {
          redeem = lastStackItem;
          // We also need to figure out which public key in the redeem script
          // belongs to us so we know where to place our signature.
          const acct = HDPublicKey.fromBase58(info.accountKey);
          publicKey = acct.derive(path.branch).derive(path.index).publicKey;
        }
        // Single sig / pubkeyhash address
        if (coin.address.version === 0 && coin.address.hash.length === 20)
          publicKey = lastStackItem;

        this.ledgerOptions.inputs.push(new LedgerInput({
          coin,
          input,
          index: i,
          path: path.toPath(this.app.wdb.network),
          publicKey,
          redeem
          // type: Script.hashType.ALL // default
        }));
      }
    }

    const txOutputs = [];
    let records = '{bold}NAME UPDATES:{/bold}\n\n';
    for (let i = 0; i < mtx.outputs.length; i++) {
      let addr = '?';
      let value = '?';
      let derivation = '';
      let name = '';
      let action = '';

      const output = mtx.output(i);
      if (!output) {
        txOutputs.push(['Unreadable output!', '', '']);
        break;
      }

      addr = output.address.toString(this.app.wdb.network);

      value = doosToHNS(output.value).padStart(14, ' ');

      const path = output.path;
      // It's ours
      if (path) {
        balanceDelta += output.value;
        derivation = path.toPath();
        if (path.branch === 1)
          derivation += ' (change)';
      }

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
            records += name + ':\n records:\n';
            for (const rec of res.records) {
              records += '  ' + JSON.stringify(rec.getJSON()) + '\n';
            }
          } catch (e) {
            this.app.error(e.message);
          }
        }

        if (action === 'TRANSFER') {
          const version = parseInt(json.items[2], 16);
          const data = Buffer.from(json.items[3], 'hex');
          try {
            const addr = Address.fromProgram(version, data);
            records += name + ':\n new address: ';
            records += addr.toString(this.app.wdb.network);
            records += '\n';
          } catch (e) {
            this.app.error(e.message);
          }
        }

        // TODO: undo balance delta from locked coins

        if (name && i < 255) {
          this.ledgerOptions.covenants.push(new LedgerCovenant({
            index: i, // must be UInt8
            name
          }));
        }
      }

      txOutputs.push([addr, value, derivation, action, name]);

      // Multisig wallets can't do the magic ledger change output trick
      // because there is no way for the device to compute a change address
      // involving external public keys.
      if (path && path.branch === 1 && info.n === 1) {
        this.ledgerOptions.change = new LedgerChange({
          index: i,
          version: output.address.version,
          path: path.toPath(this.app.wdb.network)
        });
      }
    }

    const delta = doosToHNS(balanceDelta);
    const fee = doosToHNS(mtx.getFee(mtx.view)).padStart(delta.length, ' ');

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
    this.txRecords.content = records;

    this.txOutputs.top = this.txInputs.top + txInputs.length + 3;
    this.txRecords.top = this.txOutputs.top + txOutputs.length + 3;
  }

  reset() {
    this.widget.reset();
  }
}

module.exports = AbstractTXModal;
