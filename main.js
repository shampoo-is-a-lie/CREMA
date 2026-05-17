const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Database = require('better-sqlite3');
const { spawn, exec, execFile } = require('child_process');
const https = require('https');
const mm = require('music-metadata');

async function searchHltb(gameName) {
    const initData = await new Promise((resolve, reject) => {
        const req = https.get(`https://howlongtobeat.com/api/bleed/init?t=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'referer': 'https://howlongtobeat.com/',
            }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    });
    const { token, hpKey, hpVal } = initData;
    const payload = {
        searchType: 'games', searchTerms: gameName.trim().split(' '),
        searchPage: 1, size: 5,
        searchOptions: {
            games: { userId: 0, platform: '', sortCategory: 'popular', rangeCategory: 'main', rangeTime: { min: 0, max: 0 }, gameplay: { perspective: '', flow: '', genre: '', difficulty: '' }, rangeYear: { min: 0, max: 0 }, modifier: '' },
            users: { sortCategory: 'postcount' }, lists: { sortCategory: 'all' },
            filter: '', sort: 0, randomizer: 0
        },
        useCache: true
    };
    if (hpKey) payload[hpKey] = hpVal;
    const body = JSON.stringify(payload);
    return new Promise((resolve, reject) => {
        const req = https.request({ hostname: 'howlongtobeat.com', path: '/api/bleed', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'origin': 'https://howlongtobeat.com', 'referer': 'https://howlongtobeat.com/search',
                'x-auth-token': token, 'x-hp-key': hpKey, 'x-hp-val': hpVal }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data).data || []); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
        req.write(body); req.end();
    });
}

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
    win.loadFile('index.html'); win.webContents.on('did-finish-load', () => { win.webContents.insertCSS('* { cursor: none !important; }'); startSteamInstallWatcher(win); });
}

app.whenReady().then(() => {
    if(!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if(!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    if(!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    if(!fs.existsSync(trailersDir)) fs.mkdirSync(trailersDir, { recursive: true });
    try {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)").run();
        // FIX: Ensure the LastPlayed column exists so CREMA can register game launches
        try { db.prepare("ALTER TABLE games ADD COLUMN LastPlayed INTEGER DEFAULT 0").run(); } catch(e) {}
        try { db.prepare("ALTER TABLE games ADD COLUMN Description_i18n TEXT DEFAULT ''").run(); } catch(e) {}
        try { db.prepare("ALTER TABLE games ADD COLUMN Franchise TEXT DEFAULT ''").run(); } catch(e) {}
        try { db.prepare("ALTER TABLE games ADD COLUMN IGDBTrailer TEXT DEFAULT ''").run(); } catch(e) {}
        try { db.prepare("ALTER TABLE games ADD COLUMN Installed INTEGER DEFAULT 1").run(); } catch(e) {}
    } catch (err) {}
    createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const STEAM_LANG_MAP = { en: 'english', pt_BR: 'brazilian' };
async function fetchDescI18n(appId, enDesc) {
    const lang = db?.prepare("SELECT value FROM settings WHERE key='language'").get()?.value || 'en';
    const i18n = { en: enDesc };
    if (lang !== 'en' && STEAM_LANG_MAP[lang]) {
        try {
            const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=${STEAM_LANG_MAP[lang]}`);
            const d = await r.json();
            if (d[appId]?.success) i18n[lang] = d[appId].data.short_description || enDesc;
        } catch(e) {}
    }
    return JSON.stringify(i18n);
}

ipcMain.handle('get-basedir', () => baseDir);

ipcMain.handle('get-games', async () => { if (!db) return { games: [] }; try { return { games: db.prepare("SELECT * FROM games ORDER BY Game ASC").all() }; } catch (err) { return { games: [] }; } });
ipcMain.on('launch-game', (event, cmd) => {
    if (!cmd) return;
    const child = spawn(cmd, [], { shell: true, detached: true, stdio: 'ignore' });
    child.unref();
});
ipcMain.on('quit-app', () => app.quit());
const SAVE_DB_ALLOWED_FIELDS = new Set(['FAV', 'WANT_TO_PLAY', 'LaunchCommand', 'Game', 'CoverArt', 'Screenshot', 'DEV', 'PUB', 'RELEASED', 'GENRE', 'METACRITIC', 'Description', 'Description_i18n', 'ProtonTier', 'SteamAppID', 'HLTB_Main', 'Installed']);

function getSteamLibraryPaths() {
    const home = os.homedir();
    const roots = [
        path.join(home, '.local', 'share', 'Steam'),
        path.join(home, '.var', 'app', 'com.valvesoftware.Steam', 'data', 'steam'),
        path.join(home, '.steam', 'steam'),
    ];
    const dirs = new Set();
    for (const root of roots) {
        const sa = path.join(root, 'steamapps');
        if (!fs.existsSync(sa)) continue;
        dirs.add(sa);
        try {
            const vdf = path.join(sa, 'libraryfolders.vdf');
            if (fs.existsSync(vdf)) {
                const content = fs.readFileSync(vdf, 'utf8');
                for (const m of content.matchAll(/"path"\s+"([^"]+)"/g)) {
                    const extra = path.join(m[1], 'steamapps');
                    if (fs.existsSync(extra)) dirs.add(extra);
                }
            }
        } catch(e) {}
    }
    return [...dirs];
}
function isSteamGameInstalled(appId) {
    if (!appId || appId === 'None' || appId === '') return false;
    const id = String(appId).replace(/\.0+$/, '');
    return getSteamLibraryPaths().some(dir => fs.existsSync(path.join(dir, `appmanifest_${id}.acf`)));
}
function parseHeroicInstalledIds(raw) {
    const items = Array.isArray(raw) ? raw
        : Array.isArray(raw.installed) ? raw.installed
        : Object.values(raw);
    const ids = new Set();
    for (const item of items) {
        const id = String(item.app_name || item.appName || item.appID || '');
        if (id) ids.add(id);
    }
    return ids;
}

function isHeroicGameInstalled(launchCommand) {
    if (!launchCommand) return null;
    const match = launchCommand.match(/heroic:\/\/launch\/(epic|gog|amazon)\/([^"\s]+)/i);
    if (!match) return null;
    const [, storeType, appId] = match;
    const home = os.homedir();
    const heroicBases = [path.join(home, '.config', 'heroic'), path.join(home, '.var', 'app', 'com.heroicgameslauncher.hgl', 'config', 'heroic')];
    const rel = { epic: path.join('legendaryConfig','legendary','installed.json'), gog: path.join('gog_store','installed.json'), amazon: path.join('nile_config','nile','installed.json') };
    for (const base of heroicBases) {
        const p = path.join(base, rel[storeType] || '');
        if (!fs.existsSync(p)) continue;
        try { const ids = parseHeroicInstalledIds(JSON.parse(fs.readFileSync(p,'utf8'))); return ids.has(appId) ? true : null; } catch(e) {}
    }
    return null; // positive install not confirmed — preserve existing DB value (defaults to 1)
}
function resolveInstallState(launchCommand, steamAppId) {
    const cmd = launchCommand || '';
    if (/heroic:\/\/launch/i.test(cmd)) {
        const h = isHeroicGameInstalled(cmd);
        return h === true ? 1 : null; // only write 1 when confirmed; never force 0
    }
    if (/steam:\/\/rungameid/i.test(cmd) && steamAppId && steamAppId !== 'None' && steamAppId !== '') {
        return isSteamGameInstalled(steamAppId) ? 1 : 0;
    }
    return null;
}
ipcMain.handle('verify-install-status', (e, gameId) => {
    if (!db) return { installed: 1 };
    const game = db.prepare("SELECT id, SteamAppID, LaunchCommand, Installed FROM games WHERE id=?").get(gameId);
    if (!game) return { installed: 1 };
    const installed = resolveInstallState(game.LaunchCommand, game.SteamAppID);
    if (installed !== null) db.prepare("UPDATE games SET Installed=? WHERE id=?").run(installed, gameId);
    return { installed: installed ?? game.Installed ?? 1 };
});
ipcMain.handle('open-install-url', async (e, url) => { if (url) await shell.openExternal(url); });

let steamInstallWatchers = [];
function startSteamInstallWatcher(win) {
    steamInstallWatchers.forEach(w => { try { w.close(); } catch(e) {} });
    steamInstallWatchers = [];
    let debounce = null;
    const onChange = (ev, filename) => {
        if (!filename || !filename.startsWith('appmanifest_')) return;
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            if (!db) return;
            const games = db.prepare("SELECT id, SteamAppID, LaunchCommand FROM games WHERE LaunchCommand IS NOT NULL AND LaunchCommand != ''").all();
            for (const g of games) {
                const s = resolveInstallState(g.LaunchCommand, g.SteamAppID);
                if (s !== null) db.prepare("UPDATE games SET Installed=? WHERE id=?").run(s, g.id);
            }
            if (win) win.webContents.send('install-status-updated');
        }, 1500);
    };
    for (const dir of getSteamLibraryPaths()) {
        try { steamInstallWatchers.push(fs.watch(dir, { persistent: false }, onChange)); } catch(e) {}
    }
}
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

// --- WINDOW FOCUS & FOREGROUND LOGIC ---
ipcMain.on('force-focus', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;

    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    app.focus({ steal: true }); // Electron's own steal flag, works on some Linux WMs

    // Visually pin on top, then release after the launcher has been pushed behind
    win.setAlwaysOnTop(true, 'screen-saver');
    setTimeout(() => win.setAlwaysOnTop(false), 2000);

    // X11 only: wmctrl sends _NET_ACTIVE_WINDOW with CurrentTime, which most
    // X11 WMs accept even with focus-stealing prevention enabled.
    // On Wayland this is a no-op (wmctrl not installed / XWayland may ignore it).
    if (process.platform === 'linux') {
        try {
            const hwnd = win.getNativeWindowHandle().readUInt32LE(0);
            const hexId = '0x' + hwnd.toString(16);
            execFile('wmctrl', ['-i', '-a', hexId], () => {});
        } catch (_) {}
    }
});

ipcMain.handle('fetch-hltb', async (event, gameName) => { try { const results = await searchHltb(gameName); if (results.length > 0 && results[0].comp_main > 0) return `${Math.round(results[0].comp_main / 3600)} Hours`; return "Unknown"; } catch (e) { return "Error"; } });
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

async function getIgdbToken() {
    const clientId = db?.prepare("SELECT value FROM settings WHERE key='igdb_client_id'").get()?.value;
    const secret   = db?.prepare("SELECT value FROM settings WHERE key='igdb_client_secret'").get()?.value;
    if (!clientId || !secret) return null;
    const cached = db.prepare("SELECT value FROM settings WHERE key='igdb_token'").get()?.value;
    const expiry = db.prepare("SELECT value FROM settings WHERE key='igdb_token_expiry'").get()?.value;
    if (cached && expiry && Date.now() < parseInt(expiry)) return { token: cached, clientId };
    try {
        const res  = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`, { method: 'POST' });
        const data = await res.json();
        if (!data.access_token) return null;
        const exp = Date.now() + (data.expires_in * 1000) - 86400000;
        db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('igdb_token',?)").run(data.access_token);
        db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('igdb_token_expiry',?)").run(String(exp));
        return { token: data.access_token, clientId };
    } catch(e) { return null; }
}
async function igdbQuery(auth, body) {
    const res = await fetch('https://api.igdb.com/v4/games', { method: 'POST', headers: { 'Client-ID': auth.clientId, 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'text/plain' }, body });
    const data = await res.json();
    if (!Array.isArray(data) || data[0]?.title) return null;
    return data[0] || null;
}
async function igdbSearch(gameName, steamAppId) {
    const auth = await getIgdbToken();
    if (!auth) return null;
    const fields = 'fields name,summary,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,genres.name,themes.name,first_release_date,aggregated_rating,cover.url,screenshots.url,similar_games.name,franchises.name,collection.name,external_games.category,external_games.uid;';
    try {
        if (steamAppId) {
            const byId = await igdbQuery(auth, `${fields} where external_games.uid = "${steamAppId}" & external_games.category = 1; limit 1;`);
            if (byId) return byId;
        }
        return await igdbQuery(auth, `search "${gameName.replace(/"/g, '')}"; ${fields} limit 3;`);
    } catch(e) { return null; }
}
function igdbImg(url, size = 'cover_big') { if (!url) return null; return 'https:' + url.replace('t_thumb', `t_${size}`); }

async function sgdbFetchFirst(gameName, apiKey, appId, assetType) {
    try {
        const headers = { "Authorization": `Bearer ${apiKey}`, "User-Agent": "Mozilla/5.0" };
        let sgdbId = null;
        if (appId) { const r = await fetch(`https://www.steamgriddb.com/api/v2/games/steam/${appId}`, { headers }); const d = await r.json(); if (d.success && d.data) sgdbId = d.data.id; }
        if (!sgdbId) { const res = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`, { headers }); const data = await res.json(); if (!data.success || !data.data?.length) return null; sgdbId = data.data[0].id; }
        const endpoint = assetType === 'hero' ? 'heroes' : assetType === 'logo' ? 'logos' : 'grids';
        const res2 = await fetch(`https://www.steamgriddb.com/api/v2/${endpoint}/game/${sgdbId}`, { headers });
        const data2 = await res2.json();
        if (!data2.success || !data2.data?.length) return null;
        const ext = assetType === 'logo' ? 'png' : 'jpg';
        const safeN = gameName.replace(/[\\/:*?"<>|#]/g, '').trim();
        const fileName = `${safeN} - SGDB ${assetType}.${ext}`;
        if (await downloadImage(data2.data[0].url, path.join(imagesDir, fileName))) return `GameManagerConfig/images/${fileName}`;
        return null;
    } catch(e) { return null; }
}

ipcMain.handle('get-setting', (e, key) => { try { const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key); return row ? row.value : null; } catch(e) { return null; } });
ipcMain.handle('set-setting', (e, key, val) => { try { db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, val); return true; } catch(e) { return false; } });
ipcMain.handle('get-strings', (_, lang) => require('./i18n')(lang || 'en'));

ipcMain.handle('search-steam', async (e, gameName) => { try { let res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`); let data = await res.json(); if (!data.items || data.items.length === 0) return []; return data.items.map(item => ({ id: item.id, name: item.name })); } catch(e) { return []; } });

ipcMain.handle('search-igdb', async (e, gameName) => {
    try {
        const auth = await getIgdbToken();
        if (!auth) return [];
        const res = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: { 'Client-ID': auth.clientId, 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'text/plain' },
            body: `search "${gameName.replace(/"/g, '')}"; fields id,name,first_release_date; limit 8;`
        });
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data.filter(g => g.name).map(g => ({ id: g.id, name: g.name, year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null }));
    } catch(e) { return []; }
});

ipcMain.handle('scrape-igdb-data', async (e, gameName, mode, igdbId) => {
    try {
        const auth = await getIgdbToken();
        if (!auth) return false;
        const fields = 'fields name,summary,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,genres.name,themes.name,first_release_date,aggregated_rating,cover.url,screenshots.url,similar_games.name,franchises.name,collection.name,external_games.category,external_games.uid;';
        const res = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: { 'Client-ID': auth.clientId, 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'text/plain' },
            body: `${fields} where id = ${igdbId}; limit 1;`
        });
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]) return false;
        const igdb = data[0];
        const beautifulName = getBeautifulName(gameName);
        const steamExt = igdb.external_games?.find(ex => ex.category === 1);
        const steamAppId = steamExt?.uid ? String(steamExt.uid).replace(/\.0+$/, '') : null;
        let overallSuccess = false;

        if (mode === 'COVER' || mode === 'ALL') {
            // Cover — Steam CDN preferred, IGDB fallback
            const coverFile = `${beautifulName} - Cover.jpg`;
            let coverOk = steamAppId ? await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${steamAppId}/library_600x900.jpg`, path.join(imagesDir, coverFile)) : false;
            if (!coverOk && igdb.cover?.url) coverOk = await downloadImage(igdbImg(igdb.cover.url, 'cover_big'), path.join(imagesDir, coverFile));
            if (coverOk) { db.prepare("UPDATE games SET CoverArt=? WHERE Game=?").run(`GameManagerConfig/images/${coverFile}`, gameName); overallSuccess = true; }

            // Hero Art — Steam CDN only
            if (steamAppId) {
                const heroFile = `${beautifulName} - Hero.jpg`;
                if (await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${steamAppId}/library_hero.jpg`, path.join(imagesDir, heroFile)))
                    db.prepare("UPDATE games SET HeroArt=? WHERE Game=?").run(`GameManagerConfig/images/${heroFile}`, gameName);
            }

            // Logo — Steam CDN, then SGDB
            const logoFile = `${beautifulName} - Logo.png`;
            let logoOk = steamAppId ? await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${steamAppId}/logo.png`, path.join(imagesDir, logoFile)) : false;
            if (!logoOk) {
                const sgdbKey = db?.prepare("SELECT value FROM settings WHERE key='steamgriddb_api'").get()?.value;
                if (sgdbKey) { const p = await sgdbFetchFirst(gameName, sgdbKey, steamAppId, 'logo'); if (p) { db.prepare("UPDATE games SET Logo=? WHERE Game=?").run(p, gameName); logoOk = true; } }
            }
            if (logoOk && !db?.prepare("SELECT Logo FROM games WHERE Game=?").get(gameName)?.Logo?.startsWith('GameManager'))
                db.prepare("UPDATE games SET Logo=? WHERE Game=?").run(`GameManagerConfig/images/${logoFile}`, gameName);
        }

        if (mode === 'SCREENSHOTS' || mode === 'ALL') {
            const saved = [];
            if (igdb.screenshots?.length) {
                for (let i = 0; i < Math.min(5, igdb.screenshots.length); i++) {
                    const fn = `${beautifulName} - Screen ${i+1}.jpg`;
                    if (await downloadImage(igdbImg(igdb.screenshots[i].url, 'screenshot_big'), path.join(imagesDir, fn)))
                        saved.push(`GameManagerConfig/images/${fn}`);
                }
            }
            if (saved.length) { db.prepare("UPDATE games SET Screenshot=? WHERE Game=?").run(saved.join('|'), gameName); overallSuccess = true; }
        }

        if (mode === 'METADATA' || mode === 'ALL') {
            const genre   = [...(igdb.genres?.map(g => g.name) || []), ...(igdb.themes?.map(t => t.name) || [])].slice(0, 3).join(', ');
            const release = igdb.first_release_date ? new Date(igdb.first_release_date * 1000).getFullYear().toString() : "";
            const meta    = igdb.aggregated_rating ? Math.round(igdb.aggregated_rating).toString() : "";
            const dev     = igdb.involved_companies?.filter(c => c.developer).map(c => c.company.name).join(', ') || "";
            const pub     = igdb.involved_companies?.filter(c => c.publisher).map(c => c.company.name).join(', ') || "";
            const desc    = igdb.summary || "";
            const similar = igdb.similar_games?.map(g => g.name).slice(0, 6).join(', ') || "";
            const franchise = igdb.franchises?.[0]?.name || igdb.collection?.name || "";
            let hltb = "", proton = "";
            try { let hr = await searchHltb(gameName); if (hr.length > 0 && hr[0].comp_main > 0) hltb = `${Math.round(hr[0].comp_main / 3600)} Hours`; } catch(e) {}
            if (steamAppId) { try { const pr = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${steamAppId}.json`); if (pr.ok) { const pd = await pr.json(); if (pd.tier) proton = pd.tier.toUpperCase(); } } catch(e) {} }
            const descI18n = await fetchDescI18n(steamAppId, desc);
            db.prepare("UPDATE games SET GENRE=?,RELEASED=?,METACRITIC=?,DEV=?,PUB=?,Description=?,Description_i18n=?,SteamAppID=?,HLTB_Main=?,ProtonTier=?,SimilarGames=?,Franchise=? WHERE Game=?")
              .run(genre, release, meta, dev, pub, desc, descI18n, steamAppId || "", hltb, proton, similar, franchise, gameName);
            overallSuccess = true;
        }

        return overallSuccess;
    } catch(err) { return false; }
});

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

        const steamRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const steamJson = await steamRes.json();
        if (!steamJson[appId]?.success) return false;
        const appData = steamJson[appId].data;
        let overallSuccess = false;

        // ── COVER + HERO + LOGO ───────────────────────────────────────────
        if (mode === 'COVER' || mode === 'ALL') {
            // Cover
            const coverFile = `${beautifulName} - Cover.jpg`;
            let coverOk = await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`, path.join(imagesDir, coverFile));
            if (!coverOk && appData.header_image) coverOk = await downloadImage(appData.header_image, path.join(imagesDir, coverFile));
            if (coverOk) { db.prepare("UPDATE games SET CoverArt=? WHERE Game=?").run(`GameManagerConfig/images/${coverFile}`, gameName); overallSuccess = true; }

            // Hero Art
            const heroFile = `${beautifulName} - Hero.jpg`;
            if (await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_hero.jpg`, path.join(imagesDir, heroFile)))
                db.prepare("UPDATE games SET HeroArt=? WHERE Game=?").run(`GameManagerConfig/images/${heroFile}`, gameName);

            // Logo — Steam CDN first, SGDB fallback
            const logoFile = `${beautifulName} - Logo.png`;
            let logoOk = await downloadImage(`https://steamcdn-a.akamaihd.net/steam/apps/${appId}/logo.png`, path.join(imagesDir, logoFile));
            if (!logoOk) {
                const sgdbKey = db?.prepare("SELECT value FROM settings WHERE key='steamgriddb_api'").get()?.value;
                if (sgdbKey) { const p = await sgdbFetchFirst(gameName, sgdbKey, appId, 'logo'); if (p) { db.prepare("UPDATE games SET Logo=? WHERE Game=?").run(p, gameName); logoOk = true; } }
            }
            if (logoOk && !db?.prepare("SELECT Logo FROM games WHERE Game=?").get(gameName)?.Logo?.startsWith('GameManager'))
                db.prepare("UPDATE games SET Logo=? WHERE Game=?").run(`GameManagerConfig/images/${logoFile}`, gameName);
        }

        // ── SCREENSHOTS ───────────────────────────────────────────────────
        if (mode === 'SCREENSHOTS' || mode === 'ALL') {
            if (appData.screenshots?.length) {
                const saved = [];
                for (let i = 0; i < Math.min(5, appData.screenshots.length); i++) {
                    const fn = `${beautifulName} - Screen ${i+1}.jpg`;
                    if (await downloadImage(appData.screenshots[i].path_full, path.join(imagesDir, fn)))
                        saved.push(`GameManagerConfig/images/${fn}`);
                }
                if (saved.length) { db.prepare("UPDATE games SET Screenshot=? WHERE Game=?").run(saved.join('|'), gameName); overallSuccess = true; }
            }
        }

        // ── METADATA ──────────────────────────────────────────────────────
        if (mode === 'METADATA' || mode === 'ALL') {
            let genre   = appData.genres?.map(g => g.description).join(', ') || "";
            let release = appData.release_date?.date?.slice(-4) || "";
            let meta    = appData.metacritic ? String(appData.metacritic.score) : "";
            let dev     = appData.developers?.join(', ') || "";
            let pub     = appData.publishers?.join(', ') || "";
            let desc    = appData.short_description || "";

            const cats    = appData.categories?.map(c => c.description) || [];
            let coop      = "None";
            if (cats.includes("Online Co-op") && cats.includes("Shared/Split Screen Co-op")) coop = "Local & Online";
            else if (cats.includes("Online Co-op")) coop = "Online";
            else if (cats.includes("Shared/Split Screen Co-op")) coop = "Local";
            else if (cats.includes("Co-op")) coop = "Online/Local";
            const players = [cats.includes("Single-player") && "Single-player", cats.includes("Multi-player") && "Multi-player"].filter(Boolean).join(', ');

            // HLTB
            let hltb = "";
            try {
                let hr = await searchHltb(gameName);
                if (!hr.length) hr = await searchHltb(gameName.replace(/[:\-].*/, '').replace(/[™®©]/g, '').trim());
                if (hr.length > 0 && hr[0].comp_main > 0) hltb = `${Math.round(hr[0].comp_main / 3600)} Hours`;
            } catch(e) {}

            // ProtonDB
            let proton = "";
            try {
                const pr = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`);
                if (pr.ok) { const pd = await pr.json(); if (pd.tier) proton = pd.tier.toUpperCase(); }
            } catch(e) {}

            // IGDB — similar games, franchise, fill gaps
            let similar = "", franchise = "";
            try {
                const igdb = await igdbSearch(gameName, appId);
                if (igdb) {
                    if (igdb.similar_games?.length) similar = igdb.similar_games.map(g => g.name).slice(0, 6).join(', ');
                    franchise = igdb.franchises?.[0]?.name || igdb.collection?.name || "";
                    if (!genre   && igdb.genres)             genre   = [...(igdb.genres?.map(g => g.name) || []), ...(igdb.themes?.map(t => t.name) || [])].slice(0, 3).join(', ');
                    if (!dev     && igdb.involved_companies)  dev     = igdb.involved_companies.filter(c => c.developer).map(c => c.company.name).join(', ');
                    if (!pub     && igdb.involved_companies)  pub     = igdb.involved_companies.filter(c => c.publisher).map(c => c.company.name).join(', ');
                    if (!release && igdb.first_release_date)  release = new Date(igdb.first_release_date * 1000).getFullYear().toString();
                    if (!meta    && igdb.aggregated_rating)   meta    = Math.round(igdb.aggregated_rating).toString();
                    if (!desc    && igdb.summary)             desc    = igdb.summary;
                }
            } catch(e) {}

            const descI18n = await fetchDescI18n(appId, desc);
            db.prepare("UPDATE games SET GENRE=?,RELEASED=?,METACRITIC=?,DEV=?,PUB=?,Description=?,Description_i18n=?,SteamAppID=?,Coop=?,NumPlayers=?,HLTB_Main=?,ProtonTier=?,SimilarGames=?,Franchise=? WHERE Game=?")
              .run(genre, release, meta, dev, pub, desc, descI18n, appId, coop, players, hltb, proton, similar, franchise, gameName);
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
    return { bgm: true, sfx: true, vol: 0.3, bgm_mode: "AMBIENT", theme: "CREMA (DEFAULT)", screensaver: "CN WALLPAPERS", screensaverDelay: 3, gamepadLayout: "XBOX", wakeMethod: "START + SELECT" };
});

ipcMain.on('save-audio-config', (e, cfg) => { try { fs.writeFileSync(audioCfgPath, JSON.stringify(cfg)); } catch(err){} });
ipcMain.handle('get-custom-music', () => { let playlist = []; try { if (fs.existsSync(musicDir)) { const files = fs.readdirSync(musicDir); for (let f of files) { if (f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.ogg') || f.toLowerCase().endsWith('.flac')) { playlist.push(`file://${path.join(musicDir, f)}`); } } } } catch(e) {} return playlist; });
ipcMain.handle('get-standard-bgm', (event, mode) => { const safeName = mode.toLowerCase().replace(/-/g, ''); for (let ext of ['wav', 'mp3', 'ogg']) { const p = path.join(soundsDir, `bgm_${safeName}.${ext}`); if (fs.existsSync(p)) return `file://${p}`; } return null; });

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
