/**
 * Shonar Ponjika — Version Configuration
 * Used for cache busting and update notifications.
 */

const VERSION_CONFIG = {
    main: 1,
    major: 7,
    minor: 7,
    get full() {
        return `${this.main}.${this.major}.${this.minor}`;
    }
};

window.appVersion = VERSION_CONFIG.full;
