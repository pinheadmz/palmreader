/* eslint max-len: "off" */
'use strict';

const blessed = require('blessed');
const AbstractModal = require('./abstract');
const {addButton, hsd} = require('../util');
const {resource} = hsd;

class UpdateRecords extends AbstractModal {
  constructor(options) {
    super(options);

    this.set(blessed.form, {
      label: 'Update Name Records'
    });
    blessed.text({
      parent: this.widget,
      content:
        'Enter or modify root zone HNS records, one per line starting with type.\n' +
        'Leave completely blank to register without any data.\n\n' +
        'Examples:\n' +
        ' DS 24620 8 2 297595dc199b947aa8650923619436fbdfd99fd625195111ab4efe950900cade\n' +
        ' NS ns1.palmreader\n' +
        ' GLUE4 ns1.palmreader 100.200.30.40\n' +
        ' GLUE6 ns1.palmreader 9530:f7fb:dc28:c1a3:d17f:d3f0:b875:aba8\n' +
        ' SYNTH4 100.200.30.40\n' +
        ' SYNTH6 9530:f7fb:dc28:c1a3:d17f:d3f0:b875:aba8\n' +
        ' TXT The entire rest of the line is one string without quotes',
      top: 1,
      left: 1,
      right: 1
    });
    this.records = blessed.textarea({
      parent: this.widget,
      name: 'records',
      inputOnFocus: true,
      mouse: true,
      left: 1,
      right: 1,
      top: 15,
      bottom: 5,
      style: {
        bg: 'blue'
      }
    });
    this.name = blessed.textarea({
      parent: this.widget,
      left: 'center',
      height: 1,
      top: 13,
      style: {
        bold: true,
        fg: 'green'
      }
    });
    addButton(
      this.widget,
      'UPDATE',
      {
        bottom: 1,
        right: 1
      }
    ).on('press', async () => {
      await this.makeUpdate();
    });
  }

  refresh() {
    if (!this.state.selectedNameState || !this.state.selectedNameState.data)
      return;

    this.name.content = 'Updating records for name: ' + this.state.selectedName;

    const {data} = this.state.selectedNameState;

    let res;
    try {
      res = resource.Resource.decode(Buffer.from(data, 'hex'));
    } catch (e) {
      this.app.error(e.message);
      return;
    }

    const json = res.getJSON();

    let str = '';
    for (const rec of json.records) {
      str += rec.type;
      switch (rec.type) {
        case 'DS':
          str += ' ' + rec.keyTag;
          str += ' ' + rec.algorithm;
          str += ' ' + rec.digestType;
          str += ' ' + rec.digest;
          break;
        case 'NS':
          str += ' ' + rec.ns;
          break;
        case 'GLUE4':
        case 'GLUE6':
          str += ' ' + rec.ns;
          str += ' ' + rec.address;
          break;
        case 'SYNTH4':
        case 'SYNTH6':
          str += ' ' + rec.address;
          break;
        case 'TXT':
          // Technically TXT is an array of strings.
          // No one ever seems to use it like that though
          // so hopefully we're not breaking anyone's data this way.
          str += ' ' + rec.txt[0];
          break;
        default:
          str += ' <unknown record type>';
          break;
      }
      str += '\n';
    }

    // Remove last newline
    this.records.value = str.slice(0, -1);
  }

  async makeUpdate() {
    const {records} = this.widget.submit();
    const lines = records.split('\n');

    const json = {records: []};

    for (const line of lines) {
      const words = line.split(' ');
      const type = words.shift();
      const record = {type};

      switch (type) {
        case 'DS':
          record.keyTag = words.shift();
          record.algorithm = words.shift();
          record.digestType = words.shift();
          record.digest = words.shift();
          break;
        case 'NS':
          record.ns = words.shift();
          break;
        case 'GLUE4':
        case 'GLUE6':
          record.ns = words.shift();
          record.address = words.shift();
          break;
        case 'SYNTH4':
        case 'SYNTH6':
          record.address = words.shift();
          break;
        case 'TXT':
          record.txt = [words.join(' ')];
          break;
        default:
          this.app.error(`Unknown record type: ${type}`);
          break;
      }

      json.records.push(record);
    }

    try {
      const wallet = this.state.getWallet();
      if (!wallet)
        return;
      const mtx = await wallet.createUpdate(
        this.state.selectedName,
        resource.Resource.fromJSON(json),
        {
          account: this.state.selectedAccount
        }
      );
      await this.app.signTX(mtx);
    } catch (e) {
      this.app.error(e.message);
    }
  }
}

module.exports = UpdateRecords;
