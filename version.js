/**
 * Shonar Ponjika — Version Configuration
 * Format: Main.Major.Minor
 * 
 * Update this file to trigger a PWA update notification for users.
 */
const VERSION_CONFIG = {
    main: 1,
    major: 3,
    minor: 4,
    get full() {
        return `${this.main}.${this.major}.${this.minor}`;
    }
};

// If in Service Worker context
if (typeof self !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
    self.APP_VERSION = VERSION_CONFIG.full;
}
