# Class Monitor

A Chrome/Edge extension (Manifest V3) that blocks AI chatbot and homework-solver websites on school-managed computers. Blocking can only be turned off with a teacher password.

## Features

- Blocks a configurable list of AI sites (ChatGPT, Gemini, Claude, Perplexity, and others)
- Two layers of blocking: network rules (`declarativeNetRequest`) and tab/navigation checks (`webNavigation`)
- Closes AI tabs that were already open when blocking is switched on
- Toolbar popup showing ON/OFF status
- Turning blocking OFF requires a teacher password (stored only as a salted PBKDF2 hash)
- Blocking is ON by default and the setting is remembered after restart

## Project structure

```
class-monitor/
├── manifest.json     Extension configuration and permissions
├── background.js     Blocking logic, tab checks, password handling
├── rules.json        Blocked domain list (network rules)
├── popup.html        Toolbar popup interface
├── popup.js          Popup logic
├── blocked.html      Page shown when a site is blocked
└── icons/            Extension icons (16, 48, 128 px)
```

## Installation (manual)

1. Download this repo (**Code → Download ZIP**) and unzip it, or run `git clone [your-repo-url]`.
2. Open `chrome://extensions` in Chrome or Edge.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension to the toolbar (puzzle icon, then the pin).

## First-time setup

1. Click the extension icon.
2. Enter a teacher password (at least 6 characters) and click **Save password**.
3. Do this **before** giving the computer to students. The first person to open the popup creates the password.

The password is not stored in this repository and cannot be recovered. If you forget it, remove the extension and load it again.

## Usage

| Action | How |
|---|---|
| Turn blocking OFF | Click the icon, enter the teacher password, click **Turn OFF** |
| Turn blocking ON | Click the icon, click **Turn ON** (no password needed) |
| Check status | The popup shows ON or OFF |

## Adding or removing blocked sites

The domain list exists in **two places** and both must match:

1. `rules.json`, in the `requestDomains` array
2. `background.js`, in the `AI_DOMAINS` array

Subdomains are covered automatically (`perplexity.ai` also blocks `www.perplexity.ai`).
After editing, go to `chrome://extensions` and click **reload** on the extension.

## Deployment for a school

Manual installation is suitable for personal or test computers only, because users can remove it from `chrome://extensions`. For student devices:

1. Publish to the Chrome Web Store, set to **Private** (your domain only), or use another approved distribution method.
2. In Google Admin console (or Group Policy for Edge), **force-install** the extension.
3. In the same policy, block `chrome://extensions`, disable Developer Tools, and disable Incognito mode.
4. Block or restrict other browsers on the device.

## Known limitations

- Does not cover phones, personal devices, or other browsers where the extension is not installed
- Does not cover AI features built into other products (search engine AI answers, Grammarly, and similar)
- Domain lists go out of date as new AI tools appear
- Without force-install, the extension can be removed or disabled by the user

## Privacy

- Runs only in the browser on the device where it is installed
- Does not record page content, keystrokes, or screenshots
- Does not send data to any server
- Stores only the ON/OFF state and the salted password hash, in local browser storage

Use only on school-owned devices, and inform students and parents about what is restricted. Check local data-protection requirements (for example, India's DPDP Act 2023) with your school administration before deploying.

## Updating

1. Change `"version"` in `manifest.json`.
2. Replace the files on the target computer (or upload a new ZIP to the Chrome Web Store).
3. Click **reload** on the extension card.



## Author

DEEPU P
