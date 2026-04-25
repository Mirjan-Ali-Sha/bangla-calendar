/**
 * Shonar Ponjika — Bangla Application Controller
 */

// State
let currentViewDate = new Date(); // Start with today

// DOM Elements
const daysGrid = document.getElementById('daysGrid');
const monthBn = document.getElementById('currentMonthBn');
const monthEn = document.getElementById('currentMonthEn');
const eventList = document.getElementById('eventList');
const auspiciousList = document.getElementById('auspiciousList');
const gDateInput = document.getElementById('gDateInput'); // The one in converter
const gotoDateInput = document.getElementById('gotoDateInput'); // The new one in header
const conversionResult = document.getElementById('conversionResult');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');

// Modal Elements
const dateModal = document.getElementById('dateModal');
const closeModal = document.getElementById('closeModal');
const modalDateBn = document.getElementById('modalDateBn');
const modalDateEn = document.getElementById('modalDateEn');
const modalEvents = document.getElementById('modalEvents');



function init() {
    // Dynamic Versioning from version.js
    if (window.VERSION_CONFIG) {
        const footerVer = document.getElementById('footerVersion');
        if (footerVer) footerVer.textContent = `v${VERSION_CONFIG.full}`;
    }

    // Splash Screen Exit (Move to top for robustness)
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            app.classList.remove('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }, 1200);
    }

    renderCalendar();

    // Event Listeners
    gotoDateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (!isNaN(selectedDate)) {
            currentViewDate = selectedDate;
            renderCalendar();
        }
    });

    prevBtn.addEventListener('click', () => {
        // To move to the previous BENGALI month, we subtract ~30 days
        const currentBDate = getBengaliDate(currentViewDate);
        let prevMonthDate = new Date(currentViewDate);
        prevMonthDate.setDate(prevMonthDate.getDate() - 30);
        currentViewDate = prevMonthDate;
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        // To move to the next BENGALI month, we add ~30 days
        let nextMonthDate = new Date(currentViewDate);
        nextMonthDate.setDate(nextMonthDate.getDate() + 30);
        currentViewDate = nextMonthDate;
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentViewDate = new Date();
        renderCalendar();
    });

    gDateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (!isNaN(selectedDate)) {
            const bDate = getBengaliDate(selectedDate);
            conversionResult.innerHTML = `
                ${toBengaliDigit(bDate.day)} ${bDate.month.bn}, ${toBengaliDigit(bDate.year)}
            `;
        }
    });

    // Set default date in input
    gDateInput.valueAsDate = new Date();

    const closeDateModal = () => {
        if (dateModal.classList.contains('active')) {
            dateModal.classList.remove('active');
            dateModal.classList.add('hidden');
            if (history.state && history.state.modal === 'dateModal') {
                history.back();
            }
        }
    };

    // Modal Close
    closeModal.addEventListener('click', closeDateModal);

    dateModal.addEventListener('click', (e) => {
        if (e.target === dateModal) closeDateModal();
    });
}

function renderCalendar() {
    const bDate = getBengaliDate(currentViewDate);
    const { startDayOfWeek, days } = getBengaliMonthDays(bDate.year, bDate.monthIndex);
    
    // Update Month Display
    monthBn.textContent = `${bDate.month.bn} ${toBengaliDigit(bDate.year)}`;
    
    const startGDate = days[0].gDate;
    const endGDate = days[days.length - 1].gDate;
    const monthsEn = [...new Set([
        startGDate.toLocaleString('en-US', { month: 'long' }),
        endGDate.toLocaleString('en-US', { month: 'long' })
    ])].join(' - ');
    monthEn.textContent = `${monthsEn} ${startGDate.getFullYear()}`;

    // Clear Grid
    daysGrid.innerHTML = '';

    // Empty cells for start padding
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day empty';
        daysGrid.appendChild(emptyDiv);
    }

    // Helper for local YYYY-MM-DD
    const getLocalDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Consistent "Today" with Sunrise Rule
    const now = new Date();
    const shiftedNow = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    const todayStr = getLocalDateStr(shiftedNow);

    // Render Days
    days.forEach(day => {
        const dayDiv = document.createElement('div');
        const dStr = getLocalDateStr(day.gDate);
        const bDateForDay = { day: day.bDay, monthIndex: bDate.monthIndex, year: bDate.year };
        
        // Calculate events for Sunrise (6 AM) of this Bengali day to ensure Tithi alignment
        const sunriseDate = new Date(day.gDate);
        sunriseDate.setHours(6, 0, 0, 0);
        const events = getEventsForDate(sunriseDate, bDateForDay);
        
        dayDiv.className = 'day';
        dayDiv.setAttribute('data-date', dStr);

        if (dStr === todayStr) {
            dayDiv.classList.add('today');
        }
        if (events.length > 0) {
            dayDiv.classList.add('has-event');
        }

        const monthStyles = day.gDate.getDate() === 1 ? 'color: var(--primary-color); font-weight: bold;' : '';
        const monthShort = day.gDate.toLocaleString('en-GB', { month: 'short' });

        dayDiv.innerHTML = `
            <span class="day-b">${toBengaliDigit(day.bDay)}</span>
            <div class="day-en-wrapper">
                <span class="day-e">${day.gDate.getDate()}</span>
                <span class="day-m" style="${monthStyles}">${monthShort}</span>
            </div>
        `;

        dayDiv.addEventListener('click', () => {
            openDateModal(day.gDate, day.bDay, bDate.month.bn, bDate.year, events);
        });

        daysGrid.appendChild(dayDiv);
    });

    renderEvents();
    renderAuspiciousDates();
    if (window.lucide) window.lucide.createIcons();
}

function renderAuspiciousDates() {
    if (!auspiciousList) return;
    auspiciousList.innerHTML = '';
    
    // 1. Show Today's Khans (Auspicious Timings) at the top
    const today = new Date();
    const timings = PanjikaEngine.getDayAuspiciousTimings(today);
    
    const timingsGroup = document.createElement('div');
    timingsGroup.className = 'shubh-group';
    timingsGroup.innerHTML = `<h3 class="shubh-group-title" style="color: var(--accent-color)">আজকের বিশেষ ক্ষণ</h3>`;
    
    const timingsList = document.createElement('div');
    timingsList.className = 'shubh-group-items';
    timings.forEach(t => {
        const row = document.createElement('div');
        row.className = 'shubh-row';
        row.style.borderLeft = t.name.includes('অমৃত') || t.name.includes('মাহেন্দ্র') ? '2px solid var(--accent-color)' : '2px solid var(--text-muted)';
        row.innerHTML = `
            <span class="shubh-date-bullet" style="font-size: 0.8rem; width: auto; padding-right: 5px;">${t.name}</span>
            <span class="shubh-time-text">${toBengaliDigit(t.range)}</span>
        `;
        timingsList.appendChild(row);
    });
    timingsGroup.appendChild(timingsList);
    auspiciousList.appendChild(timingsGroup);

    // 2. Show Month's Shubh Dates
    
    // Anchor Shubh Section to the currently viewed BENGALI month
    const bDate = getBengaliDate(currentViewDate);
    const shubhDates = PanjikaEngine.getAuspiciousDates(bDate.year, bDate.monthIndex);

    if (shubhDates.length === 0) {
        auspiciousList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">এই মাসে কোন শুভক্ষণ নেই</p>';
        return;
    }

    const groups = {};
    shubhDates.forEach(sd => {
        if (!groups[sd.category]) groups[sd.category] = [];
        groups[sd.category].push(sd);
    });

    Object.keys(groups).forEach(cat => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'shubh-group';
        
        const titleBn = document.createElement('h3');
        titleBn.textContent = cat;
        titleBn.className = 'shubh-group-title';
        groupDiv.appendChild(titleBn);

        const listDiv = document.createElement('div');
        listDiv.className = 'shubh-group-items';

        groups[cat].forEach(sd => {
            const row = document.createElement('div');
            row.className = 'shubh-row';
            
            const dateBn = toBengaliDigit(sd.bDay);
            const timeBn = toBengaliDigit(sd.time);

            row.innerHTML = `
                <span class="shubh-date-bullet">${dateBn}</span>
                <span class="shubh-time-text">(${timeBn})</span>
            `;
            
            row.onclick = () => {
                currentViewDate = new Date(sd.gYear, sd.gMonth, sd.gDay);
                renderCalendar();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            listDiv.appendChild(row);
        });

        groupDiv.appendChild(listDiv);
        auspiciousList.appendChild(groupDiv);
    });
}

function renderEvents() {
    // Show events for the NEXT 90 days using the Detection Engine
    eventList.innerHTML = '';
    
    // We pass today as start
    const upcomingEvents = getUpcomingEvents(new Date(), 90)
        .slice(0, 6); // Show top 6

    if (upcomingEvents.length === 0) {
        eventList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">কোন আসন্ন অনুষ্ঠান নেই</p>';
        return;
    }

    upcomingEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-item';
        
        // Show Bengali Date for the event correctly
        const eventBnDate = getBengaliDate(event.dateObj);
        const bnDateStr = `${toBengaliDigit(eventBnDate.day)} ${eventBnDate.month.bn}`;
        
        item.innerHTML = `
            <div class="event-date">${bnDateStr}</div>
            <div class="event-name-bn">${event.bn}</div>
            <div class="event-name-en">${event.name}</div>
        `;
        eventList.appendChild(item);
    });
}

function openDateModal(gDate, bDay, bMonth, bYear, events) {
    modalDateBn.textContent = `${toBengaliDigit(bDay)} ${bMonth} ${toBengaliDigit(bYear)}`;
    modalDateEn.textContent = gDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Panjika Details
    const panjika = PanjikaEngine.getPanjikaDetails(gDate);
    
    const renderSegments = (title, segments) => {
        if (!segments || segments.length === 0) return '';
        return `
            <div class="panjika-section">
                <div class="panjika-section-header">
                    <i data-lucide="sparkles"></i>
                    <span>${title}</span>
                </div>
                <div class="panjika-segments">
                    ${segments.map(s => `
                        <div class="panjika-segment-item">
                            <span class="seg-name">${s.name}</span>
                            <span class="seg-time">${s.range}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const groups = {
        tithi: panjika.segments.tithi,
        nakshatra: panjika.segments.nakshatra,
        yoga: panjika.segments.yoga,
        karana: panjika.segments.karana,
        auspicious: PanjikaEngine.getDayAuspiciousTimings(gDate)
    };

    modalEvents.innerHTML = `
        <div class="sun-times-header">
            <div class="sun-item">
                <i data-lucide="sun"></i>
                <span>সূর্যোদয়: ${panjika.sun.sunrise}</span>
            </div>
            <div class="sun-item">
                <i data-lucide="moon"></i>
                <span>সূর্যাস্ত: ${panjika.sun.sunset}</span>
            </div>
        </div>

        <div class="panjika-details">
            ${renderSegments('তিথি', groups.tithi)}
            ${renderSegments('নক্ষত্র', groups.nakshatra)}
            ${renderSegments('যোগ', groups.yoga)}
            ${renderSegments('করণ', groups.karana)}
            ${renderSegments('শুভ মুহূর্ত ও কালবেলা', groups.auspicious)}
        </div>
        
        <div class="modal-events-list">
            <h4 class="events-title">আজকের অনুষ্ঠান</h4>
            ${events.length > 0 
                ? events.map(ev => `
                    <div class="modal-event-item">
                        <div class="modal-event-name-bn">${ev.bn}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); opacity: 0.8;">${ev.name}</div>
                    </div>
                `).join('')
                : '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">এই দিনে কোন বিশেষ অনুষ্ঠান নেই</p>'
            }
        </div>
    `;
    
    dateModal.classList.remove('hidden');
    dateModal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
    history.pushState({ modal: 'dateModal' }, '');
}

// Settings & Theme Logic
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const themeOptions = document.querySelectorAll('.theme-option');

// Load saved theme
const savedTheme = localStorage.getItem('panjika-theme') || 'default';
document.documentElement.setAttribute('data-theme', savedTheme);
themeOptions.forEach(opt => {
    if (opt.getAttribute('data-theme') === savedTheme) opt.classList.add('active');
});

if (settingsBtn) {
    settingsBtn.onclick = () => {
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('active');
        history.pushState({ modal: 'settingsModal' }, '');
    };
}

if (closeSettingsModal) {
    closeSettingsModal.onclick = () => {
        settingsModal.classList.remove('active');
        setTimeout(() => settingsModal.classList.add('hidden'), 300);
        if (history.state?.modal === 'settingsModal') history.back();
    };
}

themeOptions.forEach(opt => {
    opt.onclick = () => {
        const theme = opt.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('panjika-theme', theme);
        
        themeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        
        // Auto close after small delay
        setTimeout(() => {
            settingsModal.classList.remove('active');
            setTimeout(() => settingsModal.classList.add('hidden'), 300);
            if (history.state?.modal === 'settingsModal') history.back();
        }, 500);
    };
});

// Update modal popstate handling
window.onpopstate = (event) => {
    if (!event.state || !event.state.modal) {
        dateModal.classList.remove('active');
        settingsModal.classList.remove('active');
        dateModal.classList.add('hidden');
        settingsModal.classList.add('hidden');
    }
};

// Start
init();

// PWA Install Logic
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installConfirm = document.getElementById('installConfirm');
const installCancel = document.getElementById('installCancel');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.classList.remove('hidden');
});

if (installConfirm) {
    installConfirm.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBanner.classList.add('hidden');
    });
}

if (installCancel) {
    installCancel.addEventListener('click', () => {
        installBanner.classList.add('hidden');
    });
}
