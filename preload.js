const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getBaseDir: () => ipcRenderer.invoke('get-basedir'),
                                getGames: () => ipcRenderer.invoke('get-games'),
                                launchGame: (cmd) => ipcRenderer.send('launch-game', cmd),
                                quitApp: () => ipcRenderer.send('quit-app'),
                                saveDbField: (data) => ipcRenderer.send('save-db-field', data),
                                fetchHltb: (g) => ipcRenderer.invoke('fetch-hltb', g),
                                fetchProton: (id) => ipcRenderer.invoke('fetch-proton', id),
                                checkLocalTrailer: (g) => ipcRenderer.invoke('check-local-trailer', g),
                                deleteTrailer: (g) => ipcRenderer.invoke('delete-trailer', g),
                                searchYoutube: (g) => ipcRenderer.invoke('search-youtube', g),
                                downloadTrailer: (g, id) => ipcRenderer.invoke('download-trailer', g, id),
                                onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (e, d) => cb(d)),
                                getAudioConfig: () => ipcRenderer.invoke('get-audio-config'),
                                saveAudioConfig: (cfg) => ipcRenderer.send('save-audio-config', cfg),
                                getCustomMusic: () => ipcRenderer.invoke('get-custom-music'),
                                getStandardBgm: (m) => ipcRenderer.invoke('get-standard-bgm', m),
                                runBatchScrape: () => ipcRenderer.invoke('run-batch-scrape'),
                                onScrapeProgress: (cb) => ipcRenderer.on('scrape-progress', (e, d) => cb(d)),
                                getSetting: (k) => ipcRenderer.invoke('get-setting', k),
                                setSetting: (k, v) => ipcRenderer.invoke('set-setting', k, v),
                                searchSteam: (g) => ipcRenderer.invoke('search-steam', g),
                                sgdbSearch: (g, k, id) => ipcRenderer.invoke('sgdb-search', g, k, id),
                                sgdbApply: (g, url) => ipcRenderer.invoke('sgdb-apply', g, url),
                                scrapeSteamData: (g, mode, id) => ipcRenderer.invoke('scrape-steam-data', g, mode, id),
                                getAudioMetadata: (p) => ipcRenderer.invoke('get-audio-metadata', p),
                                getMusicLibrary: () => ipcRenderer.invoke('get-music-library'),
                                getPlaylists: () => ipcRenderer.invoke('get-playlists'),
                                savePlaylists: (pl) => ipcRenderer.send('save-playlists', pl),

                                // NEW: Force Focus
                                forceFocus: () => ipcRenderer.send('force-focus'),

                                  // NEW: Wallpapers
                                  getWallpapers: () => ipcRenderer.invoke('get-wallpapers'),

                                // FIX: Expose Gaming History IPCs for CREMA
                                updateLastPlayed: (gameName) => ipcRenderer.invoke('update-last-played', gameName),
                                clearHistory: () => ipcRenderer.invoke('clear-history')
});
