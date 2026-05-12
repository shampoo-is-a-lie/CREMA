const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');
const { spawn, exec, execFile } = require('child_process');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const mm = require('music-metadata');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// --- APPIMAGE PORTABILITY LOGIC ---
let baseDir;
if (process.env.APPIMAGE) {
    baseDir = path.dirname(process.env.APPIMAGE); // External: Where the user placed the AppImage
} else if (app.isPackaged) {
    baseDir = path.dirname(process.execPath);
} else {
    baseDir = __dirname;
}

const isPackaged = app.isPackaged;
const baseAssetPath = isPackaged ? process.resourcesPath : __dirname;
const binDir = path.join(baseAssetPath, 'assets', 'bin', 'linux');
const ytDlpPath = path.join(binDir, 'yt-dlp');
const ffmpegPath = path.join(binDir, 'ffmpeg');
const ytDlpConfigPath = path.join(binDir, 'yt-dlp.conf');

// --- UNIFIED PORTABLE PATHS ---
// User Data (EXTERNAL - Uses baseDir)
const configDir = path.join(baseDir, 'GameManagerConfig');
const dbPath = path.join(configDir, 'games.db');
const audioCfgPath = path.join(configDir, 'audio.json');
const playlistsPath = path.join(configDir, 'playlists.json');
const imagesDir = path.join(configDir, 'images');
const trailersDir = path.join(configDir, 'videos');
const musicDir = path.join(baseDir, 'CREMA_CUSTOM_MUSIC');

// App Assets (INTERNAL - Uses __dirname so it stays packed inside the AppImage)
const soundsDir = path.join(__dirname, 'assets', 'sounds');

let db;

function createWindow () {
    const win = new BrowserWindow({ width: 1280, height: 720, fullscreen: true, frame: false, backgroundColor: '#2C1E16', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, webSecurity: false } });
    win.loadFile('index.html'); win.webContents.on('did-finish-load', () => { win.webContents.insertCSS('* { cursor: none !important; }'); });
}

app.whenReady().then(() => {
    if(!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if(!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    if(!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    if(!fs.existsSync(trailersDir)) fs.mkdirSync(trailersDir, { recursive: true });
    try {
        db = new Database(dbPath);
        db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)").run();
        // FIX: Ensure the LastPlayed column exists so CREMA can register game launches
        try { db.prepare("ALTER TABLE games ADD COLUMN LastPlayed INTEGER DEFAULT 0").run(); } catch(e) {}
    } catch (err) {}
    createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('get-basedir', () => baseDir);

ipcMain.handle('get-games', async () => { if (!db) return { games: [] }; try { return { games: db.prepare("SELECT * FROM games ORDER BY Game ASC").all() }; } catch (err) { return { games: [] }; } });
ipcMain.on('launch-game', (event, cmd) => {
    if (!cmd) return;
    const child = spawn(cmd, [], { shell: true, detached: true, stdio: 'ignore' });
    child.unref();
});
ipcMain.on('quit-app', () => app.quit());
const SAVE_DB_ALLOWED_FIELDS = new Set(['FAV', 'WANT_TO_PLAY', 'LaunchCommand', 'Game', 'CoverArt', 'Screenshot', 'DEV', 'PUB', 'RELEASED', 'GENRE', 'METACRITIC', 'Description', 'ProtonTier', 'SteamAppID', 'HLTB_Main']);
ipcMain.on('save-db-field', (event, { game, field, value }) => { if (!db || !SAVE_DB_ALLOWED_FIELDS.has(field)) return; try { db.prepare(`UPDATE games SET ${field} = ? WHERE Game = ?`).run(value, game); } catch (e) {} });
ipcMain.handle('clear-history', () => {
    if (!db) return false;
    try { db.prepare("UPDATE games SET LastPlayed = 0").run(); return true; } catch(err) { return false; }
});

// FIX: New IPC Handler to securely update the LastPlayed timestamp
ipcMain.handle('update-last-played', (event, gameName) => {
    if (!db) return false;
    try {
        db.prepare("UPDATE games SET LastPlayed = ? WHERE Game = ?").run(Date.now(), gameName);
        return true;
    } catch(err) { return false; }
});

// --- NEW: WINDOW FOCUS & FOREGROUND LOGIC ---
ipcMain.on('force-focus', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
        if (process.platform === 'win32') app.focus(); // Windows specific focus steal

        // The ultimate hammer: force on top temporarily
        win.setAlwaysOnTop(true, 'screen-saver');
        setTimeout(() => {
            win.setAlwaysOnTop(false);
        }, 1000);
    }
});

ipcMain.handle('fetch-hltb', async (event, gameName) => { try { const results = await hltbService.search(gameName); if (results.length > 0 && results[0].gameplayMain > 0) return `${results[0].gameplayMain} Hours`; return "Unknown"; } catch (e) { return "Error"; } });
ipcMain.handle('fetch-proton', async (event, appId) => { try { const response = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`); if (!response.ok) return "Error"; const data = await response.json(); return data.tier ? data.tier : "Unknown"; } catch (e) { return "Error"; } });

// --- BEAUTIFUL NAMING HELPERS ---
function getBeautifulName(gameName) { return gameName.replace(/[\\/:*?"<>|#]/g, '').trim(); }
function getOldCrushedName(gameName) { return gameName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); }

// Trailer logic checks BOTH naming conventions so old trailers don't break!
ipcMain.handle('check-local-trailer', (event, gameName) => {
    const beautifulPath = path.join(trailersDir, `${getBeautifulName(gameName)}.mp4`);
    const oldPath = path.join(trailersDir, `${getOldCrushedName(gameName)}.mp4`);
    if (fs.existsSync(beautifulPath)) return `file://${beautifulPath}`;
        if (fs.existsSync(oldPath)) return `file://${oldPath}`;
            return null;
});

ipcMain.handle('delete-trailer', (event, gameName) => {
    const beautifulPath = path.join(trailersDir, `${getBeautifulName(gameName)}.mp4`);
    const oldPath = path.join(trailersDir, `${getOldCrushedName(gameName)}.mp4`);
    try {
        if (fs.existsSync(beautifulPath)) fs.unlinkSync(beautifulPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        return true;
    } catch(e) { return false; }
});

async function downloadImage(url, dest) { try { const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!res.ok) return false; const buffer = await res.arrayBuffer(); fs.writeFileSync(dest, Buffer.from(buffer)); return true; } catch(e) { return false; } }

ipcMain.handle('get-setting', (e, key) => { try { const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key); return row ? row.value : null; } catch(e) { return null; } });
ipcMain.handle('set-setting', (e, key, val) => { try { db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, val); return true; } catch(e) { return false; } });

ipcMain.handle('search-steam', async (e, gameName) => { try { let res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`); let data = await res.json(); if (!data.items || data.items.length === 0) return []; return data.items.map(item => ({ id: item.id, name: item.name })); } catch(e) { return []; } });

ipcMain.handle('sgdb-search', async (e, gameName, apiKey, appId) => {
    try {
        const headers = { "Authorization": `Bearer ${apiKey}`, "User-Agent": "Mozilla/5.0" }; let sgdbId = null;
        if (appId) { let r = await fetch(`https://www.steamgriddb.com/api/v2/games/steam/${appId}`, {headers}); let d = await r.json(); if (d.success && d.data) sgdbId = d.data.id; }
            if (!sgdbId) { let res = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`, {headers}); let data = await res.json(); if (!data.success || !data.data || data.data.length === 0) return []; sgdbId = data.data[0].id; }
                let res2 = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${sgdbId}?dimensions=600x900`, {headers}); let data2 = await res2.json(); if (!data2.success || !data2.data) return []; return data2.data.map(g => ({ thumb: g.thumb, url: g.url }));
    } catch(e) { return []; }
});

ipcMain.handle('sgdb-apply', async (e, gameName, url) => {
    const fileName = `${getBeautifulName(gameName)} - Custom Cover.jpg`;
    const savePath = path.join(imagesDir, fileName);
    const success = await downloadImage(url, savePath);
    if (success) {
        db.prepare("UPDATE games SET CoverArt = ? WHERE Game = ?").run(`GameManagerConfig/images/${fileName}`, gameName);
    }
    return success;
});

ipcMain.handle('scrape-steam-data', async (e, gameName, mode, appId) => {
    try {
        const beautifulName = getBeautifulName(gameName);
        if (!appId) return false;

        let res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        let data = await res.json();
        if (!data[appId].success) return false;
        let appData = data[appId].data;
        let overallSuccess = false;

        if (mode === 'COVER' || mode === 'ALL') {
            const fileName = `${beautifulName} - Cover.jpg`;
            let url = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`;
            let savePath = path.join(imagesDir, fileName);
            let success = await downloadImage(url, savePath);
            if (!success) { url = appData.header_image; success = await downloadImage(url, savePath); }
            if (success) {
                db.prepare("UPDATE games SET CoverArt = ? WHERE Game = ?").run(`GameManagerConfig/images/${fileName}`, gameName);
                overallSuccess = true;
            }
        }
        if (mode === 'SCREENSHOTS' || mode === 'ALL') {
            if (appData.screenshots) {
                let dbPaths = [];
                for (let i=0; i<Math.min(5, appData.screenshots.length); i++) {
                    const fileName = `${beautifulName} - Screen ${i+1}.jpg`;
                    let url = appData.screenshots[i].path_full;
                    let p = path.join(imagesDir, fileName);
                    if (await downloadImage(url, p)) {
                        dbPaths.push(`GameManagerConfig/images/${fileName}`);
                    }
                }
                if (dbPaths.length > 0) {
                    db.prepare("UPDATE games SET Screenshot = ? WHERE Game = ?").run(dbPaths.join('|'), gameName);
                    overallSuccess = true;
                }
            }
        }
        if (mode === 'METADATA' || mode === 'ALL') {
            let genre = appData.genres ? appData.genres.map(g => g.description).join(', ') : ""; let release = appData.release_date && appData.release_date.date ? appData.release_date.date.slice(-4) : ""; let meta = appData.metacritic ? appData.metacritic.score : ""; let dev = appData.developers ? appData.developers.join(', ') : ""; let pub = appData.publishers ? appData.publishers.join(', ') : ""; let desc = appData.short_description || "";
            db.prepare("UPDATE games SET GENRE=?, RELEASED=?, METACRITIC=?, DEV=?, PUB=?, Description=?, SteamAppID=? WHERE Game=?").run(genre, release, meta, dev, pub, desc, appId, gameName);
            overallSuccess = true;
        }
        return overallSuccess;
    } catch(err) { return false; }
});

ipcMain.handle('search-youtube', async (event, gameName) => { const query = `${gameName} gameplay trailer no commentary`; return new Promise((resolve) => { const args = [ '--config-location', ytDlpConfigPath, `ytsearch5:${query}`, '--print', '%(id)s|%(thumbnail)s|%(title)s' ]; execFile(ytDlpPath, args, (error, stdout, stderr) => { if (error || !stdout) resolve([]); else { const lines = stdout.split('\n').filter(l => l.trim() !== ""); const results = lines.map(line => { const parts = line.split('|'); return { id: parts[0], thumbnail: parts[1], title: parts.slice(2).join('|') }; }); resolve(results); } }); }); });

// Downloads trailer using the new beautiful naming convention
ipcMain.handle('download-trailer', (event, gameName, videoId) => {
    const fileName = `${getBeautifulName(gameName)}.mp4`;
    const filePath = path.join(trailersDir, fileName);
    const win = BrowserWindow.getFocusedWindow();
    const args = [ '--config-location', ytDlpConfigPath, '--ffmpeg-location', ffmpegPath, `https://www.youtube.com/watch?v=${videoId}`, '-f', 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', filePath, '--no-part', '--newline' ];
    return new Promise((resolve) => { const ytdlp = spawn(ytDlpPath, args); ytdlp.stdout.on('data', (data) => { const match = data.toString().match(/\[download\]\s+(\d+(\.\d+)?)%/); if (match && match[1]) { if (win) win.webContents.send('download-progress', parseFloat(match[1])); } }); ytdlp.on('close', (code) => resolve(code === 0)); });
});

ipcMain.handle('get-audio-config', () => {
    try {
        if (fs.existsSync(audioCfgPath)) return JSON.parse(fs.readFileSync(audioCfgPath, 'utf8'));
    } catch(e){}
    // UPDATED DEFAULT SCREENSAVER TO 'CN WALLPAPERS'
    return { bgm: true, sfx: true, vol: 0.3, bgm_mode: "JAZZ", theme: "CREMA (DEFAULT)", screensaver: "CN WALLPAPERS", screensaverDelay: 3, gamepadLayout: "XBOX", wakeMethod: "START + SELECT" };
});

ipcMain.on('save-audio-config', (e, cfg) => { try { fs.writeFileSync(audioCfgPath, JSON.stringify(cfg)); } catch(err){} });
ipcMain.handle('get-custom-music', () => { let playlist = []; try { if (fs.existsSync(musicDir)) { const files = fs.readdirSync(musicDir); for (let f of files) { if (f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.ogg') || f.toLowerCase().endsWith('.flac')) { playlist.push(`file://${path.join(musicDir, f)}`); } } } } catch(e) {} return playlist; });
ipcMain.handle('get-standard-bgm', (event, mode) => { const safeName = mode.toLowerCase().replace('-', ''); for (let ext of ['wav', 'mp3', 'ogg']) { const p = path.join(soundsDir, `bgm_${safeName}.${ext}`); if (fs.existsSync(p)) return `file://${p}`; } return null; });

// --- NEW IPC: READ CN WALLPAPERS DIRECTORY ---
ipcMain.handle('get-wallpapers', () => {
    let wallpapers = [];
    try {
        // INTERNAL ASSET DIRECTORY
        const wpDir = path.join(__dirname, 'assets', 'wallpapers');
        if (fs.existsSync(wpDir)) {
            const files = fs.readdirSync(wpDir);
            for (let f of files) {
                if (f.match(/\.(jpg|jpeg|png|webp)$/i)) {
                    wallpapers.push(`file://${path.join(wpDir, f)}`);
                }
            }
        }
    } catch(e) {}
    return wallpapers;
});

ipcMain.handle('run-batch-scrape', async (event) => {
    if (!db) return false; const win = BrowserWindow.getFocusedWindow();
    const missing = db.prepare("SELECT Game, SteamAppID, HLTB_Main, ProtonTier FROM games WHERE (HLTB_Main IS NULL OR HLTB_Main = '' OR HLTB_Main = 'Searching...' OR HLTB_Main = 'Unknown') OR (SteamAppID IS NOT NULL AND SteamAppID != 'None' AND SteamAppID != '' AND (ProtonTier IS NULL OR ProtonTier = '' OR ProtonTier = 'Scanning...' OR ProtonTier = 'UNKNOWN'))").all();
    if (missing.length === 0) { if (win) win.webContents.send('scrape-progress', { game: "Database is fully scraped!", percent: 100 }); return true; }
    for (let i = 0; i < missing.length; i++) {
        const g = missing[i]; const p = Math.floor((i / missing.length) * 100); if (win) win.webContents.send('scrape-progress', { game: `Scraping: ${g.Game}`, percent: p });
        if (!g.HLTB_Main || g.HLTB_Main === '' || g.HLTB_Main === 'Searching...' || g.HLTB_Main === 'Unknown') { try { const res = await hltbService.search(g.Game); const val = (res.length > 0 && res[0].gameplayMain > 0) ? `${res[0].gameplayMain} Hours` : "Unknown"; db.prepare(`UPDATE games SET HLTB_Main = ? WHERE Game = ?`).run(val, g.Game); } catch(e) {} }
        if (g.SteamAppID && g.SteamAppID !== 'None' && g.SteamAppID !== '' && (!g.ProtonTier || g.ProtonTier === '' || g.ProtonTier === 'Scanning...' || g.ProtonTier === 'UNKNOWN')) { try { const pRes = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${g.SteamAppID}.json`); if (pRes.ok) { const data = await pRes.json(); const tier = data.tier ? data.tier.toUpperCase() : "UNKNOWN"; db.prepare(`UPDATE games SET ProtonTier = ? WHERE Game = ?`).run(tier, g.Game); } } catch(e) {} }
            await new Promise(resolve => setTimeout(resolve, 300));
    }
    if (win) win.webContents.send('scrape-progress', { game: "✅ Batch Scrape Complete!", percent: 100 }); return true;
});

ipcMain.handle('get-audio-metadata', async (e, filePath) => {
    try {
        const cleanPath = filePath.replace('file://', '');
        const metadata = await mm.parseFile(cleanPath);
        let cover = null;
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const pic = metadata.common.picture[0];
            cover = `data:${pic.format};base64,${pic.data.toString('base64')}`;
        }
        return { title: metadata.common.title || path.basename(cleanPath), artist: metadata.common.artist || "Unknown Artist", cover: cover };
    } catch(err) { return { title: path.basename(filePath), artist: "Unknown Artist", cover: null }; }
});

ipcMain.handle('get-music-library', async () => {
    let library = [];
    try {
        if (fs.existsSync(musicDir)) {
            const files = fs.readdirSync(musicDir);
            for (let f of files) {
                if (f.match(/\.(mp3|wav|ogg|flac)$/i)) {
                    const p = path.join(musicDir, f);
                    try {
                        const meta = await mm.parseFile(p);
                        library.push({ path: `file://${p}`, title: meta.common.title || f, artist: meta.common.artist || 'Unknown Artist', album: meta.common.album || 'Unknown Album' });
                    } catch(e) { library.push({ path: `file://${p}`, title: f, artist: 'Unknown Artist', album: 'Unknown Album' }); }
                }
            }
        }
    } catch(e) {}
    return library;
});

ipcMain.handle('get-playlists', () => { try { if (fs.existsSync(playlistsPath)) return JSON.parse(fs.readFileSync(playlistsPath, 'utf8')); } catch(e){} return {}; });
ipcMain.on('save-playlists', (e, pl) => { try { fs.writeFileSync(playlistsPath, JSON.stringify(pl)); } catch(err){} });
