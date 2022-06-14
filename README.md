# Palm Reader

## Terminal UI plugin for hsd

### Status: ALPHA -- use at your own risk

![palmreader-screenshot](https://raw.githubusercontent.com/pinheadmz/palmreader/master/docs/screenshot1.png)

## Installation and usage

For "copy" functionality you must have `pbcopy`, `xsel` or `xclip` installed on
your system. Widgets with copy functions also have the option to export text
to a file as an alternative.

**OSX:** `brew install pbcopy`

**Linux:** `apt install xsel`

```
cd /path/to/hsd
npm install pinheadmz/palmreader
hsd --network=regtest --plugins=palmreader
```

## Dependencies

Due to the sensitivity of cryptocurrency software to dependency risk, only
software written by The Handshake Developers is required by Palm Reader.

Any exceptions to this will be vendored and indicated below:

https://github.com/yaronn/blessed-contrib has been stripped down and included
in `src/` along with snippets from https://github.com/chalk/strip-ansi and
https://github.com/chalk/ansi-regex (all MIT License)