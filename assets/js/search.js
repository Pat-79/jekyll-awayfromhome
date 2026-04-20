class SearchEngine {
  constructor() {
    this.worker = null;
    this.loaded = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.initWorker();
  }

  initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker('/assets/js/search-worker.js');
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
      } catch (e) {
        console.warn('Web Workers not supported, falling back to main thread search', e);
      }
    }
  }

  async load(version) {
    if (this.loaded) return;

    const STORAGE_KEY = 'searchData';
    const VERSION_KEY = 'searchDataVersion';
    const TIME_KEY = 'searchDataTime';
    const TTL = 1000 * 60 * 60 * 24;

    const cachedVersion = localStorage.getItem(VERSION_KEY);
    const cachedData = localStorage.getItem(STORAGE_KEY);
    const cachedTime = localStorage.getItem(TIME_KEY);

    const isExpired = !cachedTime || (Date.now() - cachedTime > TTL);

    let data;

    if (cachedData && cachedVersion === version && !isExpired) {
      data = JSON.parse(cachedData);
    } else {
      const res = await fetch(`/assets/data/search-data.json?v=${version}`, {
        cache: 'no-cache'
      });
      data = await res.json();

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(VERSION_KEY, version);
        localStorage.setItem(TIME_KEY, Date.now());
      } catch (e) {}
    }

    // Send data to worker
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
      // Fallback: return empty array if worker not available
      // In production, you might want to implement fallback search logic
      return [];
    }

    return new Promise((resolve) => {
      const messageId = ++this.messageId;
      this.pendingRequests.set(messageId, resolve);
      this.worker.postMessage({ messageId, type: 'SEARCH', payload: query });
    });
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
