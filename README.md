# MMM-WifiLink

A [MagicMirror²](https://magicmirror.builders/) module that shows a clean, **iOS-style Wi-Fi
signal indicator**: five bars that light up and change colour with the real link quality
(green → amber → red). The signal is read directly from `iw` (actual dBm), and the display
updates **in place** so it never flickers.

![MMM-WifiLink screenshot](screenshot.png)

## Features

- Five signal bars, coloured by quality (excellent/good → fair → weak)
- Real signal strength (dBm) from `iw dev <iface> link`
- Optional quality label under the bars (localised; English & German included)
- In-place DOM updates — no black flicker on refresh
- Two sizes (`normal` / `small`) and self-contained styling

## Requirements

- **Linux** with a wireless interface
- The `iw` tool (`sudo apt install iw`)
- Read access to `/proc/net/dev` (default)

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/ago1776/MMM-WifiLink
```

Then add the module to `config/config.js`:

```js
{
  module: "MMM-WifiLink",
  position: "top_right",
  header: "Wi-Fi",           // optional
  config: {
    iface: "wlan0"
  }
}
```

## Configuration options

| Option           | Type    | Default   | Description                                        |
| ---------------- | ------- | --------- | -------------------------------------------------- |
| `iface`          | string  | `"wlan0"` | Wireless interface to read.                        |
| `updateInterval` | number  | `5000`    | Poll interval in ms.                               |
| `showLabel`      | boolean | `true`    | Show the quality word under the bars.              |
| `barSize`        | string  | `"normal"`| Bar size: `"normal"` or `"small"`.                 |

## Translations

Quality words live in `translations/en.json` and `translations/de.json`. Add a language by
copying `en.json` to `<lang>.json` and translating the values. Language follows MagicMirror's
global `language` setting.

## Troubleshooting: keeping the link stable

This module only *displays* the link — it doesn't manage it. On a Raspberry Pi running over
Wi-Fi, two OS-level settings make the difference between a rock-steady signal and bars that
keep dropping out. Both are host settings (NetworkManager / `iw`), not module options.

**1. Disable Wi-Fi power saving.** The Pi's onboard `brcmfmac` adapter defaults to power-save
*on*, which causes periodic disconnect → scan → reassociate flaps **even at an excellent
signal**. On a headless kiosk such a flap can leave NetworkManager stuck at an
"authentication required" prompt that never clears by itself. Turn power saving off:

```bash
# live (until reboot)
sudo iw dev wlan0 set power_save off
# persistent in NetworkManager (2 = disabled; survives reboot)
sudo nmcli con mod "<your-connection>" 802-11-wireless.powersave 2
```

**2. Pin the connection to one radio (fixed SSID/band).** In a multi-AP or band-steering
network, a "sticky" Pi client can get pushed onto a far radio (e.g. a 5 GHz AP behind a wall)
where the link is barely alive, then drop — while a near 2.4 GHz radio of the *same* SSID
would give a strong signal. Lock the profile so it stays on the good radio:

```bash
# lock to 2.4 GHz only
sudo nmcli con mod "<your-connection>" 802-11-wireless.band bg
# or pin one specific access point by BSSID
sudo nmcli con mod "<your-connection>" 802-11-wireless.bssid AA:BB:CC:DD:EE:FF
```

Power-saving-off and a fixed radio together are what keep the bars above steady on a Pi.

## License

MIT © Andreas Göpfert

