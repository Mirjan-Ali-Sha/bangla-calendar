/**
 * Shonar Ponjika — Version Configuration
 * Used for cache busting and update notifications.
 */

var VERSION_CONFIG = {
    main: 1,
    major: 9,
    minor: 1,
    get full() {
        return `${this.main}.${this.major}.${this.minor}`;
    }
};

window.appVersion = VERSION_CONFIG.full;
