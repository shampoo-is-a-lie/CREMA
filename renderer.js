window.onerror = function(message, source, lineno) {
  const txt = document.getElementById('splash-text');
  if (txt) { txt.innerText = `ERR: ${message} (Line ${lineno})`; txt.style.color = "red"; }
};

let baseDir = ""; let sfxNav, sfxSelect, sfxBack; let bgmAudio = new Audio();
let audioCfg = { bgm: true, sfx: true, vol: 0.3, bgm_mode: "JAZZ", theme: "CREMA (DEFAULT)", screensaver: "CN WALLPAPERS", screensaverDelay: 3, gamepadLayout: "XBOX", wakeMethod: "START + SELECT", startScreenMode: "CAROUSEL" };
let customPlaylist = []; let customIndex = 0; let isCustom = false;
let npTimeout = null;

let gameState = 'SPLASH';
let allGames = [], filteredGames = [];
let currentCategoryIndex = 0, currentGameIndex = 0, currentOverlayIndex = 0, currentSearchIndex = 0;
let overlayItems = [], searchResults = [];

// Default to 5 recent games for CREMA
let recentGamesCount = 5;
let numRecentInList = 0;

let trailerTimeout = null, screenshotInterval = null, bgmFadeInterval = null;
let screenshotArray = [], currentScreenshotIndex = 0;
let gameHasTrailer = false, mediaSwapped = false;
let activeThemeCategory = ""; let activeTheme = "CREMA (DEFAULT)";

let hasBooted = false; let idleTimer = null; let screensaverInterval = null; let ssClockInterval = null;
let screensaverStartTime = 0;
let availableScreenshots = []; let currentSSGame = null;
let availableWallpapers = [];
const delayOptions = [1, 2, 3, 4, 5, 10, 15, 30];

let oskMode = 'SEARCH'; let tempOskString = '';
const OSK_COLS = 7; const OSK_ROWS = 6;
const oskKeys = [ ['A', 'B', 'C', 'D', 'E', 'F', 'G'], ['H', 'I', 'J', 'K', 'L', 'M', 'N'], ['O', 'P', 'Q', 'R', 'S', 'T', 'U'], ['V', 'W', 'X', 'Y', 'Z', '0', '1'], ['2', '3', '4', '5', '6', '7', '8'], ['9', 'SPACE', 'BKSP', 'CLEAR', 'DONE', '.', '-'] ];
let oskR = 0, oskC = 0; let searchQuery = "";

let sgdbResults = []; let sgdbIndex = 0;
let activeScrapeMode = ''; let steamSearchResults = []; let selectedAppId = null; let selectedResolvedName = null;

const categories = ["ALL GAMES", "STEAM", "GOG", "EPIC", "OTHERS", "PHYSICAL", "EMULATION", "AMAZON", "APPS", "PLAYABLE", "WANT TO PLAY", "FAVS"];

const THEMES = {
  "DARK GRAY": {bg: "#141414", bg_panel: "rgba(0,0,0,0.5)", bg_menu: "#222222", accent: "#ffffff", accent_menu: "#00e5ff", text_main: "#ffffff", text_sec: "#bbbbbb", text_dim: "#777777", border: "rgba(255,255,255,0.1)", border_solid: "#555555"},
  "CREMA (DEFAULT)": {bg: "#2C1E16", bg_panel: "rgba(67, 40, 24, 0.6)", bg_menu: "#432818", accent: "#D4A373", accent_menu: "#D4A373", text_main: "#FFE6A7", text_sec: "#E6CC98", text_dim: "#A47148", border: "rgba(212, 163, 115, 0.2)", border_solid: "#8B5A2B"},
  "CYBERPUNK": {bg: "#09090b", bg_panel: "rgba(26, 26, 46, 0.7)", bg_menu: "#1a1a2e", accent: "#f3e600", accent_menu: "#00ffcc", text_main: "#00ffcc", text_sec: "#e0e0e0", text_dim: "#ff003c", border: "rgba(243, 230, 0, 0.2)", border_solid: "#ff003c"},
  "VAPOUR OS": {bg: "#171a21", bg_panel: "rgba(27, 40, 56, 0.7)", bg_menu: "#1b2838", accent: "#66c0f4", accent_menu: "#66c0f4", text_main: "#c7d5e0", text_sec: "#8f98a0", text_dim: "#556b82", border: "rgba(102, 192, 244, 0.2)", border_solid: "#2a475e"},
  "PSIV BLUE": {bg: "#000022", bg_panel: "rgba(0, 67, 156, 0.4)", bg_menu: "#001144", accent: "#ffffff", accent_menu: "#0070cc", text_main: "#ffffff", text_sec: "#aaaaaa", text_dim: "#666666", border: "rgba(0, 112, 204, 0.3)", border_solid: "#00439c"},
  "GREEN BOX": {bg: "#101010", bg_panel: "rgba(26, 26, 26, 0.7)", bg_menu: "#1a1a1a", accent: "#107C10", accent_menu: "#107C10", text_main: "#ffffff", text_sec: "#cccccc", text_dim: "#777777", border: "rgba(16, 124, 16, 0.3)", border_solid: "#333333"},
  "MOVIESFLIX": {bg: "#000000", bg_panel: "rgba(20, 20, 20, 0.8)", bg_menu: "#141414", accent: "#E50914", accent_menu: "#E50914", text_main: "#ffffff", text_sec: "#b3b3b3", text_dim: "#808080", border: "rgba(229, 9, 20, 0.3)", border_solid: "#404040"},
  "SNOW": {bg: "#E0E0E0", bg_panel: "rgba(255, 255, 255, 0.7)", bg_menu: "#FFFFFF", accent: "#000000", accent_menu: "#000000", text_main: "#111111", text_sec: "#444444", text_dim: "#777777", border: "rgba(0, 0, 0, 0.1)", border_solid: "#CCCCCC"},
  "WIN XP": {bg: "#0055e5", bg_panel: "rgba(236, 233, 216, 0.3)", bg_menu: "#003399", accent: "#319d2b", accent_menu: "#319d2b", text_main: "#ffffff", text_sec: "#ece9d8", text_dim: "#c0c0c0", border: "rgba(255, 255, 255, 0.3)", border_solid: "#319d2b"},
  "PSIII CLASSIC": {bg: "#000000", bg_panel: "rgba(25, 25, 25, 0.7)", bg_menu: "#111111", accent: "#dcdcdc", accent_menu: "#ffffff", text_main: "#ffffff", text_sec: "#aaaaaa", text_dim: "#666666", border: "rgba(255, 255, 255, 0.2)", border_solid: "#444444"},
  "PSIII RED": {bg: "#2b0000", bg_panel: "rgba(40, 0, 0, 0.7)", bg_menu: "#1a0000", accent: "#ff4d4d", accent_menu: "#ff4d4d", text_main: "#ffffff", text_sec: "#ffcccc", text_dim: "#cc6666", border: "rgba(255, 77, 77, 0.2)", border_solid: "#800000"},
  "PSIII GREEN": {bg: "#001a00", bg_panel: "rgba(0, 30, 0, 0.7)", bg_menu: "#000d00", accent: "#4dff4d", accent_menu: "#4dff4d", text_main: "#ffffff", text_sec: "#ccffcc", text_dim: "#66cc66", border: "rgba(77, 255, 77, 0.2)", border_solid: "#004d00"},
  "PSIII BLUE": {bg: "#000a1a", bg_panel: "rgba(0, 15, 30, 0.7)", bg_menu: "#00050d", accent: "#4d94ff", accent_menu: "#4d94ff", text_main: "#ffffff", text_sec: "#cce0ff", text_dim: "#66a3ff", border: "rgba(77, 148, 255, 0.2)", border_solid: "#003380"},
  "PSIII PURPLE": {bg: "#1a001a", bg_panel: "rgba(30, 0, 30, 0.7)", bg_menu: "#0d000d", accent: "#d24dff", accent_menu: "#d24dff", text_main: "#ffffff", text_sec: "#f0ccff", text_dim: "#c266cc", border: "rgba(210, 77, 255, 0.2)", border_solid: "#800080"},
  "PSIII GOLD": {bg: "#261a00", bg_panel: "rgba(40, 25, 0, 0.7)", bg_menu: "#130d00", accent: "#ffcc00", accent_menu: "#ffcc00", text_main: "#ffffff", text_sec: "#ffeecc", text_dim: "#cca300", border: "rgba(255, 204, 0, 0.2)", border_solid: "#997300"},
  "PSIII SILVER": {bg: "#1a1a1a", bg_panel: "rgba(35, 35, 35, 0.7)", bg_menu: "#0d0d0d", accent: "#cccccc", accent_menu: "#cccccc", text_main: "#ffffff", text_sec: "#e6e6e6", text_dim: "#999999", border: "rgba(204, 204, 204, 0.2)", border_solid: "#666666"},
  "DRACULA": {bg: "#282a36", bg_panel: "rgba(68, 71, 90, 0.7)", bg_menu: "#44475a", accent: "#bd93f9", accent_menu: "#ff79c6", text_main: "#f8f8f2", text_sec: "#8be9fd", text_dim: "#6272a4", border: "rgba(189, 147, 249, 0.2)", border_solid: "#6272a4"},
  "GRUVBOX": {bg: "#282828", bg_panel: "rgba(60, 56, 54, 0.8)", bg_menu: "#3c3836", accent: "#fabd2f", accent_menu: "#fe8019", text_main: "#ebdbb2", text_sec: "#b8bb26", text_dim: "#a89984", border: "rgba(250, 189, 47, 0.2)", border_solid: "#504945"},
  "NORD": {bg: "#2e3440", bg_panel: "rgba(59, 66, 82, 0.8)", bg_menu: "#3b4252", accent: "#88c0d0", accent_menu: "#81a1c1", text_main: "#eceff4", text_sec: "#e5e9f0", text_dim: "#4c566a", border: "rgba(136, 192, 208, 0.2)", border_solid: "#434c5e"},
  "SOLARIZED DARK": {bg: "#002b36", bg_panel: "rgba(7, 54, 66, 0.8)", bg_menu: "#073642", accent: "#2aa198", accent_menu: "#268bd2", text_main: "#839496", text_sec: "#93a1a1", text_dim: "#586e75", border: "rgba(42, 161, 152, 0.2)", border_solid: "#073642"},
  "SOLARIZED LIGHT": {bg: "#fdf6e3", bg_panel: "rgba(238, 232, 213, 0.8)", bg_menu: "#eee8d5", accent: "#2aa198", accent_menu: "#d33682", text_main: "#657b83", text_sec: "#586e75", text_dim: "#93a1a1", border: "rgba(42, 161, 152, 0.2)", border_solid: "#ccc2a8"},
  "CATPPUCCIN MOCHA": {bg: "#1e1e2e", bg_panel: "rgba(30, 30, 46, 0.8)", bg_menu: "#181825", accent: "#cba6f7", accent_menu: "#f5c2e7", text_main: "#cdd6f4", text_sec: "#bac2de", text_dim: "#6c7086", border: "rgba(203, 166, 247, 0.2)", border_solid: "#313244"},
  "CATPPUCCIN MACCHIATO": {bg: "#24273a", bg_panel: "rgba(36, 39, 58, 0.8)", bg_menu: "#1e2030", accent: "#c6a0f6", accent_menu: "#f4b8e4", text_main: "#cad3f5", text_sec: "#b8c0e0", text_dim: "#6e738d", border: "rgba(198, 160, 246, 0.2)", border_solid: "#363a4f"},
  "CATPPUCCIN FRAPPÉ": {bg: "#303446", bg_panel: "rgba(48, 52, 70, 0.8)", bg_menu: "#292c3c", accent: "#ca9ee6", accent_menu: "#f2d5cf", text_main: "#c6d0f5", text_sec: "#b5bfe2", text_dim: "#737994", border: "rgba(202, 158, 230, 0.2)", border_solid: "#414559"},
  "CATPPUCCIN LATTE": {bg: "#eff1f5", bg_panel: "rgba(239, 241, 245, 0.8)", bg_menu: "#e6e9ef", accent: "#8839ef", accent_menu: "#1e66f5", text_main: "#4c4f69", text_sec: "#5c5f77", text_dim: "#9ca0b0", border: "rgba(136, 57, 239, 0.2)", border_solid: "#ccd0da"},
  "TOKYO NIGHT": {bg: "#1a1b26", bg_panel: "rgba(36, 40, 59, 0.8)", bg_menu: "#16161e", accent: "#7aa2f7", accent_menu: "#bb9af7", text_main: "#c0caf5", text_sec: "#a9b1d6", text_dim: "#565f89", border: "rgba(122, 162, 247, 0.2)", border_solid: "#292e42"},
  "EVERFOREST": {bg: "#2b3339", bg_panel: "rgba(50, 56, 62, 0.8)", bg_menu: "#2f383e", accent: "#a7c080", accent_menu: "#e67e80", text_main: "#d3c6aa", text_sec: "#a7c080", text_dim: "#859289", border: "rgba(167, 192, 128, 0.2)", border_solid: "#4b565c"},
  "ROSÉ PINE": {bg: "#191724", bg_panel: "rgba(31, 29, 46, 0.8)", bg_menu: "#1f1d2e", accent: "#c4a7e7", accent_menu: "#ebbcba", text_main: "#e0def4", text_sec: "#9ccfd8", text_dim: "#6e6a86", border: "rgba(196, 167, 231, 0.2)", border_solid: "#26233a"},
  "GAME BOY DMG": {bg: "#8bac0f", bg_panel: "rgba(155, 188, 15, 0.5)", bg_menu: "#8bac0f", accent: "#0f380f", accent_menu: "#0f380f", text_main: "#0f380f", text_sec: "#306230", text_dim: "#306230", border: "rgba(15, 56, 15, 0.2)", border_solid: "#306230"},
  "PIP BOY": {bg: "#000000", bg_panel: "rgba(0, 20, 0, 0.7)", bg_menu: "#001100", accent: "#14ff00", accent_menu: "#14ff00", text_main: "#14ff00", text_sec: "#0ea000", text_dim: "#0a6000", border: "rgba(20, 255, 0, 0.2)", border_solid: "#0ea000"},
  "SEVASTOPOL": {bg: "#050d05", bg_panel: "rgba(10, 25, 10, 0.7)", bg_menu: "#081808", accent: "#f5e6b3", accent_menu: "#ff0000", text_main: "#f5e6b3", text_sec: "#a39977", text_dim: "#4d594d", border: "rgba(245, 230, 179, 0.1)", border_solid: "#1a331a"},
  "RIP AND TEAR CLASSIC": {bg: "#1a0000", bg_panel: "rgba(40, 0, 0, 0.8)", bg_menu: "#2b0000", accent: "#ff0000", accent_menu: "#ff3333", text_main: "#ffcc00", text_sec: "#ff6600", text_dim: "#990000", border: "rgba(255, 0, 0, 0.3)", border_solid: "#800000"},
  "SUPER BROTHERS": {bg: "#5C94FC", bg_panel: "rgba(200,76,12,0.8)", bg_menu: "#C84C0C", accent: "#F8D820", accent_menu: "#F8D820", text_main: "#ffffff", text_sec: "#FFCE9E", text_dim: "#E8A274", border: "rgba(248,216,32,0.4)", border_solid: "#000000"},
  "GREEN HILL": {bg: "#2492FF", bg_panel: "rgba(136,68,0,0.8)", bg_menu: "#00A800", accent: "#F8B800", accent_menu: "#F8B800", text_main: "#ffffff", text_sec: "#E0E0E0", text_dim: "#A0A0A0", border: "rgba(248,184,0,0.5)", border_solid: "#000000"},
  "NES": {bg: "#808080", bg_panel: "rgba(0,0,0,0.85)", bg_menu: "#333333", accent: "#E00000", accent_menu: "#E00000", text_main: "#ffffff", text_sec: "#CCCCCC", text_dim: "#888888", border: "rgba(224,0,0,0.4)", border_solid: "#000000"},
  "SNES": {bg: "#b5b6b5", bg_panel: "rgba(200, 200, 200, 0.8)", bg_menu: "#e2e2e2", accent: "#524b82", accent_menu: "#827aa5", text_main: "#333333", text_sec: "#555555", text_dim: "#777777", border: "rgba(82, 75, 130, 0.2)", border_solid: "#524b82"},
  "EARTHY & ORGANIC": {bg: "#3E4E3A", bg_panel: "rgba(91, 107, 85, 0.7)", bg_menu: "#4F5D48", accent: "#D4B28C", accent_menu: "#A9C298", text_main: "#F3EDE4", text_sec: "#D8D3C8", text_dim: "#8E9E88", border: "rgba(212, 178, 140, 0.2)", border_solid: "#6b7d63"},
  "DOPAMINE BRIGHTS": {bg: "#FF3366", bg_panel: "rgba(20,20,20,0.8)", bg_menu: "#1a1a1a", accent: "#00E5FF", accent_menu: "#FFEB3B", text_main: "#ffffff", text_sec: "#CCCCCC", text_dim: "#888888", border: "rgba(0,229,255,0.4)", border_solid: "#333333"},
  "RETRO REVIVAL": {bg: "#F2D1C9", bg_panel: "rgba(240, 200, 190, 0.8)", bg_menu: "#E8C0B5", accent: "#E05A47", accent_menu: "#6C8A9B", text_main: "#4A403A", text_sec: "#72655A", text_dim: "#A28E84", border: "rgba(224, 90, 71, 0.2)", border_solid: "#E05A47"}
};
const THEME_CATEGORIES = { "Originals & System": ["CREMA (DEFAULT)", "DARK GRAY", "CYBERPUNK", "SNOW", "MOVIESFLIX", "VAPOUR OS", "PSIV BLUE", "GREEN BOX", "WIN XP"], "Gaming Legends": ["GAME BOY DMG", "PIP BOY", "SEVASTOPOL", "RIP AND TEAR CLASSIC", "SUPER BROTHERS", "GREEN HILL", "NES", "SNES"], "Aesthetics": ["EARTHY & ORGANIC", "DOPAMINE BRIGHTS", "RETRO REVIVAL"], "Linux Ricing": ["DRACULA", "GRUVBOX", "NORD", "SOLARIZED DARK", "SOLARIZED LIGHT", "CATPPUCCIN LATTE", "CATPPUCCIN FRAPPÉ", "CATPPUCCIN MACCHIATO", "CATPPUCCIN MOCHA", "TOKYO NIGHT", "EVERFOREST", "ROSÉ PINE"], "PSIII Colors": ["PSIII CLASSIC", "PSIII RED", "PSIII GREEN", "PSIII BLUE", "PSIII PURPLE", "PSIII GOLD", "PSIII SILVER"] };

function updateAppScale() { const wrapper = document.getElementById('app-scale-wrapper'); if (!wrapper) return; const scaleX = window.innerWidth / 1920; const scaleY = window.innerHeight / 1080; const scale = Math.min(scaleX, scaleY); wrapper.style.transform = `scale(${scale})`; wrapper.style.left = `${(window.innerWidth - (1920 * scale)) / 2}px`; wrapper.style.top = `${(window.innerHeight - (1080 * scale)) / 2}px`; } window.addEventListener('resize', updateAppScale);
function setBlur(enable) { const s = document.getElementById('start-screen'); const m = document.getElementById('main-screen'); if (enable) { s.classList.add('is-blurred'); m.classList.add('is-blurred'); } else { s.classList.remove('is-blurred'); m.classList.remove('is-blurred'); } }
function isVideoActive() { const vid = document.getElementById('video-player'); return vid && !vid.paused && vid.src && vid.src.includes('file://'); }
function applyTheme(themeName) { activeTheme = THEMES[themeName] ? themeName : "CREMA (DEFAULT)"; const t = THEMES[activeTheme]; const root = document.documentElement; Object.keys(t).forEach(key => root.style.setProperty(`--${key}`, t[key])); }

// App Assets Helper
function convertSafePath(rawPath) {
  if (!rawPath) return "";
  let p = String(rawPath).replace(/\\/g, '/');
  if (p.startsWith('GameManagerConfig') && baseDir) {
    p = baseDir + '/' + p; if (!p.startsWith('/')) p = '/' + p; return 'file://' + encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F');
  } else if (p.startsWith('~') && baseDir) {
    p = p.replace('~/GameAppBuild', baseDir); if (p.startsWith('~')) p = baseDir + p.substring(1); if (!p.startsWith('/')) p = '/' + p; return 'file://' + encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F');
  }
  if (p.startsWith('/') || /^[a-zA-Z]:\//.test(p)) return 'file://' + encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F');
    return encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

function getBtn(icon) { const iconPath = convertSafePath('assets/gamepad_icons/' + icon + '.png'); return `<span class="gp-btn-masked" style="-webkit-mask-image: url('${iconPath}');"></span>`; }
function getMappedBtn(logicalBtn) {
  const layout = audioCfg.gamepadLayout || "XBOX"; let iconName = logicalBtn;
  if (layout === "XBOX") { const map = { 'SOUTH': 'XBOX_A', 'EAST': 'XBOX_B', 'WEST': 'XBOX_X', 'NORTH': 'XBOX_Y', 'START': 'XBOX_start', 'SELECT': 'XBOX_select' }; if (map[logicalBtn]) iconName = map[logicalBtn]; }
  else if (layout === "PS") { const map = { 'SOUTH': 'playstation_X', 'EAST': 'playstation_circle', 'WEST': 'playstation_square', 'NORTH': 'playstation_triangle', 'START': 'playstation_start', 'SELECT': 'playstation_select' }; if (map[logicalBtn]) iconName = map[logicalBtn]; }
  else if (layout === "N") { const map = { 'SOUTH': 'switch_b.300dpi', 'EAST': 'switch_a.300dpi', 'WEST': 'switch_y.300dpi', 'NORTH': 'switch_x.300dpi', 'START': 'switch_plus.300dpi', 'SELECT': 'switch_minus.300dpi' }; if (map[logicalBtn]) iconName = map[logicalBtn]; }
  return getBtn(iconName);
}
function renderHardwareIcons() {
  const startF = document.getElementById('start-footer'); if (startF) startF.innerHTML = `${getBtn('dpad_up')}${getBtn('dpad_down')} Navigate &nbsp;&nbsp;&nbsp; ${getMappedBtn('SOUTH')} Select &nbsp;&nbsp;&nbsp; ${getMappedBtn('START')} Menu`;
  const mainF = document.getElementById('main-footer'); if (mainF) mainF.innerHTML = `${getBtn('dpad_up')}${getBtn('dpad_down')}${getBtn('L1')}${getBtn('R1')} Navigate &nbsp;&nbsp; ${getBtn('dpad_left')}${getBtn('dpad_right')} Page &nbsp;&nbsp; ${getMappedBtn('SOUTH')} Play &nbsp;&nbsp; ${getMappedBtn('EAST')} Back &nbsp;&nbsp; ${getMappedBtn('WEST')} Media &nbsp;&nbsp; ${getMappedBtn('NORTH')} Search &nbsp;&nbsp; ${getMappedBtn('SELECT')} Options &nbsp;&nbsp; ${getBtn('L3')}${getBtn('R3')} Music`;
  const prmpt = document.getElementById('mini-prompt'); if (prmpt) prmpt.innerHTML = `Press ${getMappedBtn('WEST')} for Trailer`;
  const ssA = document.getElementById('ss-btn-a'); if (ssA) ssA.innerHTML = getMappedBtn('SOUTH'); const ssY = document.getElementById('ss-btn-y'); if (ssY) ssY.innerHTML = getMappedBtn('NORTH'); const ssX = document.getElementById('ss-btn-x'); if (ssX) ssX.innerHTML = getMappedBtn('WEST');
}

async function initAudio() {
  let rawCfg = await window.api.getAudioConfig();
  if (rawCfg) { audioCfg.bgm = rawCfg.bgm !== undefined ? rawCfg.bgm : true; audioCfg.sfx = rawCfg.sfx !== undefined ? rawCfg.sfx : true; audioCfg.vol = rawCfg.vol !== undefined ? rawCfg.vol : 0.3; audioCfg.bgm_mode = rawCfg.bgm_mode !== undefined ? rawCfg.bgm_mode : "JAZZ"; audioCfg.screensaver = rawCfg.screensaver !== undefined ? rawCfg.screensaver : "CN WALLPAPERS"; audioCfg.screensaverDelay = rawCfg.screensaverDelay !== undefined ? rawCfg.screensaverDelay : 3; audioCfg.gamepadLayout = rawCfg.gamepadLayout !== undefined ? rawCfg.gamepadLayout : "XBOX"; audioCfg.wakeMethod = rawCfg.wakeMethod !== undefined ? rawCfg.wakeMethod : "START + SELECT"; if (rawCfg.theme && THEMES[rawCfg.theme]) { activeTheme = rawCfg.theme; audioCfg.theme = rawCfg.theme; } audioCfg.startScreenMode = rawCfg.startScreenMode || 'CAROUSEL'; }
  baseDir = await window.api.getBaseDir();
  const bp = `assets/sounds`;
  sfxNav = new Audio(`${bp}/nav.wav`); sfxSelect = new Audio(`${bp}/select.wav`); sfxBack = new Audio(`${bp}/back.wav`);
  bgmAudio.addEventListener('ended', handleBgmEnded);
}
async function applyBgmMode() { if (!hasBooted) return; bgmAudio.pause(); if (!audioCfg.bgm || audioCfg.bgm_mode === "OFF") return; bgmAudio.volume = audioCfg.vol; if (audioCfg.bgm_mode === "CUSTOM") { isCustom = true; customPlaylist = await window.api.getCustomMusic(); if (customPlaylist.length > 0) { customPlaylist.sort(() => Math.random() - 0.5); customIndex = 0; if (!isVideoActive()) playNextCustom(); } } else { isCustom = false; const stdPath = await window.api.getStandardBgm(audioCfg.bgm_mode); if (stdPath) { bgmAudio.src = stdPath; bgmAudio.loop = true; if (!isVideoActive()) bgmAudio.play().catch(e=>{}); } } }

function showNowPlaying(path) {
  const widget = document.getElementById('now-playing-widget'); if (!widget) return;
  window.api.getAudioMetadata(path).then(track => {
    document.getElementById('np-title').innerText = track.title;
    document.getElementById('np-artist').innerText = track.artist;
    const cover = document.getElementById('np-cover');
    if (track.cover) { cover.src = track.cover; cover.style.display = 'block'; }
    else { cover.style.display = 'none'; }
    widget.classList.remove('hidden'); widget.style.transform = 'translateY(0)';
    clearTimeout(npTimeout);
    npTimeout = setTimeout(() => { widget.style.transform = 'translateY(50px)'; setTimeout(() => widget.classList.add('hidden'), 500); }, 6000);
  });
}

function playNextCustom(forcePrev = false) {
  if (!hasBooted || customPlaylist.length === 0) return;
  if (forcePrev) { customIndex = customIndex - 2; if (customIndex < 0) customIndex = customPlaylist.length - 1; }
  if (customIndex >= customPlaylist.length) { customPlaylist.sort(() => Math.random() - 0.5); customIndex = 0; }
  const p = customPlaylist[customIndex++];
  bgmAudio.src = p; bgmAudio.loop = false;
  window.manualBgmPause = false;
  if (!isVideoActive()) { bgmAudio.play().catch(e=>{}); showNowPlaying(p); }
}

function handleBgmEnded() { if (isCustom) playNextCustom(); }
function playSound(snd) { if (hasBooted && snd && audioCfg.sfx) { snd.currentTime = 0; snd.play().catch(e => {}); } }
function fadeBGM(targetVolume) { clearInterval(bgmFadeInterval); if (!audioCfg.bgm || !hasBooted) { bgmAudio.volume = 0; bgmAudio.pause(); return; } let vol = bgmAudio.volume; const step = (targetVolume - vol) / 20; let ticks = 0; bgmFadeInterval = setInterval(() => { ticks++; let n = bgmAudio.volume + step; if (n > 1) n = 1; if (n < 0) n = 0; bgmAudio.volume = n; if (ticks >= 20) { bgmAudio.volume = targetVolume; clearInterval(bgmFadeInterval); if (targetVolume === 0) bgmAudio.pause(); } }, 50); }

function resetIdleTimer() { clearTimeout(idleTimer); if (audioCfg.screensaver !== 'OFF' && hasBooted && gameState !== 'SPLASH' && gameState !== 'SCREENSAVER') { idleTimer = setTimeout(startScreensaver, audioCfg.screensaverDelay * 60000); } }

// GLOBAL CLOCK ENGINE
function updateGlobalClock() {
  const now = new Date(); let h = now.getHours(), m = now.getMinutes(); const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; h = h ? h : 12; m = m < 10 ? '0' + m : m;
  const clk = document.getElementById('global-clock');
  if (clk) { clk.innerText = h + ':' + m + ' ' + ampm; clk.style.display = (gameState === 'SCREENSAVER') ? 'none' : 'block'; }
}
setInterval(updateGlobalClock, 1000); updateGlobalClock();

function updateSSClock() { const now = new Date(); let h = now.getHours(), m = now.getMinutes(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12; h = h ? h : 12; m = m < 10 ? '0' + m : m; const clk = document.getElementById('ss-clock'); if (clk) clk.innerText = h + ':' + m + ' ' + ampm; }

// --- SCREENSAVER LOGIC ---
function startScreensaver() {
  if (gameState === 'SCREENSAVER' || gameState === 'SPLASH') return;
  if (gameState === 'START' || gameState === 'MAIN') previousGameState = gameState;
  gameState = 'SCREENSAVER';
  screensaverStartTime = Date.now();
  document.getElementById('screensaver-backdrop').classList.remove('hidden');
  updateSSClock(); ssClockInterval = setInterval(updateSSClock, 10000);
  if (audioCfg.screensaver === 'CN WALLPAPERS') playRandomWallpaper(); else playRandomScreenshot();
}

function updateSSUI(game) { if (!game) return; document.getElementById('ss-game-title').innerText = game.Game; const scL = document.getElementById('ss-lbl-y'); scL.style.color = (game.FAV === 'YES') ? 'var(--accent)' : 'var(--text_sec)'; const wtL = document.getElementById('ss-lbl-x'); wtL.style.color = (game.WANT_TO_PLAY === 'YES') ? 'var(--accent)' : 'var(--text_sec)'; const storeContainer = document.getElementById('ss-store-icons'); storeContainer.innerHTML = ''; if (game.Store && String(game.Store).trim() !== "") { const stores = String(game.Store).split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(s => s !== ""); stores.forEach(s => { const div = document.createElement('div'); div.className = 'store-icon'; const path = convertSafePath('assets/logos/' + s + '.png'); div.style.webkitMaskImage = `url('${path}')`; storeContainer.appendChild(div); }); } }

async function playRandomWallpaper() {
  if (gameState !== 'SCREENSAVER') return; document.getElementById('ss-video').style.display = 'none';
  const bottomRow = document.getElementById('ss-bottom-row'); if (bottomRow) bottomRow.style.display = 'none';
  if (availableWallpapers.length === 0) availableWallpapers = await window.api.getWallpapers();
  const img = document.getElementById('ss-image'); img.style.display = 'block';
  if (availableWallpapers && availableWallpapers.length > 0) { let wp = availableWallpapers[Math.floor(Math.random() * availableWallpapers.length)]; img.src = wp; }
  clearTimeout(screensaverInterval); screensaverInterval = setTimeout(playRandomWallpaper, 8000);
}

function playRandomScreenshot() {
  if (gameState !== 'SCREENSAVER') return; document.getElementById('ss-video').style.display = 'none';
  const bottomRow = document.getElementById('ss-bottom-row'); if (bottomRow) bottomRow.style.display = 'flex';
  const img = document.getElementById('ss-image'); img.style.display = 'block';
  if (availableScreenshots.length > 0) { let data = availableScreenshots[Math.floor(Math.random() * availableScreenshots.length)]; currentSSGame = data.game; updateSSUI(data.game); img.src = convertSafePath(data.path); }
  clearTimeout(screensaverInterval); screensaverInterval = setTimeout(playRandomScreenshot, 8000);
}

function stopScreensaver() { gameState = previousGameState; document.getElementById('screensaver-backdrop').classList.add('hidden'); const v = document.getElementById('ss-video'); v.pause(); v.removeAttribute('src'); clearTimeout(screensaverInterval); clearInterval(ssClockInterval); if (!isVideoActive() && audioCfg.bgm && audioCfg.bgm_mode !== 'OFF') bgmAudio.play().catch(e=>{}); resetIdleTimer(); }

function handleSSAction(action) {
  if (audioCfg.screensaver === 'CN WALLPAPERS' || !currentSSGame) return stopScreensaver();
  if (action === 'LAUNCH') { const cmd = currentSSGame.LaunchCommand; if (cmd) { stopScreensaver(); enterSleepMode(currentSSGame); } else { stopScreensaver(); } }
  else if (action === 'FAV') { playSound(sfxSelect); currentSSGame.FAV = currentSSGame.FAV === "YES" ? "NO" : "YES"; window.api.saveDbField({game: currentSSGame.Game, field: 'FAV', value: currentSSGame.FAV}); updateSSUI(currentSSGame); if (gameState === 'MAIN') updateGameSelection(); }
  else if (action === 'WANT') { playSound(sfxSelect); currentSSGame.WANT_TO_PLAY = currentSSGame.WANT_TO_PLAY === "YES" ? "NO" : "YES"; window.api.saveDbField({game: currentSSGame.Game, field: 'WANT_TO_PLAY', value: currentSSGame.WANT_TO_PLAY}); updateSSUI(currentSSGame); if (gameState === 'MAIN') updateGameSelection(); }
}

function setDebug(msg, show = true) { const dbg = document.getElementById('media-debug'); if(dbg){ dbg.innerText = msg; dbg.style.display = show ? "block" : "none"; } }

async function boot() {
  updateAppScale(); await initAudio(); applyTheme(activeTheme); renderHardwareIcons();
  const recSetting = await window.api.getSetting('recent_games_count'); if (recSetting !== null) { recentGamesCount = parseInt(recSetting, 10); }
  const res = await window.api.getGames(); allGames = (res.games || []).filter(g => g.Game && String(g.Game).trim() !== "");
  for (let g of allGames) { if (g.Screenshot && String(g.Screenshot).trim() !== "") { let paths = String(g.Screenshot).split('|').filter(s => s.trim() !== ""); paths.forEach(p => availableScreenshots.push({ path: p, game: g })); } }
  let prog = 0; const bar = document.getElementById('splash-bar'); const txt = document.getElementById('splash-text');
  const l = setInterval(() => { prog += 2; bar.style.width = `${prog}%`; if (prog === 30) txt.innerText = "GRINDING..."; if (prog === 60) txt.innerText = "BREWING..."; if (prog >= 100) { clearInterval(l); document.querySelector('.splash-logo').classList.add('boot-anim'); setTimeout(() => { hasBooted = true; transitionToStart(); applyBgmMode(); resetIdleTimer(); }, 800); } }, 30);
  requestAnimationFrame(pollGamepad); window.api.onDownloadProgress(updateDownloadProgressBar); window.api.onScrapeProgress(updateScrapeProgressBar);
}

let inputDebounce = false; let navRepeatDelay = 180; let lastSelectionTime = 0; let wakeHoldFrames = 0;

function enterSleepMode(game) {
  document.body.style.backgroundColor = 'var(--text_sec)';
  setTimeout(() => { document.body.style.backgroundColor = '#000000'; }, 150);
  gameState = 'GAME_RUNNING'; wakeHoldFrames = 0; clearMediaLoaders(); fadeBGM(0);

  const sleepScreen = document.getElementById('sleep-screen'); const sleepCover = document.getElementById('sleep-cover'); const sleepTitle = document.getElementById('sleep-title'); const sleepInst = document.getElementById('sleep-instruction');
  if (game.CoverArt && game.CoverArt.trim() !== "") { sleepCover.src = convertSafePath(game.CoverArt); sleepCover.style.display = 'block'; } else { sleepCover.style.display = 'none'; }
  sleepTitle.innerText = game.Game;
  let instructionText = audioCfg.wakeMethod || "START + SELECT";
  if (instructionText.includes("HOLD")) instructionText = `Hold [${instructionText.replace(" (HOLD 2 SEC)", "")}] for 2 Seconds`; else instructionText = `Press [${instructionText}]`;
  sleepInst.innerText = `${instructionText} to return to CREMA`;
  sleepScreen.classList.remove('hidden');

  window.api.updateLastPlayed(game.Game).then(() => { refreshDatabase(); });
  window.api.launchGame(game.LaunchCommand);
}

function wakeUpCrema() {
  playSound(sfxSelect); gameState = 'MAIN'; document.body.style.backgroundColor = 'var(--bg)';
  document.getElementById('sleep-screen').classList.add('hidden');
  updateGameSelection(); window.api.forceFocus();
}

function pollGamepad() {
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  const gp = pads.find(g => g && g.buttons && g.buttons.length > 0);

  if (gameState === 'GAME_RUNNING') {
    if (gp) {
      const st = gp.buttons[9]?.pressed; const sel = gp.buttons[8]?.pressed; const l1 = gp.buttons[4]?.pressed; const r1 = gp.buttons[5]?.pressed; const l3 = gp.buttons[10]?.pressed; const r3 = gp.buttons[11]?.pressed;
      let comboMatched = false; const method = audioCfg.wakeMethod || "START + SELECT";
      if (method.includes("L1 + R1 + START + SELECT")) { comboMatched = l1 && r1 && st && sel; } else if (method.includes("L3 + R3")) { comboMatched = l3 && r3; } else { comboMatched = st && sel; }
      if (comboMatched) { if (method.includes("HOLD 2 SEC")) { wakeHoldFrames++; if (wakeHoldFrames >= 120) { wakeHoldFrames = 0; wakeUpCrema(); } } else { wakeHoldFrames = 0; wakeUpCrema(); } } else { wakeHoldFrames = 0; }
    }
    requestAnimationFrame(pollGamepad); return;
  }

  // Screensaver input is checked outside the debounce gate so the first button press always works.
  // A 300ms cooldown after start prevents the button that triggered the screensaver from
  // immediately dismissing it (e.g. holding A on "VIEW SCREENSAVER NOW").
  if (gp && gameState === 'SCREENSAVER') {
    if (Date.now() - screensaverStartTime >= 300) {
      const a = gp.buttons[0]?.pressed, x = gp.buttons[2]?.pressed, yBtn = gp.buttons[3]?.pressed;
      const anyBtn = Array.from(gp.buttons).some(b => b?.pressed);
      if (anyBtn) {
        inputDebounce = true; setTimeout(() => { inputDebounce = false; }, 180);
        if (a) handleSSAction('LAUNCH'); else if (yBtn) handleSSAction('FAV'); else if (x) handleSSAction('WANT'); else stopScreensaver();
      }
    }
    requestAnimationFrame(pollGamepad); return;
  }

  if (gp && !inputDebounce) {
    const a = gp.buttons[0]?.pressed, b = gp.buttons[1]?.pressed, x = gp.buttons[2]?.pressed, yBtn = gp.buttons[3]?.pressed;
    const selBtn = gp.buttons[8]?.pressed, st = gp.buttons[9]?.pressed, l1 = gp.buttons[4]?.pressed, r1 = gp.buttons[5]?.pressed;
    const l2 = gp.buttons[6]?.pressed, r2 = gp.buttons[7]?.pressed; const l3 = gp.buttons[10]?.pressed, r3 = gp.buttons[11]?.pressed;
    const u = gp.buttons[12]?.pressed || (gp.axes && gp.axes[1] < -0.5); const d = gp.buttons[13]?.pressed || (gp.axes && gp.axes[1] > 0.5);
    const l = gp.buttons[14]?.pressed || (gp.axes && gp.axes[0] < -0.5); const r = gp.buttons[15]?.pressed || (gp.axes && gp.axes[0] > 0.5);

    if (u || d || l || r || a || b || x || yBtn || selBtn || st || l1 || r1 || l2 || r2 || l3 || r3) {
      inputDebounce = true; setTimeout(() => { inputDebounce = false; }, navRepeatDelay);
      if (u || d || l || r || l1 || r1) { navRepeatDelay = Math.max(40, navRepeatDelay - 35); } else { navRepeatDelay = 180; }
      try {
        if (l3) handleInput('L3'); else if (r3) handleInput('R3'); else if (l2) handleInput('L2'); else if (r2) handleInput('R2');
        else {
          resetIdleTimer();
          if (u) handleInput('UP'); else if (d) handleInput('DOWN'); else if (l) handleInput('LEFT'); else if (r) handleInput('RIGHT');
          else if (a) handleInput('ACCEPT'); else if (b) handleInput('BACK'); else if (x) handleInput('X_BUTTON'); else if (yBtn) handleInput('Y_BUTTON');
          else if (selBtn) handleInput('SELECT_BTN'); else if (st) handleInput('START'); else if (l1) handleInput('L1'); else if (r1) handleInput('R1');
        }
      } catch (err) { setDebug("ERR: " + err.message, true); }
    }
  } else if (gp && inputDebounce) {
    if ((!gp.axes || (Math.abs(gp.axes[1]) < 0.2 && Math.abs(gp.axes[0]) < 0.2)) && !gp.buttons[12]?.pressed && !gp.buttons[13]?.pressed && !gp.buttons[14]?.pressed && !gp.buttons[15]?.pressed && !gp.buttons[0]?.pressed && !gp.buttons[1]?.pressed && !gp.buttons[2]?.pressed && !gp.buttons[3]?.pressed && !gp.buttons[8]?.pressed && !gp.buttons[9]?.pressed && !gp.buttons[4]?.pressed && !gp.buttons[5]?.pressed && !gp.buttons[6]?.pressed && !gp.buttons[7]?.pressed && !gp.buttons[10]?.pressed && !gp.buttons[11]?.pressed) {
      inputDebounce = false; navRepeatDelay = 180;
    }
  }
  requestAnimationFrame(pollGamepad);
}

window.addEventListener('keydown', (e) => {
  try {
    if (gameState === 'GAME_RUNNING') { if (e.key === 'Escape' || e.key === 'Backspace') wakeUpCrema(); return; }
    if (gameState === 'SCREENSAVER') { if (e.key === 'Enter') handleSSAction('LAUNCH'); else if (e.key === 'y' || e.key === 'Y') handleSSAction('FAV'); else if (e.key === 'x' || e.key === 'X') handleSSAction('WANT'); else stopScreensaver(); }
    else {
      resetIdleTimer();
      if (e.key === 'ArrowUp') handleInput('UP'); else if (e.key === 'ArrowDown') handleInput('DOWN'); else if (e.key === 'ArrowLeft') handleInput('LEFT'); else if (e.key === 'ArrowRight') handleInput('RIGHT');
      else if (e.key === 'Enter' || e.key === ' ') handleInput('ACCEPT'); else if (e.key === 'Escape' || e.key === 'Backspace') handleInput('BACK');
      else if (e.key === 'x' || e.key === 'X') handleInput('X_BUTTON'); else if (e.key === 'y' || e.key === 'Y') handleInput('Y_BUTTON');
      else if (e.key === 'Tab') handleInput('SELECT_BTN'); else if (e.key === 'm' || e.key === 'M') handleInput('START');
      else if (e.key === 'PageUp') handleInput('L1'); else if (e.key === 'PageDown') handleInput('R1');
      else if (e.key === '[' || e.key === ',') handleInput('L3'); else if (e.key === ']' || e.key === '.') handleInput('R3');
    }
  } catch (err) { setDebug("ERR: " + err.message, true); }
});

function jumpPages(direction) {
  const count = filteredGames.length; if (count === 0) return;
  if (direction === "R1") { currentGameIndex = Math.min(currentGameIndex + 10, count - 1); } else { currentGameIndex = Math.max(currentGameIndex - 10, 0); }
  playSound(sfxNav); updateGameSelection();
}

function handleInput(action) {
  if (action === 'L3' && isCustom && audioCfg.bgm && audioCfg.bgm_mode === "CUSTOM") { if (bgmAudio.currentTime > 3) { bgmAudio.currentTime = 0; } else { playNextCustom(true); } return; }
  if (action === 'R3' && isCustom && audioCfg.bgm && audioCfg.bgm_mode === "CUSTOM") { playNextCustom(); return; }

  if (audioCfg.bgm && bgmAudio.paused && bgmAudio.src !== "" && gameState !== 'SPLASH' && audioCfg.bgm_mode !== "OFF" && !isVideoActive() && !window.manualBgmPause) { bgmAudio.volume = audioCfg.vol; bgmAudio.play().catch(e=>{}); } else if (isVideoActive() && !bgmAudio.paused) { bgmAudio.pause(); }
  if (gameState === 'SPLASH' || gameState === 'PROGRESS') return;

  if (gameState === 'START') {
    const _mode = audioCfg.startScreenMode || 'STATIC'; if (_mode === 'CAROUSEL') { if (action === 'LEFT' || action === 'UP') { playSound(sfxNav); navigateCarousel('left'); } else if (action === 'RIGHT' || action === 'DOWN') { playSound(sfxNav); navigateCarousel('right'); } else if (action === 'ACCEPT') { playSound(sfxSelect); transitionToMain(); } else if (action === 'START') openOverlay("MAIN_MENU"); } else if (_mode === 'GRID') { if (action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT') { playSound(sfxNav); navigateGrid(action); } else if (action === 'ACCEPT') { playSound(sfxSelect); transitionToMain(); } else if (action === 'START') openOverlay("MAIN_MENU"); } else { if (action === 'DOWN') { currentCategoryIndex = (currentCategoryIndex + 1) % categories.length; playSound(sfxNav); updateCategorySelection(); } else if (action === 'UP') { currentCategoryIndex = (currentCategoryIndex - 1 + categories.length) % categories.length; playSound(sfxNav); updateCategorySelection(); } else if (action === 'ACCEPT') { playSound(sfxSelect); transitionToMain(); } else if (action === 'BACK') { /* Disabled */ } else if (action === 'START') openOverlay("MAIN_MENU"); }
  }
  else if (gameState === 'MAIN') {
    if (filteredGames.length === 0 && action !== 'BACK' && action !== 'LEFT' && action !== 'RIGHT' && action !== 'START' && action !== 'Y_BUTTON') return;
    if (action === 'DOWN') { currentGameIndex = (currentGameIndex + 1) % filteredGames.length; playSound(sfxNav); updateGameSelection(); } else if (action === 'UP') { currentGameIndex = (currentGameIndex - 1 + filteredGames.length) % filteredGames.length; playSound(sfxNav); updateGameSelection(); } else if (action === 'L1' || action === 'R1') { jumpPages(action); } else if (action === 'L2') { currentGameIndex = 0; playSound(sfxNav); updateGameSelection(); } else if (action === 'R2') { currentGameIndex = Math.max(0, filteredGames.length - 1); playSound(sfxNav); updateGameSelection(); } else if (action === 'LEFT') { currentCategoryIndex = (currentCategoryIndex - 1 + categories.length) % categories.length; playSound(sfxNav); transitionToMain(); } else if (action === 'RIGHT') { currentCategoryIndex = (currentCategoryIndex + 1) % categories.length; playSound(sfxNav); transitionToMain(); } else if (action === 'BACK') { playSound(sfxBack); transitionToStart(); } else if (action === 'START') { openOverlay("MAIN_MENU"); } else if (action === 'SELECT_BTN') { openOverlay("GAME_MENU"); } else if (action === 'Y_BUTTON') { openOSK('SEARCH', 'GLOBAL SEARCH', searchQuery); }
    else if (action === 'X_BUTTON') {
      if (gameHasTrailer) { playSound(sfxSelect); mediaSwapped = !mediaSwapped; const md = document.getElementById('media-container'), mn = document.getElementById('mini-dock'), v = document.getElementById('video-player'), s = document.getElementById('screenshot-player'), wp = !v.paused; if (mediaSwapped) { md.appendChild(s); mn.appendChild(v); } else { md.appendChild(v); mn.appendChild(s); } if (wp) v.play().catch(e=>{}); }
      else openSearchOverlay();
    }
    else if (action === 'ACCEPT') { playSound(sfxSelect); const cmd = filteredGames[currentGameIndex].LaunchCommand; if (cmd) { enterSleepMode(filteredGames[currentGameIndex]); } }
  }
  else if (gameState === 'OSK') { handleOSKInput(action); }
  else if (gameState === 'JUKEBOX' || gameState === 'JUKEBOX_OVERLAY') { handleJukeboxInput(action); }
  else if (['OVERLAY', 'THEME_CATS', 'THEMES', 'MUSIC_STYLE', 'GAME_SCRAPE_MENU', 'CONFIRM_SCRAPE', 'SCRAPE_RESULT', 'GAMEPAD_MENU', 'WAKE_METHOD_MENU', 'START_SCREEN_MENU'].includes(gameState)) {
    if (action === 'DOWN') { currentOverlayIndex = nextOverlayIndex(currentOverlayIndex, 1); playSound(sfxNav); updateOverlaySelection(); } else if (action === 'UP') { currentOverlayIndex = nextOverlayIndex(currentOverlayIndex, -1); playSound(sfxNav); updateOverlaySelection(); }
    else if (action === 'BACK') {
      if (gameState === 'THEMES') openThemeCategoryMenu(); else if (gameState === 'THEME_CATS') openOverlay("MAIN_MENU"); else if (gameState === 'MUSIC_STYLE') openSoundOverlay(); else if (gameState === 'GAMEPAD_MENU' || gameState === 'WAKE_METHOD_MENU') openOverlay("MAIN_MENU"); else if (gameState === 'START_SCREEN_MENU') openOverlay("MAIN_MENU");
      else if (gameState === 'GAME_SCRAPE_MENU' || gameState === 'SCRAPE_RESULT') openOverlay("GAME_MENU");
      else if (gameState === 'CONFIRM_SCRAPE') openGameScrapeMenu();
      else if (currentOverlayType === 'STEAM_MATCH_SELECTOR' || currentOverlayType === 'STEAM_SEARCH_FAILED') { closeOverlay(); openGameScrapeMenu(); }
      else if (currentOverlayType === 'CONFIRM_QUIT' || currentOverlayType === 'ABOUT_CREMA') { openOverlay("MAIN_MENU"); }
      else if (currentOverlayType === 'HISTORY_MENU' || currentOverlayType === 'HISTORY_CLEARED') { openOverlay("MAIN_MENU"); }
      else closeOverlay();
    }
    else if (action === 'ACCEPT') {
      if (gameState === 'GAME_SCRAPE_MENU') executeGameScrapeAction();
      else if (gameState === 'CONFIRM_SCRAPE') executeConfirmScrapeAction();
      else if (gameState === 'SCRAPE_RESULT') openOverlay("GAME_MENU");
      else executeOverlayAction();
    }
  }
  else if (gameState === 'SGDB_GRID') {
    if (sgdbResults.length === 0 && action !== 'BACK') return;
    if (action === 'LEFT') { sgdbIndex = Math.max(0, sgdbIndex - 1); playSound(sfxNav); renderSgdbGrid(); } else if (action === 'RIGHT') { sgdbIndex = Math.min(sgdbResults.length - 1, sgdbIndex + 1); playSound(sfxNav); renderSgdbGrid(); } else if (action === 'UP') { sgdbIndex = Math.max(0, sgdbIndex - 4); playSound(sfxNav); renderSgdbGrid(); } else if (action === 'DOWN') { sgdbIndex = Math.min(sgdbResults.length - 1, sgdbIndex + 4); playSound(sfxNav); renderSgdbGrid(); }
    else if (action === 'BACK') { playSound(sfxBack); document.getElementById('sgdb-backdrop').classList.add('hidden'); openGameScrapeMenu(); }
    else if (action === 'ACCEPT') { playSound(sfxSelect); executeSgdbApply(); }
  }
  else if (gameState === 'SCREENSAVER_MENU') {
    if (action === 'DOWN') { currentOverlayIndex = (currentOverlayIndex + 1) % overlayItems.length; playSound(sfxNav); renderScreensaverMenu(); } else if (action === 'UP') { currentOverlayIndex = (currentOverlayIndex - 1 + overlayItems.length) % overlayItems.length; playSound(sfxNav); renderScreensaverMenu(); } else if (action === 'LEFT' || action === 'RIGHT') handleScreensaverMenuHorizontal(action); else if (action === 'BACK') { playSound(sfxBack); openOverlay("MAIN_MENU"); } else if (action === 'ACCEPT') executeScreensaverMenuAction();
  }
  else if (gameState === 'KEYBINDINGS') { if (action === 'BACK' || action === 'ACCEPT') closeKeybindingsOverlay(); }
  else if (gameState === 'SEARCH') {
    if (searchResults.length === 0 && action !== 'BACK') return;
    if (action === 'DOWN') { currentSearchIndex = (currentSearchIndex + 1) % searchResults.length; playSound(sfxNav); updateSearchSelection(); } else if (action === 'UP') { currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length; playSound(sfxNav); updateSearchSelection(); } else if (action === 'BACK') closeSearchOverlay(); else if (action === 'ACCEPT') executeSearchAction();
  }
  else if (gameState === 'SOUND') {
    if (action === 'DOWN') { currentOverlayIndex = (currentOverlayIndex + 1) % overlayItems.length; playSound(sfxNav); renderSoundMenu(); } else if (action === 'UP') { currentOverlayIndex = (currentOverlayIndex - 1 + overlayItems.length) % overlayItems.length; playSound(sfxNav); renderSoundMenu(); } else if (action === 'LEFT' || action === 'RIGHT') handleSoundHorizontal(action); else if (action === 'BACK') closeSoundOverlay(); else if (action === 'ACCEPT') executeSoundAction();
  }
  else if (gameState === 'SCRAPE') {
    if (action === 'DOWN') { currentOverlayIndex = (currentOverlayIndex + 1) % overlayItems.length; playSound(sfxNav); updateScrapeSelection(); } else if (action === 'UP') { currentOverlayIndex = (currentOverlayIndex - 1 + overlayItems.length) % overlayItems.length; playSound(sfxNav); updateScrapeSelection(); } else if (action === 'BACK') closeScrapeOverlay(); else if (action === 'ACCEPT') executeScrapeAction();
  }
}
function openOSK(mode, title, initialVal) {
  gameState = 'OSK'; playSound(sfxSelect); oskR = 0; oskC = 0; oskMode = mode;
  if (mode === 'SEARCH') searchQuery = initialVal || ""; else tempOskString = initialVal || "";
  document.getElementById('osk-title').innerText = title; setBlur(true); document.getElementById('osk-backdrop').classList.remove('hidden'); renderOSK();
}
function closeOSK() { playSound(sfxBack); document.getElementById('osk-backdrop').classList.add('hidden'); gameState = 'MAIN'; setBlur(false); }
function renderOSK() {
  let targetStr = oskMode === 'SEARCH' ? searchQuery : tempOskString; document.getElementById('osk-query').innerText = targetStr + (targetStr.length < 50 ? "_" : "");
  const grid = document.getElementById('osk-grid'); grid.innerHTML = '';
  for(let r=0; r<OSK_ROWS; r++) {
    for(let c=0; c<OSK_COLS; c++) {
      const key = oskKeys[r][c]; const div = document.createElement('div'); div.innerText = key;
      div.style.padding = "15px 5px"; div.style.fontSize = "24px"; div.style.fontWeight = "bold"; div.style.borderRadius = "8px"; div.style.color = "var(--text_sec)"; div.style.backgroundColor = "var(--bg_panel)";
      if (r === oskR && c === oskC) { div.style.backgroundColor = "var(--accent)"; div.style.color = "var(--bg)"; div.style.transform = "scale(1.1)"; div.style.boxShadow = "0 0 15px var(--accent)"; }
      grid.appendChild(div);
    }
  }
}
function handleOSKInput(action) {
  if (action === 'UP') { oskR = (oskR - 1 + OSK_ROWS) % OSK_ROWS; playSound(sfxNav); renderOSK(); } else if (action === 'DOWN') { oskR = (oskR + 1) % OSK_ROWS; playSound(sfxNav); renderOSK(); } else if (action === 'LEFT') { oskC = (oskC - 1 + OSK_COLS) % OSK_COLS; playSound(sfxNav); renderOSK(); } else if (action === 'RIGHT') { oskC = (oskC + 1) % OSK_COLS; playSound(sfxNav); renderOSK(); }
  else if (action === 'BACK' || action === 'START') {
    if (oskMode === 'SEARCH') closeOSK();
    else if (oskMode === 'LAUNCH_CMD' || oskMode === 'RENAME_GAME') { playSound(sfxBack); document.getElementById('osk-backdrop').classList.add('hidden'); openOverlay('GAME_MENU'); }
    else if (oskMode === 'SGDB_API' || oskMode === 'REFINE_SEARCH') { playSound(sfxBack); document.getElementById('osk-backdrop').classList.add('hidden'); openGameScrapeMenu(); }
    else if (oskMode === 'NEW_PLAYLIST' || oskMode === 'NEW_PLAYLIST_ADD' || oskMode === 'JB_SEARCH' || oskMode === 'RENAME_PLAYLIST') { playSound(sfxBack); document.getElementById('osk-backdrop').classList.add('hidden'); gameState = 'JUKEBOX'; }
  }
  else if (action === 'Y_BUTTON') {
    if (oskMode === 'SEARCH') searchQuery = "";
    else if (oskMode === 'JB_SEARCH') { jbSearchQuery = ""; renderJbList(); }
    else tempOskString = "";
    playSound(sfxBack); if (oskMode === 'SEARCH') applyLiveFilters(false); renderOSK();
  }
  else if (action === 'ACCEPT') {
    playSound(sfxSelect); const key = oskKeys[oskR][oskC]; let targetStr = oskMode === 'SEARCH' ? searchQuery : (oskMode === 'JB_SEARCH' ? jbSearchQuery : tempOskString);
    if (key === 'SPACE') targetStr += " "; else if (key === 'BKSP') targetStr = targetStr.slice(0, -1); else if (key === 'CLEAR') targetStr = "";
    else if (key === 'DONE') {
      if (oskMode === 'SEARCH') { closeOSK(); return; }
      else if (oskMode === 'LAUNCH_CMD') { filteredGames[currentGameIndex].LaunchCommand = targetStr; window.api.saveDbField({game: filteredGames[currentGameIndex].Game, field: 'LaunchCommand', value: targetStr}); document.getElementById('osk-backdrop').classList.add('hidden'); refreshDatabase(); openOverlay('GAME_MENU'); return; }
      else if (oskMode === 'RENAME_GAME') { const oldName = filteredGames[currentGameIndex].Game; filteredGames[currentGameIndex].Game = targetStr; window.api.saveDbField({game: oldName, field: 'Game', value: targetStr}); document.getElementById('osk-backdrop').classList.add('hidden'); refreshDatabase(); openOverlay('GAME_MENU'); return; }
      else if (oskMode === 'SGDB_API') { window.api.setSetting('steamgriddb_api', targetStr).then(() => { document.getElementById('osk-backdrop').classList.add('hidden'); openSgdbOverlay(targetStr, selectedResolvedName, selectedAppId); }); return; }
      else if (oskMode === 'REFINE_SEARCH') { document.getElementById('osk-backdrop').classList.add('hidden'); document.getElementById('overlay-backdrop').classList.remove('hidden'); triggerSteamSearch(targetStr); return; }
      else if (oskMode === 'NEW_PLAYLIST') {
        if (targetStr && !jbPlaylists[targetStr]) {
          jbPlaylists[targetStr] = [];
          window.api.savePlaylists(jbPlaylists);
        }
        document.getElementById('osk-backdrop').classList.add('hidden');
        gameState = 'JUKEBOX';
        renderJbList();
        return;
      }
      else if (oskMode === 'NEW_PLAYLIST_ADD') {
        if(targetStr && !jbPlaylists[targetStr]) {
          jbPlaylists[targetStr] = [];
          if (currentOverlayType === 'JB_BATCH_ADD') {
            let tracksToAdd = [];
            if (jbActionTarget.type === 'ARTIST') {
              tracksToAdd = jbLibrary.filter(t => t.artist === jbActionTarget.name);
            } else if (jbActionTarget.type === 'ALBUM') {
              if (jbView === 'ARTIST_ALBUMS') {
                tracksToAdd = jbLibrary.filter(t => t.artist === jbActionTarget.artist && t.album === jbActionTarget.name);
              } else {
                tracksToAdd = jbLibrary.filter(t => t.album === jbActionTarget.name);
              }
            }
            tracksToAdd.forEach(t => { if (!jbPlaylists[targetStr].includes(t.path)) jbPlaylists[targetStr].push(t.path); });
          } else if (currentOverlayType === 'JB_SONG_OPTS') {
            jbPlaylists[targetStr].push(jbActionTarget.path);
          }
          window.api.savePlaylists(jbPlaylists);
        }
        document.getElementById('osk-backdrop').classList.add('hidden');
        gameState = 'JUKEBOX';
        renderJbList();
        return;
      }
      else if (oskMode === 'RENAME_PLAYLIST') { if(targetStr && targetStr !== jbActionTarget && !jbPlaylists[targetStr]) { jbPlaylists[targetStr] = [...jbPlaylists[jbActionTarget]]; delete jbPlaylists[jbActionTarget]; window.api.savePlaylists(jbPlaylists); } document.getElementById('osk-backdrop').classList.add('hidden'); gameState = 'JUKEBOX'; renderJbList(); return; }
      else if (oskMode === 'JB_SEARCH') { document.getElementById('osk-backdrop').classList.add('hidden'); gameState = 'JUKEBOX'; return; }
    }
    else if (key !== '' && key !== '-') targetStr += key;

    if (oskMode === 'SEARCH') { searchQuery = targetStr; applyLiveFilters(false); }
    else if (oskMode === 'JB_SEARCH') { jbSearchQuery = targetStr; renderJbList(); }
    else { tempOskString = targetStr; }
    renderOSK();
  }
}

function applyLiveFilters(preserveIndex = false) {
  const savedGame = preserveIndex && filteredGames[currentGameIndex] ? filteredGames[currentGameIndex].Game : null;
  const catName = categories[currentCategoryIndex]; const q = searchQuery.toLowerCase();

  let baseFiltered = allGames.filter(g => {
    const store = g.Store ? String(g.Store).toLowerCase() : ""; const title = g.Game ? String(g.Game).toLowerCase() : ""; let matchCat = false;
    if (catName === "ALL GAMES") matchCat = true; else if (catName === "STEAM") matchCat = store.includes("steam"); else if (catName === "GOG") matchCat = store.includes("gog"); else if (catName === "EPIC") matchCat = store.includes("epic"); else if (catName === "PHYSICAL") matchCat = store.includes("physical"); else if (catName === "EMULATION") matchCat = store.includes("emulation"); else if (catName === "AMAZON") matchCat = store.includes("amazon"); else if (catName === "APPS") matchCat = store.includes("apps"); else if (catName === "OTHERS") matchCat = store.includes("others"); else if (catName === "FAVS") matchCat = g.FAV === 'YES'; else if (catName === "WANT TO PLAY") matchCat = g.WANT_TO_PLAY === 'YES'; else if (catName === "PLAYABLE") matchCat = g.LaunchCommand && String(g.LaunchCommand).trim() !== "";
    if (!matchCat) return false; if (q !== "" && !title.includes(q)) return false; return true;
  });

    let recentGames = [];
    let regularGames = [...baseFiltered];

    if (recentGamesCount > 0) {
      let playedGames = baseFiltered.filter(g => g.LastPlayed && g.LastPlayed > 0).sort((a, b) => b.LastPlayed - a.LastPlayed);
      recentGames = playedGames.slice(0, recentGamesCount);

      const recentNames = new Set(recentGames.map(g => g.Game));
      regularGames = baseFiltered.filter(g => !recentNames.has(g.Game));

      numRecentInList = recentGames.length;
    } else {
      numRecentInList = 0;
    }

    filteredGames = [...recentGames, ...regularGames];

    if (preserveIndex && savedGame) {
      let newIdx = filteredGames.findIndex(g => g.Game === savedGame);
      currentGameIndex = newIdx !== -1 ? newIdx : 0;
    } else {
      currentGameIndex = 0;
    }

    renderGameList();
}

async function refreshDatabase() {
  const res = await window.api.getGames();
  allGames = res.games || [];

  availableScreenshots = [];
  for (let g of allGames) {
    if (g.Screenshot && String(g.Screenshot).trim() !== "") {
      let paths = String(g.Screenshot).split('|').filter(s => s.trim() !== "");
      paths.forEach(p => availableScreenshots.push({ path: p, game: g }));
    }
  }

  applyLiveFilters(true);
}

let previousGameState = 'START'; let currentOverlayType = 'MAIN_MENU';

function isOverlaySection(item) { return typeof item === 'string' && item.startsWith('§'); }
function nextOverlayIndex(from, dir) {
  const N = overlayItems.length; let idx = (from + dir + N) % N; let guard = 0;
  while (isOverlaySection(overlayItems[idx]) && guard++ < N) idx = (idx + dir + N) % N;
  return idx;
}
function renderGenericOverlay(title, items, hintText = "") {
  playSound(sfxSelect); const bd = document.getElementById('overlay-backdrop'); const tit = document.getElementById('overlay-title'); const lst = document.getElementById('overlay-list');
  lst.innerHTML = ''; tit.innerText = title; overlayItems = items;
  currentOverlayIndex = items.findIndex(it => !isOverlaySection(it));
  if (currentOverlayIndex < 0) currentOverlayIndex = 0;
  overlayItems.forEach((item, i) => {
    const div = document.createElement('div');
    if (isOverlaySection(item)) { div.className = 'overlay-section'; div.innerText = item.slice(1); }
    else { div.className = 'overlay-item'; div.innerText = item; div.id = `overlay-${i}`; }
    lst.appendChild(div);
  });

  let hintEl = document.getElementById('overlay-hint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.id = 'overlay-hint';
    hintEl.style.cssText = "text-align: center; color: var(--text_dim); font-size: 14px; margin-top: 25px; opacity: 0.7; line-height: 1.5;";
    bd.querySelector('.overlay-modal').appendChild(hintEl);
  }
  if (hintText) { hintEl.innerHTML = hintText; hintEl.style.display = 'block'; } else { hintEl.style.display = 'none'; }

  bd.classList.remove('hidden'); updateOverlaySelection();
}

function openHistoryMenu() {
  gameState = 'OVERLAY';
  currentOverlayType = 'HISTORY_MENU';
  playSound(sfxSelect);

  const opts = ["OFF", "5 GAMES", "10 GAMES", "15 GAMES", "20 GAMES"];
  const mapped = opts.map(o => {
    let val = o === "OFF" ? 0 : parseInt(o.split(' ')[0], 10);
    return val === recentGamesCount ? "★ " + o : o;
  });

  mapped.push("CLEAR GAMING HISTORY", "BACK TO MENU");
  renderGenericOverlay("GAMING HISTORY", mapped);
}

async function openOverlay(type) {
  if (gameState === 'START' || gameState === 'MAIN') { previousGameState = gameState; }
  gameState = 'OVERLAY'; currentOverlayType = type; setBlur(true);

  if (type === "MAIN_MENU") { renderGenericOverlay("SYSTEM MENU", ["§AUDIO", "JUKEBOX MODE", "SOUND SETTINGS", "§APPEARANCE", "COLOR SCHEME", "START SCREEN", "SCREENSAVER SETTINGS", "§CONTROLS", "SHOW KEYBINDINGS", "GAMEPAD ICONS", "WAKE UP METHOD", "§LIBRARY", "BATCH SCRAPE", "GAMING HISTORY", "§SYSTEM", "ABOUT CREMA", "QUIT CREMA", "CLOSE MENU"]); }
  else if (type === "GAME_MENU") {
    const game = filteredGames[currentGameIndex]; const localUrl = await window.api.checkLocalTrailer(game.Game);
    const favStr = game.FAV === "YES" ? "REMOVE FAV" : "ADD FAV"; const wantStr = game.WANT_TO_PLAY === "YES" ? "REMOVE WANT TO PLAY" : "ADD WANT TO PLAY"; const cmdStr = (game.LaunchCommand && game.LaunchCommand.trim() !== "") ? "EDIT LAUNCH COMMAND" : "ADD LAUNCH COMMAND"; const trStr = localUrl ? "DELETE TRAILER" : "DOWNLOAD TRAILER";
    renderGenericOverlay("GAME OPTIONS", [trStr, favStr, wantStr, cmdStr, "RENAME GAME", "SCRAPING ENGINE", "CLOSE MENU"]);
  }
}

function updateOverlaySelection() {
  document.querySelectorAll('#overlay-backdrop .overlay-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`overlay-${currentOverlayIndex}`);
  if (el) { el.classList.add('selected'); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
}
function closeOverlay() { playSound(sfxBack); document.getElementById('overlay-backdrop').classList.add('hidden'); gameState = previousGameState; if (gameState === 'START' || gameState === 'MAIN') setBlur(false); }

function executeOverlayAction() {
  playSound(sfxSelect); const action = overlayItems[currentOverlayIndex];

  if (gameState === 'START_SCREEN_MENU') {
    const modeMap = { 'LIST MENU': 'STATIC', 'HORIZONTAL CAROUSEL': 'CAROUSEL', 'GRID': 'GRID' };
    const raw = String(action).replace('★ ', '');
    if (raw === 'BACK TO MENU') { openOverlay("MAIN_MENU"); return; }
    if (modeMap[raw]) {
      audioCfg.startScreenMode = modeMap[raw];
      window.api.saveAudioConfig(audioCfg);
      const m = modeMap[raw];
      document.getElementById('start-static').style.display = m === 'STATIC' ? 'flex' : 'none';
      document.getElementById('start-carousel').style.display = m === 'CAROUSEL' ? 'flex' : 'none';
      document.getElementById('start-grid').style.display = m === 'GRID' ? 'flex' : 'none';
      if (m === 'CAROUSEL') renderCarouselMode();
      else if (m === 'GRID') renderGridMode();
      else { const c = document.getElementById('cat-list'); c.innerHTML = ''; categories.forEach((cat, i) => { const d = document.createElement('div'); d.className = 'cat-item'; d.id = `cat-${i}`; const safe = cat.toLowerCase().replace(/ /g, '_'); d.innerHTML = `<div class="cat-icon" style="-webkit-mask-image:url('${convertSafePath('assets/logos/'+safe+'.png')}');"></div><div>${cat}</div>`; c.appendChild(d); }); updateCategorySelection(); }
      openStartScreenMenu();
    }
    return;
  }

  if (currentOverlayType === 'CONFIRM_QUIT') {
    if (action === "YES, QUIT") { window.api.quitApp(); }
    else { openOverlay("MAIN_MENU"); }
    return;
  }

  if (currentOverlayType === 'ABOUT_CREMA') {
    openOverlay("MAIN_MENU");
    return;
  }

  if (currentOverlayType === 'STEAM_MATCH_SELECTOR') {
    if (action === "CANCEL SEARCH") { openGameScrapeMenu(); }
    else { const match = steamSearchResults[currentOverlayIndex]; proceedWithScrape(match.id, match.name); }
    return;
  }

  if (currentOverlayType === 'STEAM_SEARCH_FAILED') {
    if (action === "REFINE SEARCH") { document.getElementById('overlay-backdrop').classList.add('hidden'); openOSK('REFINE_SEARCH', 'REFINE SEARCH TERM', filteredGames[currentGameIndex].Game); }
    else { openGameScrapeMenu(); }
    return;
  }

  if (currentOverlayType === 'HISTORY_MENU') {
    if (action === "BACK TO MENU") {
      openOverlay("MAIN_MENU");
    } else if (action === "CLEAR GAMING HISTORY") {
      window.api.clearHistory().then(() => {
        refreshDatabase().then(() => {
          renderGenericOverlay("ACTION COMPLETED", ["✅ HISTORY CLEARED", "BACK TO MENU"]);
          currentOverlayType = 'HISTORY_CLEARED';
        });
      });
    } else {
      let raw = action.replace("★ ", "");
      let val = raw === "OFF" ? 0 : parseInt(raw.split(' ')[0], 10);
      recentGamesCount = val;
      window.api.setSetting('recent_games_count', val);
      applyLiveFilters();
      openHistoryMenu();
    }
    return;
  }

  if (currentOverlayType === 'HISTORY_CLEARED') {
    openHistoryMenu();
    return;
  }

  if (gameState === 'OVERLAY') {
    if (action === "JUKEBOX MODE") { document.getElementById('overlay-backdrop').classList.add('hidden'); openJukebox(); }
    else if (action === "QUIT CREMA") { currentOverlayType = 'CONFIRM_QUIT'; renderGenericOverlay("EXIT CREMA?", ["YES, QUIT", "CANCEL"]); }
    else if (action === "ADD FAV" || action === "REMOVE FAV") { const val = action === "ADD FAV" ? "YES" : "NO"; filteredGames[currentGameIndex].FAV = val; window.api.saveDbField({game: filteredGames[currentGameIndex].Game, field: 'FAV', value: val}); refreshDatabase(); closeOverlay(); }
    else if (action === "ADD WANT TO PLAY" || action === "REMOVE WANT TO PLAY") { const val = action === "ADD WANT TO PLAY" ? "YES" : "NO"; filteredGames[currentGameIndex].WANT_TO_PLAY = val; window.api.saveDbField({game: filteredGames[currentGameIndex].Game, field: 'WANT_TO_PLAY', value: val}); refreshDatabase(); closeOverlay(); }
    else if (action === "ADD LAUNCH COMMAND" || action === "EDIT LAUNCH COMMAND") { document.getElementById('overlay-backdrop').classList.add('hidden'); openOSK('LAUNCH_CMD', 'LAUNCH COMMAND', filteredGames[currentGameIndex].LaunchCommand || ""); }
    else if (action === "RENAME GAME") { document.getElementById('overlay-backdrop').classList.add('hidden'); openOSK('RENAME_GAME', 'RENAME GAME', filteredGames[currentGameIndex].Game); }
    else if (action === "SCRAPING ENGINE") { document.getElementById('overlay-backdrop').classList.add('hidden'); openGameScrapeMenu(); }
    else if (action === "DOWNLOAD TRAILER") openSearchOverlay();
    else if (action === "DELETE TRAILER") { clearMediaLoaders(); window.api.deleteTrailer(filteredGames[currentGameIndex].Game).then(() => { setDebug("🗑️ Trailer Deleted", true); refreshDatabase(); closeOverlay(); }); }
    else if (action === "SOUND SETTINGS") { document.getElementById('overlay-backdrop').classList.add('hidden'); openSoundOverlay(); }
    else if (action === "BATCH SCRAPE") { document.getElementById('overlay-backdrop').classList.add('hidden'); openScrapeOverlay(); }
    else if (action === "SHOW KEYBINDINGS") { document.getElementById('overlay-backdrop').classList.add('hidden'); openKeybindingsOverlay(); }
    else if (action === "GAMEPAD ICONS") { document.getElementById('overlay-backdrop').classList.add('hidden'); openGamepadMenu(); }
    else if (action === "WAKE UP METHOD") { document.getElementById('overlay-backdrop').classList.add('hidden'); openWakeMethodMenu(); }
    else if (action === "COLOR SCHEME") { document.getElementById('overlay-backdrop').classList.add('hidden'); openThemeCategoryMenu(); }
    else if (action === "SCREENSAVER SETTINGS") { document.getElementById('overlay-backdrop').classList.add('hidden'); openScreensaverMenu(); }
    else if (action === "GAMING HISTORY") { document.getElementById('overlay-backdrop').classList.add('hidden'); openHistoryMenu(); }
    else if (action === "START SCREEN") { document.getElementById('overlay-backdrop').classList.add('hidden'); openStartScreenMenu(); }
    else if (action === "ABOUT CREMA") {
      currentOverlayType = 'ABOUT_CREMA';
      renderGenericOverlay("ABOUT CREMA", ["BACK TO MENU"], "<span style='color: var(--accent); font-size: 26px; font-weight: bold; letter-spacing: 2px;'>CAFE NEUROTICO: CREMA</span><br><span style='color: var(--text_main); font-size: 16px;'>Version 1.0.0</span><br><br><span style='color: var(--text_sec); font-size: 18px; line-height: 1.6; display: inline-block; max-width: 750px; text-align: center;'><i style='color: var(--text_dim);'>\"Crema is the reddish-brown, frothy foam layer that sits on top of a freshly brewed espresso. It consists of water, coffee oils, and pressurized CO2 bubbles created during high-pressure extraction. It signifies freshness and proper pressure.\"</i><br><br><strong>CNGM and CREMA</strong> work together to satisfy our gaming needs.<br><br><strong>CAFE NEUROTICO GAME MANAGER</strong> is the desktop app: detail-focused, neurotic about your library, handling all the heavy lifting with automatic and manual importing.<br><br><strong>CREMA</strong> is the sweet foam on top. It is its fullscreen companion: laidback, easygoing, and focused purely on fun. A true connoisseur of good gaming and good music. Grab a controller and enjoy.<br><br>Proudly designed in Brazil 🇧🇷 by J.R.A.<br>shampooisalie@gmail.com</span>");
    }
    else if (action === "CLOSE MENU") closeOverlay();
    else closeOverlay();
  }
  else if (gameState === 'THEME_CATS') { if (action === "BACK TO MENU") { openOverlay("MAIN_MENU"); } else { openThemeMenu(action); } }
  else if (gameState === 'THEMES') { if (action === "BACK") { openThemeCategoryMenu(); } else if (action) { let raw = String(action).replace("★ ", ""); audioCfg.theme = raw; window.api.saveAudioConfig(audioCfg); applyTheme(raw); openThemeCategoryMenu(); } }
  else if (gameState === 'MUSIC_STYLE') { if (action === "BACK") { openSoundOverlay(); } else if (action) { let raw = String(action).replace("★ ", ""); audioCfg.bgm_mode = raw; window.api.saveAudioConfig(audioCfg); applyBgmMode(); openSoundOverlay(); } }
  else if (gameState === 'GAMEPAD_MENU') {
    if (action === "BACK TO MENU") { openOverlay("MAIN_MENU"); }
    else if (action) {
      let raw = String(action).replace("★ ", "");
      if (raw.startsWith("XBOX")) audioCfg.gamepadLayout = "XBOX";
      else if (raw.startsWith("PS")) audioCfg.gamepadLayout = "PS";
      else if (raw.startsWith("N ")) audioCfg.gamepadLayout = "N";
      window.api.saveAudioConfig(audioCfg);
      renderHardwareIcons();
      openGamepadMenu();
    }
  }
  else if (gameState === 'WAKE_METHOD_MENU') {
    if (action === "BACK TO MENU") { openOverlay("MAIN_MENU"); }
    else if (action) {
      let raw = String(action).replace("★ ", "");
      audioCfg.wakeMethod = raw;
      window.api.saveAudioConfig(audioCfg);
      openWakeMethodMenu();
    }
  }
}

function openKeybindingsOverlay() {
  gameState = 'KEYBINDINGS'; playSound(sfxSelect); setBlur(true);
  const bd = document.getElementById('keybindings-backdrop');
  const gp = document.getElementById('gb-gamepad');
  if (gp) {
    gp.innerHTML = `${getMappedBtn('SOUTH')} - Select / Launch<br>${getMappedBtn('EAST')} - Back<br>${getBtn('dpad_up')}${getBtn('dpad_down')}${getBtn('L1')}${getBtn('R1')} - Navigate List<br>${getBtn('dpad_left')}${getBtn('dpad_right')} - Change Category<br>${getMappedBtn('SELECT')} - Game Options<br>${getMappedBtn('START')} - System Menu<br>${getMappedBtn('WEST')} - Toggle Media / Fullscreen<br>${getMappedBtn('NORTH')} - Search / Controls<br>${getBtn('L3')} - Prev Track / Restart<br>${getBtn('R3')} - Next Track`;
  }
  const kb = document.getElementById('gb-keyboard');
  if (kb) {
    kb.innerHTML = `<strong>[ENTER] / [SPACE]</strong> - Select / Play<br><strong>[ESC] / [BKSP]</strong> - Back<br><strong>[ARROWS]</strong> - Navigate<br><strong>[PG UP] / [PG DN]</strong> - Page Jump<br><strong>[ , ] / [ . ]</strong> - Prev / Next Track<br><strong>[TAB]</strong> - Game Options<br><strong>[M]</strong> - System Menu<br><strong>[X]</strong> - Toggle Media / Fullscreen<br><strong>[Y]</strong> - Global Search`;
  }
  bd.classList.remove('hidden');
}

function closeKeybindingsOverlay() {
  playSound(sfxBack);
  document.getElementById('keybindings-backdrop').classList.add('hidden');
  openOverlay("MAIN_MENU");
}

function openGameScrapeMenu() {
  gameState = 'GAME_SCRAPE_MENU'; playSound(sfxSelect); currentOverlayIndex = 0; document.getElementById('overlay-backdrop').classList.remove('hidden');
  renderGenericOverlay("SCRAPING OPTIONS", ["SCRAPE ALL (DEFAULT)", "CLEAR ALL SCRAPED ITEMS", "CUSTOM COVER (STEAMGRIDDB)", "SCRAPE COVER (DEFAULT)", "REMOVE COVER", "SCRAPE SCREENSHOTS", "REMOVE SCREENSHOTS", "SCRAPE METADATA", "REMOVE METADATA", "BACK TO GAME OPTIONS"]);
}

async function executeGameScrapeAction() {
  playSound(sfxSelect); const action = overlayItems[currentOverlayIndex]; const game = filteredGames[currentGameIndex];
  if (action === "BACK TO GAME OPTIONS") { document.getElementById('overlay-backdrop').classList.add('hidden'); openOverlay("GAME_MENU"); }
  else if (action === "CLEAR ALL SCRAPED ITEMS") {
    const fields = ['CoverArt', 'Screenshot', 'DEV', 'PUB', 'RELEASED', 'GENRE', 'METACRITIC', 'Description', 'ProtonTier', 'SteamAppID'];
    fields.forEach(f => { game[f] = ""; window.api.saveDbField({game: game.Game, field: f, value: ""}); });
    await refreshDatabase(); gameState = 'SCRAPE_RESULT'; renderGenericOverlay("ACTION COMPLETED", ["✅ ALL SCRAPED DATA CLEARED", "BACK TO GAME OPTIONS"]);
  }
  else if (action === "REMOVE COVER") { game.CoverArt = ""; window.api.saveDbField({game: game.Game, field: 'CoverArt', value: ""}); await refreshDatabase(); gameState = 'SCRAPE_RESULT'; renderGenericOverlay("ACTION COMPLETED", ["✅ COVER REMOVED", "BACK TO GAME OPTIONS"]); }
  else if (action === "REMOVE SCREENSHOTS") { game.Screenshot = ""; window.api.saveDbField({game: game.Game, field: 'Screenshot', value: ""}); await refreshDatabase(); gameState = 'SCRAPE_RESULT'; renderGenericOverlay("ACTION COMPLETED", ["✅ SCREENSHOTS REMOVED", "BACK TO GAME OPTIONS"]); }
  else if (action === "REMOVE METADATA") { const fields = ['DEV', 'PUB', 'RELEASED', 'GENRE', 'METACRITIC', 'Description', 'ProtonTier', 'SteamAppID']; fields.forEach(f => { game[f] = ""; window.api.saveDbField({game: game.Game, field: f, value: ""}); }); await refreshDatabase(); gameState = 'SCRAPE_RESULT'; renderGenericOverlay("ACTION COMPLETED", ["✅ METADATA REMOVED", "BACK TO GAME OPTIONS"]); }
  else {
    if (action === "SCRAPE ALL (DEFAULT)") activeScrapeMode = 'ALL';
    else if (action === "CUSTOM COVER (STEAMGRIDDB)") activeScrapeMode = 'SGDB';
    else if (action === "SCRAPE COVER (DEFAULT)") activeScrapeMode = 'COVER';
    else if (action === "SCRAPE SCREENSHOTS") activeScrapeMode = 'SCREENSHOTS';
    else if (action === "SCRAPE METADATA") activeScrapeMode = 'METADATA';
    document.getElementById('overlay-backdrop').classList.remove('hidden');
    triggerSteamSearch(game.Game);
  }
}

async function triggerSteamSearch(searchTerm) {
  document.getElementById('overlay-title').innerText = "SEARCHING...";
  document.getElementById('overlay-list').innerHTML = "<div class='overlay-item selected' style='color: var(--accent);'>Querying Steam database...</div>";

  steamSearchResults = await window.api.searchSteam(searchTerm);
  if (steamSearchResults.length === 0) {
    currentOverlayType = 'STEAM_SEARCH_FAILED'; gameState = 'OVERLAY';
    renderGenericOverlay("NO MATCHES FOUND", ["REFINE SEARCH", "BACK TO SCRAPING MENU"]);
    return;
  }

  currentOverlayType = 'STEAM_MATCH_SELECTOR'; gameState = 'OVERLAY';
  let items = steamSearchResults.map(r => `${r.name} (${r.id})`); items.push("CANCEL SEARCH");
  renderGenericOverlay("SELECT EXACT MATCH", items);
}

function proceedWithScrape(appId, resolvedName) {
  selectedAppId = appId; selectedResolvedName = resolvedName; gameState = 'CONFIRM_SCRAPE';
  let modeText = activeScrapeMode === 'ALL' ? 'ALL DATA' : activeScrapeMode;
  renderGenericOverlay("CONFIRM ACTION", [`PROCEED: SCRAPE ${modeText}`, "CANCEL"]);
}

async function executeConfirmScrapeAction() {
  playSound(sfxSelect); const action = overlayItems[currentOverlayIndex];
  if (action === "CANCEL") { openGameScrapeMenu(); }
  else {
    const game = filteredGames[currentGameIndex];
    if (activeScrapeMode === 'SGDB') {
      document.getElementById('overlay-backdrop').classList.add('hidden');
      const key = await window.api.getSetting('steamgriddb_api');
      if (!key) { openOSK('SGDB_API', 'ENTER STEAMGRIDDB API KEY', ''); } else { openSgdbOverlay(key, selectedResolvedName, selectedAppId); }
    } else {
      document.getElementById('overlay-title').innerText = "SCRAPING...";
      document.getElementById('overlay-list').innerHTML = "<div class='overlay-item selected' style='color: var(--accent);'>Contacting API...</div>";
      const success = await window.api.scrapeSteamData(game.Game, activeScrapeMode, selectedAppId);
      await refreshDatabase(); gameState = 'SCRAPE_RESULT';
      let modeText = activeScrapeMode === 'ALL' ? 'ALL DATA' : activeScrapeMode;
      renderGenericOverlay("SCRAPING STATUS", [success ? `✅ ${modeText} SUCCESSFULLY SCRAPED` : `❌ NO DATA FOUND OR ERROR`, "BACK TO GAME OPTIONS"]);
    }
  }
}

async function openSgdbOverlay(apiKey, resolvedName, appId) {
  gameState = 'SGDB_GRID'; sgdbIndex = 0; sgdbResults = [];
  const bd = document.getElementById('sgdb-backdrop'); const stat = document.getElementById('sgdb-status'); const grid = document.getElementById('sgdb-grid');
  grid.innerHTML = ''; stat.innerText = "Connecting to SteamGridDB..."; bd.classList.remove('hidden');
  let searchName = resolvedName || selectedResolvedName || filteredGames[currentGameIndex].Game;
  let sAppId = appId || selectedAppId;
  sgdbResults = await window.api.sgdbSearch(searchName, apiKey, sAppId);
  if (sgdbResults.length === 0) { stat.innerText = "No covers found or invalid API Key."; setTimeout(() => { bd.classList.add('hidden'); gameState = 'SCRAPE_RESULT'; document.getElementById('overlay-backdrop').classList.remove('hidden'); renderGenericOverlay("SEARCH FAILED", ["❌ NO CUSTOM COVERS FOUND", "BACK TO GAME OPTIONS"]); }, 2000); return; }
  stat.innerText = "Select a Custom Cover:"; renderSgdbGrid();
}

function renderSgdbGrid() {
  const grid = document.getElementById('sgdb-grid'); grid.innerHTML = '';
  sgdbResults.forEach((res, i) => {
    const div = document.createElement('div');
    div.style.border = (i === sgdbIndex) ? "4px solid var(--accent)" : "4px solid transparent";
    div.style.borderRadius = "8px"; div.style.overflow = "hidden"; div.style.transition = "transform 0.2s";
    div.style.transform = (i === sgdbIndex) ? "scale(1.05)" : "scale(1)";
    const img = document.createElement('img'); img.src = res.thumb; img.style.width = "100%"; img.style.display = "block";
    div.appendChild(img); grid.appendChild(div);
    if (i === sgdbIndex) div.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

async function executeSgdbApply() {
  const bd = document.getElementById('sgdb-backdrop'); const stat = document.getElementById('sgdb-status'); stat.innerText = "Downloading selected cover...";
  const success = await window.api.sgdbApply(filteredGames[currentGameIndex].Game, sgdbResults[sgdbIndex].url);
  bd.classList.add('hidden'); await refreshDatabase(); gameState = 'SCRAPE_RESULT'; document.getElementById('overlay-backdrop').classList.remove('hidden');
  renderGenericOverlay("SCRAPING STATUS", [success ? "✅ CUSTOM COVER APPLIED" : "❌ DOWNLOAD FAILED", "BACK TO GAME OPTIONS"]);
}

function openScreensaverMenu() { gameState = 'SCREENSAVER_MENU'; playSound(sfxSelect); currentOverlayIndex = 0; document.getElementById('overlay-backdrop').classList.remove('hidden'); renderScreensaverMenu(); }
function renderScreensaverMenu() { const bd = document.getElementById('overlay-backdrop'); const tit = document.getElementById('overlay-title'); const lst = document.getElementById('overlay-list'); lst.innerHTML = ''; tit.innerText = "SCREENSAVER SETTINGS"; overlayItems = [`MODE: ${audioCfg.screensaver}`, `DELAY: < ${audioCfg.screensaverDelay} MIN >`, "VIEW SCREENSAVER NOW", "BACK TO MENU"]; overlayItems.forEach((item, i) => { const div = document.createElement('div'); div.className = 'overlay-item'; div.innerText = item; div.id = `ssm-${i}`; lst.appendChild(div); }); document.querySelectorAll('#overlay-backdrop .overlay-item').forEach(el => el.classList.remove('selected')); const el = document.getElementById(`ssm-${currentOverlayIndex}`); if (el) el.classList.add('selected'); }
function handleScreensaverMenuHorizontal(dir) { if (currentOverlayIndex === 1) { let idx = delayOptions.indexOf(audioCfg.screensaverDelay); if (dir === 'RIGHT') idx = Math.min(delayOptions.length - 1, idx + 1); else idx = Math.max(0, idx - 1); audioCfg.screensaverDelay = delayOptions[idx]; window.api.saveAudioConfig(audioCfg); resetIdleTimer(); renderScreensaverMenu(); playSound(sfxNav); } }
function executeScreensaverMenuAction() {
  playSound(sfxSelect);
  if (currentOverlayIndex === 0) {
    if (audioCfg.screensaver === 'SCREENSHOTS') audioCfg.screensaver = 'CN WALLPAPERS';
    else if (audioCfg.screensaver === 'CN WALLPAPERS') audioCfg.screensaver = 'OFF';
    else audioCfg.screensaver = 'SCREENSHOTS';
    window.api.saveAudioConfig(audioCfg);
    resetIdleTimer();
    renderScreensaverMenu();
  } else if (currentOverlayIndex === 2) {
    document.getElementById('overlay-backdrop').classList.add('hidden');
    gameState = 'MAIN';
    setBlur(false);
    startScreensaver();
  } else if (currentOverlayIndex === 3) {
    document.getElementById('overlay-backdrop').classList.add('hidden');
    openOverlay("MAIN_MENU");
  }
}

function openThemeCategoryMenu() { gameState = 'THEME_CATS'; let cats = Object.keys(THEME_CATEGORIES); cats.push("BACK TO MENU"); renderGenericOverlay("THEME CATEGORIES", cats); }
function openThemeMenu(category) { gameState = 'THEMES'; activeThemeCategory = category; let themes = THEME_CATEGORIES[category].map(t => t === activeTheme ? "★ " + t : t); themes.push("BACK"); renderGenericOverlay(category.toUpperCase(), themes); }
function openGamepadMenu() {
  gameState = 'GAMEPAD_MENU';
  let layouts = ["XBOX LAYOUT", "PS LAYOUT", "N LAYOUT"];
  let mapped = layouts.map(l => l.startsWith(audioCfg.gamepadLayout) ? "★ " + l : l);
  mapped.push("BACK TO MENU");
  renderGenericOverlay("GAMEPAD ICONS", mapped);
}
function openWakeMethodMenu() {
  gameState = 'WAKE_METHOD_MENU';
  let methods = ["START + SELECT", "L1 + R1 + START + SELECT", "L3 + R3", "START + SELECT (HOLD 2 SEC)", "L1 + R1 + START + SELECT (HOLD 2 SEC)", "L3 + R3 (HOLD 2 SEC)"];
  let mapped = methods.map(m => m === audioCfg.wakeMethod ? "★ " + m : m);
  mapped.push("BACK TO MENU");
  renderGenericOverlay("WAKE UP METHOD", mapped);
}
function openMusicStyleMenu() { document.getElementById('sound-backdrop').classList.add('hidden'); gameState = 'MUSIC_STYLE'; let styles = ["PIANO", "AMBIENT", "JAZZ", "LO-FI", "CUSTOM", "OFF"]; let mapped = styles.map(s => s === audioCfg.bgm_mode ? "★ " + s : s); mapped.push("BACK"); renderGenericOverlay("MUSIC STYLE", mapped, "Default styles composed by Schwarzenegger Belonio (Migfus20)<br>freesound.org/people/Migfus20/"); }
function openSoundOverlay() { if (document.getElementById('overlay-backdrop')) document.getElementById('overlay-backdrop').classList.add('hidden'); gameState = 'SOUND'; playSound(sfxSelect); currentOverlayIndex = 0; document.getElementById('sound-backdrop').classList.remove('hidden'); renderSoundMenu(); }
function renderSoundMenu() { const lst = document.getElementById('sound-list'); lst.innerHTML = ''; overlayItems = ["MUSIC STYLE", `BGM: ${audioCfg.bgm ? 'ON' : 'OFF'}`, `SFX: ${audioCfg.sfx ? 'ON' : 'OFF'}`, `BGM VOLUME: < ${Math.round(audioCfg.vol * 100)}% >`, "BACK TO MENU"]; overlayItems.forEach((item, i) => { const div = document.createElement('div'); div.className = 'overlay-item'; div.innerText = item; div.id = `snd-${i}`; lst.appendChild(div); }); document.querySelectorAll('#sound-list .overlay-item').forEach(el => el.classList.remove('selected')); const el = document.getElementById(`snd-${currentOverlayIndex}`); if (el) el.classList.add('selected'); }
function handleSoundHorizontal(dir) { if (currentOverlayIndex === 3) { let v = audioCfg.vol; if (dir === 'RIGHT') v = Math.min(1.0, v + 0.05); else v = Math.max(0.0, v - 0.05); audioCfg.vol = v; if (audioCfg.bgm && !isVideoActive()) bgmAudio.volume = v; window.api.saveAudioConfig(audioCfg); renderSoundMenu(); playSound(sfxNav); } }
function executeSoundAction() { playSound(sfxSelect); if (currentOverlayIndex === 0) { openMusicStyleMenu(); } else if (currentOverlayIndex === 1) { audioCfg.bgm = !audioCfg.bgm; window.api.saveAudioConfig(audioCfg); applyBgmMode(); renderSoundMenu(); } else if (currentOverlayIndex === 2) { audioCfg.sfx = !audioCfg.sfx; window.api.saveAudioConfig(audioCfg); renderSoundMenu(); } else if (currentOverlayIndex === 4) closeSoundOverlay(); }
function closeSoundOverlay() { playSound(sfxBack); document.getElementById('sound-backdrop').classList.add('hidden'); gameState = previousGameState; if (gameState === 'START' || gameState === 'MAIN') setBlur(false); }

function openScrapeOverlay() { gameState = 'SCRAPE'; playSound(sfxSelect); currentOverlayIndex = 0; setBlur(true); overlayItems = ["START BATCH SCRAPE", "BACK TO MENU"]; const bd = document.getElementById('scrape-backdrop'); const lst = document.getElementById('scrape-list'); lst.innerHTML = ''; document.getElementById('scrape-game').innerText = "Ready to scan database."; document.getElementById('scrape-fill').style.width = "0%"; document.getElementById('scrape-percent').innerText = "0%"; overlayItems.forEach((item, i) => { const div = document.createElement('div'); div.className = 'overlay-item'; div.innerText = item; div.id = `scrp-${i}`; lst.appendChild(div); }); bd.classList.remove('hidden'); updateScrapeSelection(); }
function updateScrapeSelection() { document.querySelectorAll('#scrape-list .overlay-item').forEach(el => el.classList.remove('selected')); const el = document.getElementById(`scrp-${currentOverlayIndex}`); if (el) el.classList.add('selected'); }
function executeScrapeAction() { playSound(sfxSelect); if (currentOverlayIndex === 0) { document.getElementById('scrape-list').innerHTML = ''; document.getElementById('scrape-game').innerText = "Analyzing DB..."; window.api.runBatchScrape().then(() => { setTimeout(closeScrapeOverlay, 2000); }); } else { closeScrapeOverlay(); } }
function updateScrapeProgressBar(data) { if (gameState !== 'SCRAPE') return; document.getElementById('scrape-game').innerText = data.game; document.getElementById('scrape-fill').style.width = `${data.percent}%`; document.getElementById('scrape-percent').innerText = `${Math.floor(data.percent)}%`; }
function closeScrapeOverlay() { playSound(sfxBack); document.getElementById('scrape-backdrop').classList.add('hidden'); gameState = previousGameState; if (gameState === 'START' || gameState === 'MAIN') setBlur(false); }

async function openSearchOverlay() { if (document.getElementById('overlay-backdrop')) document.getElementById('overlay-backdrop').classList.add('hidden'); gameState = 'SEARCH'; playSound(sfxSelect); setBlur(true); const bd = document.getElementById('search-backdrop'); const lst = document.getElementById('search-list'); const stat = document.getElementById('search-status'); lst.innerHTML = ''; currentSearchIndex = 0; searchResults = []; stat.innerText = "Searching YouTube..."; bd.classList.remove('hidden'); const results = await window.api.searchYoutube(filteredGames[currentGameIndex].Game); if(results.length === 0) { stat.innerText = "No results found."; setTimeout(closeSearchOverlay, 2000); return; } stat.innerText = "Select a video to download:"; searchResults = results; searchResults.forEach((res, i) => { const div = document.createElement('div'); div.className = 'overlay-item'; div.id = `search-${i}`; div.style.display = "flex"; div.style.gap = "20px"; div.style.alignItems = "center"; div.style.textAlign = "left"; const img = document.createElement('img'); img.src = res.thumbnail; img.style.width = "120px"; img.style.borderRadius = "4px"; let t = String(res.title); if(t.length > 50) t = t.substring(0, 47) + "..."; div.appendChild(img); const txt = document.createElement('div'); txt.innerText = t; div.appendChild(txt); lst.appendChild(div); }); updateSearchSelection(); }
function updateSearchSelection() { document.querySelectorAll('#search-list .overlay-item').forEach(el => el.classList.remove('selected')); const el = document.getElementById(`search-${currentSearchIndex}`); if (el) el.classList.add('selected'); }
function closeSearchOverlay() { playSound(sfxBack); document.getElementById('search-backdrop').classList.add('hidden'); gameState = 'MAIN'; setBlur(false); }
function executeSearchAction() { playSound(sfxSelect); const selectedVideo = searchResults[currentSearchIndex]; closeSearchOverlay(); openProgressOverlay(filteredGames[currentGameIndex].Game, selectedVideo.title, selectedVideo.id); }
function openProgressOverlay(gameName, videoTitle, videoId) { gameState = 'PROGRESS'; setBlur(true); const bd = document.getElementById('progress-backdrop'); const gameEl = document.getElementById('progress-game'); const fillEl = document.getElementById('progress-fill'); const percentEl = document.getElementById('progress-percent'); const statusEl = document.getElementById('progress-status'); let t = String(videoTitle); if(t.length > 45) t = t.substring(0, 42) + "..."; gameEl.innerText = gameName; statusEl.innerText = `Requesting formats for: ${t}`; fillEl.style.width = "0%"; percentEl.innerText = "0%"; bd.classList.remove('hidden'); window.api.downloadTrailer(gameName, videoId).then(success => { if(success) { statusEl.innerText = "✅ Complete!"; setDebug("🎬 Download successful", true); setTimeout(closeProgressOverlay, 1500); } else { statusEl.innerText = "❌ Download Failed."; setDebug("❌ Download failed", true); setTimeout(closeProgressOverlay, 3000); } }).catch(() => { statusEl.innerText = "❌ Download Failed."; setTimeout(closeProgressOverlay, 3000); }); }
function updateDownloadProgressBar(percentage) { const fillEl = document.getElementById('progress-fill'); const percentEl = document.getElementById('progress-percent'); const statusEl = document.getElementById('progress-status'); if (gameState !== 'PROGRESS' || !fillEl || !percentEl) return; statusEl.innerText = "Ripping stream via native pipeline..."; fillEl.style.width = `${percentage}%`; percentEl.innerText = `${Math.floor(percentage)}%`; }
function closeProgressOverlay() { document.getElementById('progress-backdrop').classList.add('hidden'); gameState = 'MAIN'; setBlur(false); updateGameSelection(); }

function getMediaForCategory(catName) {
  const filtered = allGames.filter(g => { const s = g.Store ? String(g.Store).toLowerCase() : ''; if (catName === "ALL GAMES") return true; if (catName === "STEAM") return s.includes("steam"); if (catName === "GOG") return s.includes("gog"); if (catName === "EPIC") return s.includes("epic"); if (catName === "PHYSICAL") return s.includes("physical"); if (catName === "EMULATION") return s.includes("emulation"); if (catName === "AMAZON") return s.includes("amazon"); if (catName === "APPS") return s.includes("apps"); if (catName === "OTHERS") return s.includes("others"); if (catName === "FAVS") return g.FAV === 'YES'; if (catName === "WANT TO PLAY") return g.WANT_TO_PLAY === 'YES'; if (catName === "PLAYABLE") return g.LaunchCommand && String(g.LaunchCommand).trim() !== ''; return true; });
  let media = [];
  filtered.forEach(g => { if (g.Screenshot && String(g.Screenshot).trim()) media.push(...String(g.Screenshot).split('|').filter(s => s.trim())); });
  if (media.length < 3) filtered.forEach(g => { if (g.CoverArt && String(g.CoverArt).trim()) media.push(String(g.CoverArt)); });
  media.sort(() => Math.random() - 0.5);
  return media;
}
function fillMosaicIn(catName, iconId, mosaicId, imgClass = 'mosaic-img') {
  const iconEl = document.getElementById(iconId); const mosaicEl = document.getElementById(mosaicId);
  if (!iconEl || !mosaicEl) return;
  const media = getMediaForCategory(catName);
  if (media.length >= 1) { iconEl.style.display = 'none'; mosaicEl.style.display = 'block'; mosaicEl.innerHTML = ''; for (let i = 0; i < 3; i++) { const img = document.createElement('img'); img.className = imgClass; img.src = convertSafePath(media[i % media.length]); mosaicEl.appendChild(img); setTimeout(() => img.classList.add('show'), i * 150 + 50); } }
  else { mosaicEl.style.display = 'none'; iconEl.style.display = 'block'; iconEl.innerHTML = catName; }
}
function updateHeroMosaic(catName) { fillMosaicIn(catName, 'hero-icon', 'hero-mosaic'); }
function transitionToStart() {
  gameState = 'START'; clearMediaLoaders();
  document.getElementById('splash-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  const mode = audioCfg.startScreenMode || 'CAROUSEL';
  document.getElementById('start-static').style.display = mode === 'STATIC' ? 'flex' : 'none';
  document.getElementById('start-carousel').style.display = mode === 'CAROUSEL' ? 'flex' : 'none';
  document.getElementById('start-grid').style.display = mode === 'GRID' ? 'flex' : 'none';
  if (mode === 'STATIC') {
    const c = document.getElementById('cat-list'); c.innerHTML = '';
    categories.forEach((cat, i) => { const d = document.createElement('div'); d.className = 'cat-item'; d.id = `cat-${i}`; const safeName = cat.toLowerCase().replace(/ /g, '_'); const iconPath = convertSafePath('assets/logos/' + safeName + '.png'); d.innerHTML = `<div class="cat-icon" style="-webkit-mask-image: url('${iconPath}');"></div><div>${cat}</div>`; c.appendChild(d); });
    updateCategorySelection();
  } else if (mode === 'CAROUSEL') {
    renderCarouselMode();
  } else if (mode === 'GRID') {
    renderGridMode();
  }
}
function updateCategorySelection() {
  const mode = audioCfg.startScreenMode || 'STATIC';
  if (mode === 'CAROUSEL') { updateCarouselClasses(); fillMosaicIn(categories[currentCategoryIndex], 'carousel-hero-icon', 'carousel-hero-mosaic'); return; }
  if (mode === 'GRID') { updateGridSelection(); return; }
  document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`cat-${currentCategoryIndex}`); if (el) el.classList.add('selected');
  updateHeroMosaic(categories[currentCategoryIndex]);
}
function transitionToMain() { gameState = 'MAIN'; document.getElementById('start-screen').classList.add('hidden'); document.getElementById('main-screen').classList.remove('hidden'); const catName = categories[currentCategoryIndex]; const safeCatName = catName.toLowerCase().replace(/ /g, '_'); const catIconPath = convertSafePath('assets/logos/' + safeCatName + '.png'); document.getElementById('main-header').innerHTML = `<div class="header-icon" style="-webkit-mask-image: url('${catIconPath}');"></div><div>${catName}</div>`; searchQuery = ""; applyLiveFilters(false); }

// === CAROUSEL MODE ===
const CAROUSEL_PHANTOMS = 4;
let carouselRawPos = CAROUSEL_PHANTOMS;
let carouselAnimating = false;
function renderCarouselMode() {
  const track = document.getElementById('carousel-track'); if (!track) return;
  track.innerHTML = '';
  const all = [...categories.slice(-CAROUSEL_PHANTOMS), ...categories, ...categories.slice(0, CAROUSEL_PHANTOMS)];
  all.forEach(cat => { const item = document.createElement('div'); item.className = 'carousel-item'; const safe = cat.toLowerCase().replace(/ /g, '_'); const icon = convertSafePath(`assets/logos/${safe}.png`); item.innerHTML = `<div class="carousel-item-icon" style="-webkit-mask-image:url('${icon}');"></div><div class="carousel-item-label">${cat}</div>`; track.appendChild(item); });
  carouselRawPos = currentCategoryIndex + CAROUSEL_PHANTOMS;
  updateCarouselTransform(false); updateCarouselClasses();
  fillMosaicIn(categories[currentCategoryIndex], 'carousel-hero-icon', 'carousel-hero-mosaic');
}
function updateCarouselTransform(animated) {
  const track = document.getElementById('carousel-track'); if (!track) return;
  if (!animated) { track.style.transition = 'none'; void track.offsetWidth; }
  track.style.transform = `translateX(${960 - 100 - carouselRawPos * 200}px)`;
  if (!animated) { void track.offsetWidth; track.style.transition = ''; }
}
function updateCarouselClasses() {
  document.querySelectorAll('#carousel-track .carousel-item').forEach((item, i) => { item.classList.remove('selected', 'near'); const dist = Math.abs(i - carouselRawPos); if (i === carouselRawPos) item.classList.add('selected'); else if (dist <= 2) item.classList.add('near'); });
}
function navigateCarousel(dir) {
  if (carouselAnimating) return;
  const N = categories.length;
  if (dir === 'right') { currentCategoryIndex = (currentCategoryIndex + 1) % N; carouselRawPos++; }
  else { currentCategoryIndex = (currentCategoryIndex - 1 + N) % N; carouselRawPos--; }
  updateCarouselTransform(true); updateCarouselClasses();
  fillMosaicIn(categories[currentCategoryIndex], 'carousel-hero-icon', 'carousel-hero-mosaic');
  if (carouselRawPos < CAROUSEL_PHANTOMS || carouselRawPos >= CAROUSEL_PHANTOMS + N) {
    carouselAnimating = true;
    setTimeout(() => {
      const track = document.getElementById('carousel-track');
      const items = track ? track.querySelectorAll('.carousel-item') : [];
      items.forEach(el => { el.style.transition = 'none'; });
      void track.offsetWidth;
      carouselRawPos = currentCategoryIndex + CAROUSEL_PHANTOMS;
      updateCarouselTransform(false);
      updateCarouselClasses();
      void track.offsetWidth;
      items.forEach(el => { el.style.transition = ''; });
      carouselAnimating = false;
    }, 320);
  }
}
// === GRID MODE ===
function renderGridMode() {
  const topHero = document.getElementById('grid-top-hero'); if (topHero) topHero.style.display = 'none';
  const cells = document.getElementById('grid-cells'); if (!cells) return;
  cells.innerHTML = '';
  categories.forEach((cat, i) => {
    const cell = document.createElement('div'); cell.className = 'grid-cell'; cell.id = `grid-cell-${i}`;
    const safe = cat.toLowerCase().replace(/ /g, '_'); const icon = convertSafePath(`assets/logos/${safe}.png`);
    const media = getMediaForCategory(cat);
    const bg = media.length > 0 ? `<img class="grid-cell-bg" src="${convertSafePath(media[0])}" alt="">` : '';
    cell.innerHTML = `${bg}<div class="grid-cell-grad"></div><div class="grid-cell-content"><div class="grid-cell-icon" style="-webkit-mask-image:url('${icon}');"></div><div class="grid-cell-name">${cat}</div></div>`;
    cells.appendChild(cell);
  });
  updateGridSelection();
}
function updateGridSelection() {
  categories.forEach((cat, i) => { const cell = document.getElementById(`grid-cell-${i}`); if (cell) cell.classList.toggle('selected', currentCategoryIndex === i); });
}
function navigateGrid(action) {
  const N = categories.length; const COLS = 3;
  const row = Math.floor(currentCategoryIndex / COLS); const col = currentCategoryIndex % COLS;
  if (action === 'UP' && currentCategoryIndex - COLS >= 0) currentCategoryIndex -= COLS;
  else if (action === 'DOWN' && currentCategoryIndex + COLS < N) currentCategoryIndex += COLS;
  else if (action === 'LEFT' && col > 0) currentCategoryIndex--;
  else if (action === 'RIGHT' && col < COLS - 1 && currentCategoryIndex < N - 1) currentCategoryIndex++;
  updateGridSelection();
}
// === START SCREEN MENU ===
function openStartScreenMenu() {
  gameState = 'START_SCREEN_MENU';
  const current = audioCfg.startScreenMode || 'STATIC';
  const opts = ['LIST MENU', 'HORIZONTAL CAROUSEL', 'GRID'].map(m => { const key = m === 'LIST MENU' ? 'STATIC' : m === 'HORIZONTAL CAROUSEL' ? 'CAROUSEL' : 'GRID'; return key === current ? `★ ${m}` : m; });
  opts.push('BACK TO MENU');
  renderGenericOverlay('START SCREEN', opts);
}

function renderGameList() {
  const l = document.getElementById('game-list');
  l.innerHTML = '';

  let emptyHint = document.getElementById('empty-state-hint');
  if (!emptyHint) {
    emptyHint = document.createElement('div');
    emptyHint.id = 'empty-state-hint';
    emptyHint.className = 'media-layer';
    emptyHint.style.cssText = "display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box; text-align: center; background: rgba(0,0,0,0.85); z-index: 20;";
    emptyHint.innerHTML = `<div style="font-size: 36px; font-weight: 900; color: var(--accent); margin-bottom: 20px; letter-spacing: 2px;">LIBRARY EMPTY</div><div style="font-size: 24px; color: var(--text_sec); line-height: 1.6;">Use the desktop app <strong style="color: var(--text_main);">Cafe Neurotico Game Manager</strong><br>to import games, sync storefronts, and manage your collection.</div>`;
    document.getElementById('media-container').appendChild(emptyHint);
  }

  if (filteredGames.length === 0) {
    document.getElementById('game-desc').innerText = "NO GAMES FOUND IN THIS CATEGORY.";
    clearMediaLoaders();
    const blank = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    const bg = document.getElementById('cover-backdrop'); bg.src = blank; bg.classList.remove('active');
    const mini = document.getElementById('cover-mini'); mini.src = blank; mini.classList.add('hidden');
    document.getElementById('stat-dev').innerText = "--"; document.getElementById('stat-pub').innerText = "--"; document.getElementById('stat-release').innerText = "--"; document.getElementById('stat-genre').innerText = "--"; document.getElementById('stat-hltb').innerText = "--"; document.getElementById('stat-proton').innerText = "--";
    if (document.getElementById('store-icons')) document.getElementById('store-icons').innerHTML = '';
    emptyHint.classList.add('active');
    return;
  } else {
    emptyHint.classList.remove('active');
  }

  const frag = document.createDocumentFragment();

  if (numRecentInList > 0) {
    const labelR = document.createElement('div');
    labelR.style.cssText = "color: var(--accent); font-weight: 900; letter-spacing: 4px; text-align: center; font-size: 16px; padding: 15px 0 5px 0; border-bottom: 2px solid var(--border_solid); margin-bottom: 10px; margin-top: 5px;";
    labelR.innerText = "RECENT GAMES";
    frag.appendChild(labelR);
  }

  filteredGames.forEach((game, i) => {
    if (numRecentInList > 0 && i === numRecentInList) {
      const labelA = document.createElement('div');
      labelA.style.cssText = "color: var(--text_sec); font-weight: 900; letter-spacing: 4px; text-align: center; font-size: 16px; padding: 15px 0 5px 0; border-bottom: 2px solid var(--border_solid); margin-bottom: 10px; margin-top: 20px;";
      labelA.innerText = "ALL GAMES";
      frag.appendChild(labelA);
    }

    const d = document.createElement('div');
    d.className = 'game-item';
    let p = ""; if (game.FAV === 'YES') p += "★ "; if (game.WANT_TO_PLAY === 'YES') p += "♥ ";
    d.innerText = p + game.Game;
    d.id = `game-${i}`;
    frag.appendChild(d);
  });

  l.appendChild(frag);
  updateGameSelection();
}
function colorProtonText(el, tier) { if (!tier) return; const t = String(tier).toUpperCase(); el.innerText = t; if (t.includes("PLATINUM")) el.style.color = "#00e5ff"; else if (t.includes("GOLD")) el.style.color = "#ffd700"; else if (t.includes("SILVER")) el.style.color = "#c0c0c0"; else if (t.includes("BRONZE")) el.style.color = "#cd7f32"; else if (t.includes("BORKED")) el.style.color = "#ff0000"; else if (t.includes("NATIVE")) el.style.color = "#00ff00"; else el.style.color = "var(--text_main)"; }

function clearMediaLoaders() {
  clearTimeout(trailerTimeout); clearInterval(screenshotInterval);
  if (audioCfg.bgm && bgmAudio.volume < audioCfg.vol && hasBooted && gameState !== 'SPLASH' && gameState !== 'GAME_RUNNING' && audioCfg.bgm_mode !== "OFF") fadeBGM(audioCfg.vol);
  if (audioCfg.bgm && bgmAudio.paused && hasBooted && gameState !== 'SPLASH' && gameState !== 'GAME_RUNNING' && audioCfg.bgm_mode !== "OFF" && !window.manualBgmPause) { bgmAudio.play().catch(e=>{}); }
  const mainDock = document.getElementById('media-container'), vid = document.getElementById('video-player'), ss = document.getElementById('screenshot-player'), bg = document.getElementById('cover-backdrop'), mini = document.getElementById('cover-mini'), prompt = document.getElementById('mini-prompt');
  const blank = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  try {
    if(vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.classList.remove('active'); mainDock.appendChild(vid); }
    if(ss) { ss.src = blank; ss.classList.remove('active'); mainDock.appendChild(ss); }
    if(bg) { bg.src = blank; bg.classList.add('active'); mainDock.appendChild(bg); }
    if(prompt) { prompt.style.opacity = '1'; }
    let nm = document.getElementById('no-media-hint'); if (nm) nm.classList.remove('active');
  } catch(e) {}
  gameHasTrailer = false; mediaSwapped = false; setDebug("", false);
}

let listScrollTimer = null;

function updateGameSelection() {
  if (filteredGames.length === 0) return;

  const now = Date.now();
  const isSpeeding = (now - lastSelectionTime) < 150;
  lastSelectionTime = now;

  document.querySelectorAll('.game-item').forEach(el => {
    el.classList.remove('selected');
    el.style.transition = isSpeeding ? 'none' : 'all 0.1s';
  });

  const sel = document.getElementById(`game-${currentGameIndex}`);
  if (sel) {
    sel.classList.add('selected');
    sel.style.transition = isSpeeding ? 'none' : 'all 0.1s';
    sel.scrollIntoView({ behavior: isSpeeding ? "auto" : "smooth", block: "center" });
  }

  clearMediaLoaders();
  clearTimeout(listScrollTimer);

  listScrollTimer = setTimeout(() => {
    const game = filteredGames[currentGameIndex];
    try {
      let d = game.Description ? String(game.Description) : "No description available."; if (d.length > 500) d = d.substring(0, 497) + "..."; document.getElementById('game-desc').innerText = d;
      document.getElementById('stat-dev').innerText = game.DEV || "--"; document.getElementById('stat-pub').innerText = game.PUB || "--"; document.getElementById('stat-release').innerText = game.RELEASED || "--";
      let genre = game.GENRE ? String(game.GENRE) : "--"; if (genre.includes(",")) genre = genre.split(",")[0]; document.getElementById('stat-genre').innerText = genre;
      const hltbEl = document.getElementById('stat-hltb'); if (!game.HLTB_Main || String(game.HLTB_Main).trim() === "") { hltbEl.innerText = "Searching..."; hltbEl.style.color = "var(--text_dim)"; window.api.fetchHltb(game.Game).then(res => { if (filteredGames[currentGameIndex].Game === game.Game) { hltbEl.innerText = res; hltbEl.style.color = "var(--accent)"; game.HLTB_Main = res; if (res !== "Unknown" && res !== "Error") window.api.saveDbField({game: game.Game, field: 'HLTB_Main', value: res}); } }); } else { hltbEl.innerText = game.HLTB_Main; hltbEl.style.color = "var(--accent)"; }
      const protonEl = document.getElementById('stat-proton'); if (game.SteamAppID && String(game.SteamAppID) !== "None" && (!game.ProtonTier || String(game.ProtonTier).trim() === "")) { protonEl.innerText = "Scanning..."; protonEl.style.color = "var(--text_dim)"; window.api.fetchProton(game.SteamAppID).then(res => { if (filteredGames[currentGameIndex].Game === game.Game) { const tier = String(res).toUpperCase(); colorProtonText(protonEl, tier); game.ProtonTier = tier; if (tier !== "UNKNOWN" && tier !== "ERROR") window.api.saveDbField({game: game.Game, field: 'ProtonTier', value: tier}); } }); } else { if (game.ProtonTier) colorProtonText(protonEl, game.ProtonTier); else { protonEl.innerText = "N/A"; protonEl.style.color = "var(--border_solid)"; } }
      let hasCover = game.CoverArt && String(game.CoverArt).trim() !== "";
      let hasScreenshotsTemp = game.Screenshot && String(game.Screenshot).trim() !== "";

      let noMediaHint = document.getElementById('no-media-hint');
      if (!noMediaHint) {
        noMediaHint = document.createElement('div');
        noMediaHint.id = 'no-media-hint';
        noMediaHint.className = 'media-layer';
        noMediaHint.style.cssText = "display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box; text-align: center; background: rgba(0,0,0,0.7); z-index: 15;";
        noMediaHint.innerHTML = `<div style="font-size: 32px; font-weight: 900; color: var(--accent); margin-bottom: 15px; letter-spacing: 2px;">NO MEDIA FOUND</div><div style="font-size: 20px; color: var(--text_sec); line-height: 1.6;">Press <strong>[SELECT]</strong> to open Game Options.<br>Use the <strong style="color: var(--text_main);">SCRAPING ENGINE</strong> to download artwork.<br>If the automatic scan fails, select <strong>REFINE SEARCH</strong>.</div>`;
        document.getElementById('media-container').appendChild(noMediaHint);
      }

      if (!hasCover && !hasScreenshotsTemp) noMediaHint.classList.add('active');
      else noMediaHint.classList.remove('active');

      const bg = document.getElementById('cover-backdrop'); const mini = document.getElementById('cover-mini');
      const blank = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      if (hasCover) { const p = convertSafePath(game.CoverArt); bg.src = p; mini.src = p; mini.classList.remove('hidden'); }
      else { bg.src = blank; mini.src = blank; mini.classList.add('hidden'); }

      const storeContainer = document.getElementById('store-icons');
      if (storeContainer) { storeContainer.innerHTML = ''; if (game.Store && String(game.Store).trim() !== "") { const stores = String(game.Store).split(',').map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(s => s !== ""); stores.forEach(s => { const div = document.createElement('div'); div.className = 'store-icon'; const path = convertSafePath('assets/logos/' + s + '.png'); div.style.webkitMaskImage = `url('${path}')`; storeContainer.appendChild(div); }); } }

      trailerTimeout = setTimeout(() => {
        let hasScreenshots = false;
        if (hasScreenshotsTemp) { screenshotArray = String(game.Screenshot).split('|').filter(s => String(s).trim() !== ""); if (screenshotArray.length > 0) { hasScreenshots = true; currentScreenshotIndex = 0; const ss = document.getElementById('screenshot-player'); ss.src = convertSafePath(screenshotArray[0]); screenshotInterval = setInterval(() => { currentScreenshotIndex = (currentScreenshotIndex + 1) % screenshotArray.length; ss.src = convertSafePath(screenshotArray[currentScreenshotIndex]); }, 4000); } }
        window.api.checkLocalTrailer(game.Game).then(localUrl => {

          // FIX: Guard against late promise resolution playing video in the background while game is launching
          if (gameState !== 'MAIN' || filteredGames[currentGameIndex]?.id !== game.id) return;

          const mainDock = document.getElementById('media-container'); const miniDock = document.getElementById('mini-dock'); const vid = document.getElementById('video-player'); const ss = document.getElementById('screenshot-player'); const prompt = document.getElementById('mini-prompt');
          if (localUrl) {
            if (noMediaHint) noMediaHint.classList.remove('active');
            gameHasTrailer = true; prompt.style.opacity = '0'; mainDock.appendChild(vid); miniDock.appendChild(ss); vid.src = localUrl; vid.volume = 0.5; vid.muted = false; vid.play().then(() => { fadeBGM(0); bg.classList.remove('active'); vid.classList.add('active'); if(hasScreenshots) ss.classList.add('active'); }).catch(e => { setDebug(`PLAYBACK ERROR`, true); });
          } else {
            gameHasTrailer = false; prompt.style.opacity = '1'; mainDock.appendChild(ss); if (hasScreenshots) { bg.classList.remove('active'); ss.classList.add('active'); }
          } });
      }, 2000);
    } catch(e) {}
  }, isSpeeding ? 150 : 0);
}

// === JUKEBOX OS ENGINE ===
let jbLibrary = [], jbPlaylists = {}, jbQueue = [];
let jbFocus = 'SIDEBAR', jbNavIndex = 0, jbListIndex = 0, jbView = 'ROOT', jbActiveSelection = null, jbSecondarySelection = null;
let jbListItems = [], jbSearchQuery = "", jbIsFullscreen = false, jbUpdateTimer = null;
let jbActionTarget = null;

const jbStyle = document.createElement('style');
jbStyle.innerHTML = `@keyframes bounce { 0% { height: 10px; } 100% { height: 40px; } }
@keyframes wave1 { 0% { transform: rotate(-6deg) translateY(30px) scaleX(1); } 100% { transform: rotate(6deg) translateY(-120px) scaleX(1.1); } }
@keyframes wave2 { 0% { transform: rotate(8deg) translateY(-30px) scaleX(1.1); } 100% { transform: rotate(-8deg) translateY(120px) scaleX(1); } }`;
document.head.appendChild(jbStyle);

function formatJbTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  let m = Math.floor(sec / 60); let s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

async function openJukebox() {
  gameState = 'JUKEBOX'; setBlur(true);
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('jukebox-screen').classList.remove('hidden');
  document.getElementById('jb-footer').innerHTML = `${getBtn('dpad_up')}${getBtn('dpad_down')}${getBtn('L1')}${getBtn('R1')} Navigate &nbsp;&nbsp; ${getMappedBtn('SOUTH')} Play &nbsp;&nbsp; ${getMappedBtn('EAST')} Back &nbsp;&nbsp; ${getMappedBtn('NORTH')} Search &nbsp;&nbsp; ${getMappedBtn('WEST')} Fullscreen &nbsp;&nbsp; ${getMappedBtn('SELECT')} Options`;

  if (jbLibrary.length === 0) {
    document.getElementById('jb-status').innerText = "Scanning Music Folder...";
    jbLibrary = await window.api.getMusicLibrary();
    jbPlaylists = await window.api.getPlaylists() || {};
  }

  document.getElementById('jb-status').innerText = `${jbLibrary.length} Tracks Loaded`;
  jbFocus = 'SIDEBAR'; jbNavIndex = 0; jbView = 'ROOT'; jbListIndex = 0; jbSearchQuery = "";
  updateJbSidebar();
  renderJbList();

  clearInterval(jbUpdateTimer);
  jbUpdateTimer = setInterval(updateJbNowPlayingUI, 1000);
  updateJbNowPlayingUI();
}

function closeJukebox() {
  gameState = previousGameState;
  setBlur(false);
  document.getElementById('jukebox-screen').classList.add('hidden');

  if (gameState === 'START') {
    document.getElementById('start-screen').classList.remove('hidden');
  } else {
    document.getElementById('main-screen').classList.remove('hidden');
  }

  clearInterval(jbUpdateTimer);
}

function updateJbSidebar() {
  for(let i=0; i<4; i++) {
    let el = document.getElementById(`jb-nav-${i}`);
    if(el) {
      el.classList.remove('selected');
      if(i === jbNavIndex && jbFocus === 'SIDEBAR') el.classList.add('selected');
      else if (i === jbNavIndex && jbFocus === 'LIST') { el.style.color = 'var(--accent)'; el.style.fontWeight = 'bold'; }
      else { el.style.color = 'var(--text_sec)'; el.style.fontWeight = 'normal'; }
    }
  }
}

function renderJbList() {
  const l = document.getElementById('jb-list');
  l.innerHTML = ''; jbListItems = [];

  if (jbView === 'ROOT') {
    if (jbNavIndex === 0) jbListItems = jbLibrary;
    else if (jbNavIndex === 1) jbListItems = [...new Set(jbLibrary.map(t => t.artist))].sort();
    else if (jbNavIndex === 2) jbListItems = [...new Set(jbLibrary.map(t => t.album))].sort();
    else if (jbNavIndex === 3) { jbListItems = Object.keys(jbPlaylists); jbListItems.unshift("+ CREATE NEW PLAYLIST"); }
  } else if (jbView === 'ARTIST_ALBUMS') {
    let artistTracks = jbLibrary.filter(t => t.artist === jbActiveSelection);
    let albums = [...new Set(artistTracks.map(t => t.album))].sort();
    jbListItems = ["ALL SONGS", ...albums];
  } else if (jbView === 'SUBLIST_ALBUM') {
    jbListItems = jbLibrary.filter(t => t.artist === jbActiveSelection && t.album === jbSecondarySelection);
  } else {
    if (jbNavIndex === 1) jbListItems = jbLibrary.filter(t => t.artist === jbActiveSelection);
    else if (jbNavIndex === 2) jbListItems = jbLibrary.filter(t => t.album === jbActiveSelection);
    else if (jbNavIndex === 3) jbListItems = jbLibrary.filter(t => (jbPlaylists[jbActiveSelection] || []).includes(t.path));
  }

  if (jbSearchQuery && jbNavIndex === 0) {
    jbListItems = jbListItems.filter(t => t.title.toLowerCase().includes(jbSearchQuery.toLowerCase()) || t.artist.toLowerCase().includes(jbSearchQuery.toLowerCase()));
  }

  if (jbListItems.length === 0) {
    if (jbLibrary.length === 0) {
      l.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box; text-align: center; background: rgba(0,0,0,0.4); border-radius: 12px; height: 100%; border: 2px dashed var(--border_solid);">
      <div style="font-size: 32px; font-weight: 900; color: var(--accent); margin-bottom: 20px; letter-spacing: 2px;">LIBRARY EMPTY</div>
      <div style="font-size: 22px; color: var(--text_sec); line-height: 1.6;">
      To build your Jukebox collection, go to the the folder where the CREMA app is located and add your audio files to the folder:<br>
      <strong style="color: var(--text_main); display: inline-block; margin-top: 10px; background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 6px;">CREMA_CUSTOM_MUSIC</strong><br><br>
      Close and reopen the Jukebox to scan for tracks.
      </div>
      </div>`;
    } else {
      l.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text_dim); font-size: 26px; font-weight: bold; letter-spacing: 2px;">NO TRACKS FOUND</div>`;
    }
    return;
  }

  const frag = document.createDocumentFragment();
  jbListItems.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = 'game-item';
    d.id = `jb-item-${i}`;
    if (jbView === 'ROOT' && jbNavIndex !== 0) d.innerText = item;
    else if (jbView === 'ARTIST_ALBUMS') d.innerText = item;
    else d.innerText = `${item.title} - ${item.artist}`;
    frag.appendChild(d);
  });
  l.appendChild(frag);
  if (jbListIndex >= jbListItems.length) jbListIndex = 0;
  updateJbListSelection();
}

function updateJbListSelection() {
  if (jbFocus !== 'LIST' || jbListItems.length === 0) {
    document.querySelectorAll('#jb-list .game-item').forEach(el => el.classList.remove('selected'));
    return;
  }
  document.querySelectorAll('#jb-list .game-item').forEach(el => el.classList.remove('selected'));
  const sel = document.getElementById(`jb-item-${jbListIndex}`);
  if (sel) {
    sel.classList.add('selected');
    sel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

window.manualBgmPause = false;
function toggleJbPlayPause() {
  if (!isCustom || audioCfg.bgm_mode !== "CUSTOM") return;
  if (bgmAudio.paused) {
    window.manualBgmPause = false;
    bgmAudio.play().catch(e=>{});
  } else {
    window.manualBgmPause = true;
    bgmAudio.pause();
  }
}

function handleJbListAccept() {
  if (jbView === 'ROOT' && jbNavIndex !== 0) {
    const sel = jbListItems[jbListIndex];
    if (jbNavIndex === 3 && sel === "+ CREATE NEW PLAYLIST") {
      openOSK('NEW_PLAYLIST', 'PLAYLIST NAME', '');
      return;
    }
    jbActiveSelection = sel;
    if (jbNavIndex === 1) jbView = 'ARTIST_ALBUMS';
    else jbView = 'SUBLIST';
    jbListIndex = 0;
    renderJbList();
  } else if (jbView === 'ARTIST_ALBUMS') {
    const sel = jbListItems[jbListIndex];
    if (sel === "ALL SONGS") {
      jbView = 'SUBLIST';
    } else {
      jbView = 'SUBLIST_ALBUM';
      jbSecondarySelection = sel;
    }
    jbListIndex = 0;
    renderJbList();
  } else {
    const selectedTarget = jbListItems[jbListIndex];
    const selectedPath = typeof selectedTarget === 'string' ? selectedTarget : selectedTarget.path;
    const currentPath = customPlaylist[customIndex - 1] || customPlaylist[0];

    if (isCustom && audioCfg.bgm_mode === "CUSTOM" && currentPath === selectedPath) {
      toggleJbPlayPause();
      return;
    }

    jbQueue = jbListItems;
    customPlaylist = jbQueue.map(t => typeof t === 'string' ? t : t.path);
    customIndex = jbListIndex;
    isCustom = true; audioCfg.bgm_mode = "CUSTOM"; window.api.saveAudioConfig(audioCfg);

    if (jbNavIndex === 0 && jbView === 'ROOT' && !jbSearchQuery) {
      let selected = customPlaylist[customIndex];
      customPlaylist = customPlaylist.sort(() => Math.random() - 0.5);
      customPlaylist = customPlaylist.filter(p => p !== selected);
      customPlaylist.unshift(selected);
      customIndex = 0;
    }

    playNextCustom(false);
    updateJbNowPlayingUI();
  }
}

function updateJbNowPlayingUI() {
  if (!isCustom || customPlaylist.length === 0) {
    const noCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#141414"/><text x="50" y="42" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">NO</text><text x="50" y="62" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">COVER</text></svg>`;
    const svgData = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(noCoverSvg);

    const npCover = document.getElementById('jb-np-cover');
    if (npCover) npCover.src = svgData;
    document.getElementById('jb-np-title').innerText = "No Track Selected";
    document.getElementById('jb-np-artist').innerText = "---";

    if (jbIsFullscreen) {
      const fsCover = document.getElementById('jb-fs-cover');
      if (fsCover) fsCover.src = svgData;
      const fsTitle = document.getElementById('jb-fs-title'); if (fsTitle) fsTitle.innerText = "No Track Selected";
      const fsArtist = document.getElementById('jb-fs-artist'); if (fsArtist) fsArtist.innerText = "---";
      const fsCur = document.getElementById('jb-fs-current'); if (fsCur) fsCur.innerText = "0:00";
      const fsTot = document.getElementById('jb-fs-total'); if (fsTot) fsTot.innerText = "0:00";
      const fsProg = document.getElementById('jb-fs-progress'); if (fsProg) fsProg.style.width = '0%';
    }
    return;
  }

  const currentPath = customPlaylist[customIndex - 1] || customPlaylist[0];
  let meta = jbLibrary.find(t => t.path === currentPath);

  if (meta) {
    document.getElementById('jb-np-title').innerText = meta.title;
    document.getElementById('jb-np-artist').innerText = meta.artist;
  }

  window.api.getAudioMetadata(currentPath).then(track => {
    const cover = document.getElementById('jb-np-cover');
    if (track.cover) {
      cover.src = track.cover;
    } else {
      const noCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#141414"/><text x="50" y="42" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">NO</text><text x="50" y="62" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-family="sans-serif" font-size="16" font-weight="bold" letter-spacing="1">COVER</text></svg>`;
      cover.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(noCoverSvg);
    }
  });

  const qContainer = document.getElementById('jb-queue');
  qContainer.innerHTML = '';
  for(let i=0; i<10; i++) {
    let idx = customIndex + i;
    if (idx < customPlaylist.length) {
      let p = customPlaylist[idx];
      let m = jbLibrary.find(t => t.path === p);
      let text = m ? `${m.title} - ${m.artist}` : p.split('/').pop();
      let d = document.createElement('div');
      d.innerText = `${i+1}. ${text}`;
      d.style.whiteSpace = 'nowrap'; d.style.overflow = 'hidden'; d.style.textOverflow = 'ellipsis';
      if (i === 0) d.style.color = "var(--accent)";
      qContainer.appendChild(d);
    }
  }

  if (jbIsFullscreen) {
    const fsCover = document.getElementById('jb-fs-cover'); const npCover = document.getElementById('jb-np-cover');
    if (fsCover && npCover) fsCover.src = npCover.src;

    const fsTitle = document.getElementById('jb-fs-title'); const npTitle = document.getElementById('jb-np-title');
    if (fsTitle && npTitle) fsTitle.innerText = npTitle.innerText;

    const fsArtist = document.getElementById('jb-fs-artist'); const npArtist = document.getElementById('jb-np-artist');
    if (fsArtist && npArtist) fsArtist.innerText = npArtist.innerText;

    let cur = bgmAudio.currentTime || 0; let tot = bgmAudio.duration || 0;
    document.getElementById('jb-fs-current').innerText = formatJbTime(cur);
    document.getElementById('jb-fs-total').innerText = formatJbTime(tot);
    let pct = tot > 0 ? (cur / tot) * 100 : 0;
    document.getElementById('jb-fs-progress').style.width = pct + '%';
  }
}

function toggleJbFullscreen() {
  jbIsFullscreen = !jbIsFullscreen;
  const mainCont = document.querySelector('#jukebox-screen .main-container');
  const hdr = document.querySelector('#jukebox-screen .header');
  const ftr = document.getElementById('jb-footer');

  let fsView = document.getElementById('jb-fs-view');
  if (!fsView) {
    fsView = document.createElement('div');
    fsView.id = 'jb-fs-view';
    fsView.style.cssText = "position: absolute; top:0; left:0; width:100%; height:100%; z-index: 50; display: flex; flex-direction: column; justify-content: flex-end; padding: 100px; box-sizing: border-box; background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%); overflow: hidden; opacity: 0; transition: opacity 0.5s ease;";
    fsView.innerHTML = `
    <div class="xmb-wave" style="position:absolute; top:25%; left:-10%; width:120%; height:30%; background: linear-gradient(90deg, transparent, var(--accent), transparent); border-radius: 50%; opacity: 0.4; filter: blur(35px); animation: wave1 8s infinite alternate ease-in-out;"></div>
    <div class="xmb-wave" style="position:absolute; top:45%; left:-10%; width:120%; height:25%; background: linear-gradient(90deg, transparent, var(--text_sec), transparent); border-radius: 50%; opacity: 0.25; filter: blur(25px); animation: wave2 12s infinite alternate ease-in-out;"></div>
    <div class="xmb-wave" style="position:absolute; top:65%; left:-10%; width:120%; height:15%; background: linear-gradient(90deg, transparent, var(--text_main), transparent); border-radius: 50%; opacity: 0.15; filter: blur(15px); animation: wave1 10s infinite alternate-reverse ease-in-out;"></div>
    <div style="position: relative; z-index: 2; display: flex; align-items: center; gap: 50px; width: 100%;">
    <img id="jb-fs-cover" src="" style="width: 320px; height: 320px; border-radius: 15px; box-shadow: 0 20px 50px rgba(0,0,0,0.9); object-fit: cover; background: #111;">
    <div style="flex: 1; text-shadow: 0 5px 15px rgba(0,0,0,0.8);">
    <div id="jb-fs-title" style="font-size: 64px; font-weight: 900; color: #fff; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Title</div>
    <div id="jb-fs-artist" style="font-size: 36px; color: #ccc; margin-bottom: 50px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Artist</div>
    <div style="display: flex; align-items: center; gap: 20px; font-size: 24px; color: #aaa; font-weight: bold;">
    <span id="jb-fs-current" style="min-width: 80px; text-align: right;">0:00</span>
    <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.15); border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 5px rgba(0,0,0,0.8);">
    <div id="jb-fs-progress" style="width: 0%; height: 100%; background: var(--accent); box-shadow: 0 0 15px var(--accent); transition: width 1s linear;"></div>
    </div>
    <span id="jb-fs-total" style="min-width: 80px;">0:00</span>
    </div>
    </div>
    </div>

    <div id="jb-fs-controls-hint" style="position: absolute; bottom: 30px; right: 40px; color: rgba(255,255,255,0.5); font-size: 20px; font-weight: bold; z-index: 5; display: flex; align-items: center; gap: 10px;">
    ${getMappedBtn('NORTH')} Controls
    </div>

    <div id="jb-fs-controls-popup" class="hidden" style="position: absolute; bottom: 80px; right: 40px; background: rgba(0,0,0,0.85); border: 2px solid var(--border_solid); border-radius: 12px; padding: 25px; z-index: 10; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: opacity 0.3s ease;">
    <div style="color: var(--text_main); font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: 1px solid var(--border_solid); padding-bottom: 10px;">FULLSCREEN CONTROLS</div>
    <div style="color: var(--text_sec); font-size: 20px; display: flex; align-items: center; gap: 15px;">${getMappedBtn('SOUTH')} Play / Pause</div>
    <div style="color: var(--text_sec); font-size: 20px; display: flex; align-items: center; gap: 15px;">${getBtn('L3')} / ${getBtn('R3')} Prev / Next Track</div>
    <div style="color: var(--text_sec); font-size: 20px; display: flex; align-items: center; gap: 15px;">${getMappedBtn('WEST')} / ${getMappedBtn('EAST')} Exit Fullscreen</div>
    </div>
    `;
    document.getElementById('jukebox-screen').appendChild(fsView);
  }

  if (jbIsFullscreen) {
    mainCont.style.display = 'none'; hdr.style.display = 'none'; ftr.style.display = 'none';
    fsView.classList.remove('hidden'); fsView.style.opacity = '1';
    updateJbNowPlayingUI();
  } else {
    fsView.style.opacity = '0'; fsView.classList.add('hidden');
    const pop = document.getElementById('jb-fs-controls-popup');
    if (pop) pop.classList.add('hidden');
    mainCont.style.display = 'flex'; hdr.style.display = 'flex'; ftr.style.display = 'flex';
  }
}

function handleJbSelectBtn() {
  if (jbListItems.length === 0) return;

  if (jbView === 'ROOT' && jbNavIndex === 3) {
    if (jbListIndex === 0) return;
    jbActionTarget = jbListItems[jbListIndex];
    gameState = 'JUKEBOX_OVERLAY'; currentOverlayType = 'JB_PLAYLIST_OPTS';
    renderGenericOverlay(`PLAYLIST: ${jbActionTarget}`, ["REMOVE PLAYLIST", "DUPLICATE PLAYLIST", "RENAME PLAYLIST", "CANCEL"]);
  } else if ((jbView === 'ROOT' && (jbNavIndex === 1 || jbNavIndex === 2)) || jbView === 'ARTIST_ALBUMS') {
    const sel = jbListItems[jbListIndex];
    let batchType = 'ALBUM';
    let targetName = sel;
    let overlayTitle = `ALBUM: ${sel}`;

    if ((jbView === 'ROOT' && jbNavIndex === 1) || sel === "ALL SONGS") {
      batchType = 'ARTIST';
      targetName = sel === "ALL SONGS" ? jbActiveSelection : sel;
      overlayTitle = `ARTIST: ${targetName}`;
    }

    jbActionTarget = { type: batchType, name: targetName, artist: jbActiveSelection };
    gameState = 'JUKEBOX_OVERLAY'; currentOverlayType = 'JB_BATCH_ADD';

    let opts = Object.keys(jbPlaylists).map(p => `ADD TO: ${p}`);
    opts.unshift("+ CREATE NEW PLAYLIST");
    opts.push("CANCEL");
    renderGenericOverlay(overlayTitle, opts);
  } else if (jbNavIndex === 0 || jbView === 'SUBLIST' || jbView === 'SUBLIST_ALBUM') {
    jbActionTarget = jbListItems[jbListIndex];
    gameState = 'JUKEBOX_OVERLAY'; currentOverlayType = 'JB_SONG_OPTS';
    let opts = Object.keys(jbPlaylists).map(p => `ADD TO: ${p}`);
    opts.unshift("+ CREATE NEW PLAYLIST");
    if (jbNavIndex === 3 && jbView === 'SUBLIST') opts.unshift("REMOVE FROM THIS PLAYLIST");
    opts.push("CANCEL");
    renderGenericOverlay(`SONG OPTIONS`, opts);
  }
}

function executeJbOverlayAction() {
  const action = overlayItems[currentOverlayIndex];
  if (action === "CANCEL") { closeOverlay(); gameState = 'JUKEBOX'; return; }

  if (action === "+ CREATE NEW PLAYLIST" && (currentOverlayType === 'JB_BATCH_ADD' || currentOverlayType === 'JB_SONG_OPTS')) {
    closeOverlay();
    openOSK('NEW_PLAYLIST_ADD', 'NEW PLAYLIST NAME', '');
    return;
  }

  if (currentOverlayType === 'JB_PLAYLIST_OPTS') {
    if (action === "REMOVE PLAYLIST") {
      delete jbPlaylists[jbActionTarget];
      window.api.savePlaylists(jbPlaylists);
      closeOverlay(); gameState = 'JUKEBOX'; renderJbList();
    } else if (action === "DUPLICATE PLAYLIST") {
      jbPlaylists[`${jbActionTarget} Copy`] = [...jbPlaylists[jbActionTarget]];
      window.api.savePlaylists(jbPlaylists);
      closeOverlay(); gameState = 'JUKEBOX'; renderJbList();
    } else if (action === "RENAME PLAYLIST") {
      closeOverlay();
      openOSK('RENAME_PLAYLIST', 'RENAME PLAYLIST', jbActionTarget);
    }
  } else if (currentOverlayType === 'JB_BATCH_ADD') {
    if (action.startsWith("ADD TO: ")) {
      let pName = action.replace("ADD TO: ", "");
      let tracksToAdd = [];

      if (jbActionTarget.type === 'ARTIST') {
        tracksToAdd = jbLibrary.filter(t => t.artist === jbActionTarget.name);
      } else if (jbActionTarget.type === 'ALBUM') {
        if (jbView === 'ARTIST_ALBUMS') {
          tracksToAdd = jbLibrary.filter(t => t.artist === jbActionTarget.artist && t.album === jbActionTarget.name);
        } else {
          tracksToAdd = jbLibrary.filter(t => t.album === jbActionTarget.name);
        }
      }

      tracksToAdd.forEach(t => {
        if (!jbPlaylists[pName].includes(t.path)) jbPlaylists[pName].push(t.path);
      });

        window.api.savePlaylists(jbPlaylists);
        closeOverlay(); gameState = 'JUKEBOX';
    }
  } else if (currentOverlayType === 'JB_SONG_OPTS') {
    if (action === "REMOVE FROM THIS PLAYLIST") {
      let pList = jbPlaylists[jbActiveSelection];
      jbPlaylists[jbActiveSelection] = pList.filter(p => p !== jbActionTarget.path);
      window.api.savePlaylists(jbPlaylists);
      closeOverlay(); gameState = 'JUKEBOX'; renderJbList();
    } else if (action.startsWith("ADD TO: ")) {
      let pName = action.replace("ADD TO: ", "");
      if (!jbPlaylists[pName].includes(jbActionTarget.path)) {
        jbPlaylists[pName].push(jbActionTarget.path);
        window.api.savePlaylists(jbPlaylists);
      }
      closeOverlay(); gameState = 'JUKEBOX';
    }
  }
}

function handleJukeboxInput(action) {
  if (gameState === 'JUKEBOX_OVERLAY') {
    if (action === 'UP') { currentOverlayIndex = (currentOverlayIndex - 1 + overlayItems.length) % overlayItems.length; playSound(sfxNav); updateOverlaySelection(); }
    else if (action === 'DOWN') { currentOverlayIndex = (currentOverlayIndex + 1) % overlayItems.length; playSound(sfxNav); updateOverlaySelection(); }
    else if (action === 'BACK') { closeOverlay(); gameState = 'JUKEBOX'; }
    else if (action === 'ACCEPT') { playSound(sfxSelect); executeJbOverlayAction(); }
    return;
  }

  if (action === 'ACCEPT' && jbIsFullscreen) {
    playSound(sfxSelect);
    toggleJbPlayPause();
    return;
  }

  if (action === 'BACK') {
    if (jbIsFullscreen) {
      const pop = document.getElementById('jb-fs-controls-popup');
      if (pop && !pop.classList.contains('hidden')) {
        playSound(sfxBack);
        pop.classList.add('hidden');
        return;
      }
      playSound(sfxBack);
      toggleJbFullscreen();
      return;
    }
    if (jbFocus === 'LIST') {
      if (jbView === 'SUBLIST' && jbNavIndex === 1) { jbView = 'ARTIST_ALBUMS'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
      else if (jbView === 'SUBLIST_ALBUM') { jbView = 'ARTIST_ALBUMS'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
      else if (jbView !== 'ROOT') { jbView = 'ROOT'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
      else { jbFocus = 'SIDEBAR'; playSound(sfxNav); updateJbSidebar(); updateJbListSelection(); }
    } else {
      closeJukebox();
    }
  }
  else if (action === 'X_BUTTON') { playSound(sfxSelect); toggleJbFullscreen(); }
  else if (action === 'Y_BUTTON') {
    if (jbIsFullscreen) {
      playSound(sfxSelect);
      const pop = document.getElementById('jb-fs-controls-popup');
      if (pop) {
        if (pop.classList.contains('hidden')) pop.classList.remove('hidden');
        else pop.classList.add('hidden');
      }
    } else {
      playSound(sfxSelect); openOSK('JB_SEARCH', 'SEARCH MUSIC', jbSearchQuery);
    }
  }
  else if (jbFocus === 'SIDEBAR') {
    if (action === 'UP') { jbNavIndex = Math.max(0, jbNavIndex - 1); jbSearchQuery = ""; playSound(sfxNav); updateJbSidebar(); renderJbList(); }
    else if (action === 'DOWN') { jbNavIndex = Math.min(3, jbNavIndex + 1); jbSearchQuery = ""; playSound(sfxNav); updateJbSidebar(); renderJbList(); }
    else if (action === 'RIGHT' || action === 'ACCEPT') { if (jbListItems.length > 0) { jbFocus = 'LIST'; jbListIndex = 0; playSound(sfxSelect); updateJbSidebar(); updateJbListSelection(); } }
  } else if (jbFocus === 'LIST') {
    if (action === 'UP') { jbListIndex = Math.max(0, jbListIndex - 1); playSound(sfxNav); updateJbListSelection(); }
    else if (action === 'DOWN') { jbListIndex = Math.min(jbListItems.length - 1, jbListIndex + 1); playSound(sfxNav); updateJbListSelection(); }
    else if (action === 'L1') { jbListIndex = Math.max(0, jbListIndex - 10); playSound(sfxNav); updateJbListSelection(); }
    else if (action === 'R1') { jbListIndex = Math.min(jbListItems.length - 1, jbListIndex + 10); playSound(sfxNav); updateJbListSelection(); }
    else if (action === 'LEFT') {
      if (jbView !== 'ROOT') {
        if (jbView === 'SUBLIST' && jbNavIndex === 1) { jbView = 'ARTIST_ALBUMS'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
        else if (jbView === 'SUBLIST_ALBUM') { jbView = 'ARTIST_ALBUMS'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
        else { jbView = 'ROOT'; jbListIndex = 0; playSound(sfxBack); renderJbList(); }
      } else {
        jbFocus = 'SIDEBAR'; playSound(sfxNav); updateJbSidebar(); updateJbListSelection();
      }
    }
    else if (action === 'ACCEPT') { playSound(sfxSelect); handleJbListAccept(); }
    else if (action === 'SELECT_BTN') { playSound(sfxSelect); handleJbSelectBtn(); }
  }
}

boot();
