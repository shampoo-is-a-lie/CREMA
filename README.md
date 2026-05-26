<div align="center">

<img src="https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/icons/crema_icon.svg" width="80" alt="CREMA Icon">

# CREMA

**The fullscreen, gamepad-driven companion to CNGM.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux-orange.svg)](#installation)

[🌐 Website](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/) · [📖 Manual](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/crema_manual.html) · [❓ FAQ](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/faq.html) · [🖥️ CNGM](https://github.com/shampoo-is-a-lie/CafeNeuroticoGameManager)

</div>

---

![CREMA Screenshot](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_01.jpg)

## About

> *Crema is the reddish-brown frothy foam on top of a freshly brewed espresso — a sign of freshness and proper pressure.*

CREMA is the fullscreen companion to **[CNGM](https://github.com/shampoo-is-a-lie/CafeNeuroticoGameManager)**. It reads the exact same library database and presents your games in a bold, beautiful TV-mode interface built for couch play. Laidback, easygoing, and focused purely on fun. Grab a controller and enjoy.

Place both AppImages in the same folder and CREMA is available instantly from CNGM's sidebar — no configuration needed.

## Screenshots

| | | |
|:---:|:---:|:---:|
| ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_02.jpg) | ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_03.jpg) | ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_04.jpg) |
| ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_05.jpg) | ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_06.jpg) | ![](https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/assets/images/crema_scr_07.jpg) |

## Features

- **Shared Library** — reads the same `GameManagerConfig/game_library.db` as CNGM. Any change made in CNGM is immediately visible in CREMA. Steam install status is pushed live to both apps simultaneously.
- **Fullscreen Gallery** — cover art grid with category navigation (All Games, Installed, Steam, GOG, Epic, Amazon, Physical, Emulation, Favs, Want to Play and more).
- **Cinematic Gamepage** — hero banner, transparent logo, stats panel, screenshots slideshow, trailer playback, and FAV / Want to Play toggles — all gamepad-driven.
- **Jukebox** — full music player with custom music folder support (`CREMA_CUSTOM_MUSIC`). Browse by Artist, Album or Playlist. L3/R3 skips tracks while browsing games. BGM fades automatically on trailer playback.
- **Built-in BGM** — curated background music in Ambient (default), Lo-Fi, Jazz and Piano styles.
- **Screensaver** — CN Wallpapers mode or interactive Screenshots mode (launch or favourite a game directly from the screensaver). Configurable delay from 1 to 30 minutes.
- **Sleep Mode** — yields resources to the game on launch, then wakes CREMA back to the front when you're done. Wake combo is configurable (6 options).
- **Individual Scraping** — scrape metadata and artwork for any game directly in CREMA, with an IGDB fallback for titles not found on Steam.
- **50+ Themes** — same full theme library as CNGM, switchable live from the System Menu.
- **On-Screen Keyboard** — for launch commands, search, playlist names and more.

## Controls

| Gamepad | Action |
|---|---|
| Left Stick / D-Pad | Navigate |
| A / Cross | Confirm / Launch |
| B / Circle | Back |
| X / Square | Scrape metadata |
| LB / L1 · RB / R1 | Previous / Next category |
| L3 · R3 | Previous / Next Jukebox track |
| Start / Menu | System Menu |

| Keyboard | Action |
|---|---|
| Arrow Keys | Navigate |
| Enter | Confirm |
| Escape | Back |
| M | System Menu |
| `,` + `.` (hold) | Wake from screensaver / sleep |

## Installation

1. Download `CREMA.AppImage` from the [Releases](https://github.com/shampoo-is-a-lie/CREMA/releases) page.
2. Place it in the **same folder** as `CNGM.AppImage`.
3. Make it executable:
   ```bash
   chmod +x CREMA.AppImage
   ```
4. Launch it from inside CNGM (sidebar button) or run it directly:
   ```bash
   ./CREMA.AppImage
   ```

> CREMA requires CNGM to be set up first — it reads the shared `GameManagerConfig` folder for all library data.

**After launching a game**, wake CREMA with **Start + Select** on your controller (or hold `,` + `.` on keyboard). Change the wake combo in System Menu → Controls → Wake Method.

## The Cafe Neurotico Ecosystem

```
  CNGM           Central hub — PC game library, store sync, launches all companion apps
    │
    ├──▸  CREMA  ◈    Fullscreen / gamepad counterpart for CNGM + EmuLatte
    │
    ├──▸  GRINDER     GOG & Epic install engine — feeds games back into CNGM
    │
    ├──▸  EmuLatte    ROM library manager — emulation counterpart to CNGM
    │
    └──▸  CN Clock    Floating desktop clock — shows art from CNGM + EmuLatte
```

Place all AppImages in the same folder. CNGM launches CREMA from its sidebar — no configuration needed.

## License

Copyright (C) 2026 J.R.A. (Shampoo is a Lie)

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License v3.0** as published by the Free Software Foundation.

See the [LICENSE](LICENSE) file for the full license text.

---

<div align="center">
<sub>Part of the <a href="https://shampoo-is-a-lie.github.io/CafeNeuroticoWebSite/">Cafe Neurotico ecosystem</a>. Sweet foam on top.</sub>
</div>
