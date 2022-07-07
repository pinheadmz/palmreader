# Palm Reader

## Terminal UI plugin for hsd

![palmreader-screenshot](https://raw.githubusercontent.com/pinheadmz/palmreader/master/docs/screenshot1.png)

## Installation and usage

### Copy to clipboard

For "copy" functionality you must have `pbcopy`, `xsel` or `xclip` installed on
your system. Widgets with copy functions also have the option to export text
to a file as an alternative.

**OSX:** `brew install pbcopy`

**Linux:** `apt install xsel`

### Ledger

**Linux:** `apt install libusb-1.0-0-dev libudev-dev`

[Also be sure to set up udev rules for Ledger:](https://support.ledger.com/hc/en-us/articles/115005165269-Fix-USB-connection-issues-with-Ledger-Live?support=true)

```
wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash
```

## Dependencies

Due to the sensitivity of cryptocurrency software to dependency risk, only
software written by The Handshake Developers is required by Palm Reader.

Any exceptions to this will be vendored and indicated below:

https://github.com/yaronn/blessed-contrib has been stripped down and included
in `src/` along with snippets from https://github.com/chalk/strip-ansi and
https://github.com/chalk/ansi-regex (all MIT License)