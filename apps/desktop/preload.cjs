// Using .cjs extension to ensure this file is always treated as CommonJS,
// regardless of any "type": "module" in package.json.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
});
