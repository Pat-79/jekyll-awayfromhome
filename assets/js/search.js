class SearchEngine {
  constructor() {
    this.worker = null;
    this.workerVersion = '';
    this.loaded = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  initWorker(version = '') {
    if (this.worker && this.workerVersion === version) {
      return;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.loaded = false;
    }

    if (typeof Worker !== 'undefined') {
      try {
        const workerUrl = `/assets/js/search-worker.js${version ? `?v=${encodeURIComponent(version)}` : ''}`;
        this.worker = new Worker(workerUrl);
        this.workerVersion = version;
        this.worker.onmessage = (e) => {
          const { messageId, type, results } = e.data;
          
          if (type === 'INDEX_BUILT') {
            this.loaded = true;
            const resolve = this.pendingRequests.get(messageId);
            if (resolve) {
              this.pendingRequests.delete(messageId);
              resolve();
            }
          }
          
          if (type === 'SEARCH_RESULTS') {
            const resolve = this.pendingRequests.get(messageId);
            if (resolve) {
              this.pendingRequests.delete(messageId);
              resolve(results || []);
            }
          }
        };
        this.worker.onerror = () => {
          this.flushPendingRequests();
          this.worker.terminate();
          this.worker = null;
          this.loaded = false;
        };
      } catch (e) {
        console.warn('Web Workers not supported for search', e);
      }
    }
  }

  async load(version) {
    if (this.loaded) return;

    this.initWorker(version);

    const STORAGE_KEY = 'searchData';
    const VERSION_KEY = 'searchDataVersion';
    let cachedVersion = null;
    let cachedData = null;
    const expectedVersion = typeof version === 'string' ? version : '';

    const hasExpectedPayloadVersion = (payload) => {
      if (!expectedVersion) return true;
      return !!(payload && typeof payload.version === 'string' && payload.version === expectedVersion);
    };

    try {
      cachedVersion = localStorage.getItem(VERSION_KEY);
      cachedData = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    let data = null;

    if (cachedData && cachedVersion === version) {
      try {
        const parsedCachedData = JSON.parse(cachedData);
        if (hasExpectedPayloadVersion(parsedCachedData)) {
          data = parsedCachedData;
        } else {
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VERSION_KEY);
          } catch (e) {}
        }
      } catch (e) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(VERSION_KEY);
        } catch (err) {}
      }
    }

    if (!data) {
      const fetchSearchData = async (cacheMode, extraParam = '') => {
        const suffix = extraParam ? `&${extraParam}` : '';
        const res = await fetch(`/assets/data/search-data.json?v=${version}${suffix}`, {
          cache: cacheMode
        });
        return res.json();
      };

      data = await fetchSearchData('no-cache');

      if (!hasExpectedPayloadVersion(data)) {
        const retryData = await fetchSearchData('reload', `t=${Date.now()}`);
        if (hasExpectedPayloadVersion(retryData)) {
          data = retryData;
        } else {
          console.warn('Search payload version mismatch', {
            expected: expectedVersion,
            actual: retryData && typeof retryData.version === 'string' ? retryData.version : null
          });
          data = { version: expectedVersion, documents: [], entries: [] };
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(VERSION_KEY, version);
      } catch (e) {}
    }

    if (this.worker) {
      await new Promise((resolve) => {
        const messageId = ++this.messageId;
        this.pendingRequests.set(messageId, resolve);
        this.worker.postMessage({ messageId, type: 'BUILD_INDEX', payload: data });
      });
    } else {
      this.loaded = true;
    }
  }

  search(query) {
    if (!this.worker) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const messageId = ++this.messageId;
      this.pendingRequests.set(messageId, resolve);
      this.worker.postMessage({ messageId, type: 'SEARCH', payload: query });
    });
  }

  flushPendingRequests() {
    for (const [messageId, resolve] of this.pendingRequests.entries()) {
      this.pendingRequests.delete(messageId);
      resolve();
    }
  }
}

function debounce(fn, d=120){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t=setTimeout(()=>fn(...args),d);
  };
}

export { SearchEngine, debounce };
