/* Private trip data stays on this browser; never sent to the API or service worker. */
(function () {
  'use strict';
  let opening;
  function open() {
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = indexedDB.open('landing-check-private-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('private');
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); opening = null; };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Close other Landing Check tabs and try again.'));
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function run(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('private', mode);
      let result;
      const request = action(tx.objectStore('private'));
      if (request) request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('Local storage is unavailable.'));
    });
  }
  window.LCOfflineDB = {
    get: key => run('readonly', store => store.get(key)),
    put: (key, value) => run('readwrite', store => store.put(value, key)),
    clear: async () => {
      window.dispatchEvent(new Event('lc-private-clearing'));
      await run('readwrite', store => store.clear());
      window.dispatchEvent(new Event('lc-private-cleared'));
    },
  };
})();
