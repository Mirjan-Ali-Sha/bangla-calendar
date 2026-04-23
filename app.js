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
    renderCalendar();

    // Splash Screen Exit
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            app.classList.remove('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }, 1500);
    }
    
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

    // Prevent immediate exit on back button when modal is open
    window.addEventListener('popstate', (e) => {
        if (dateModal.classList.contains('active')) {
            dateModal.classList.remove('active');
        }
    });

    const closeDateModal = () => {
        if (dateModal.classList.contains('active')) {
            dateModal.classList.remove('active');
            // If the user manually closes the modal, pop the history state to keep the stack clean
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Render Days
    days.forEach(day => {
        const dayDiv = document.createElement('div');
        const bDateForDay = { day: day.bDay, monthIndex: bDate.monthIndex, year: bDate.year };
        const events = getEventsForDate(day.gDate, bDateForDay);
        
        dayDiv.className = 'day';
        if (day.gDate.toISOString().split('T')[0] === todayStr) {
            dayDiv.classList.add('today');
        }
        if (events.length > 0) {
            dayDiv.classList.add('has-event');
        }

        const monthStyles = day.gDate.getDate() === 1 ? 'color: var(--bengal-saffron); font-weight: bold;' : '';
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
    if (window.lucide) window.lucide.createIcons();
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
    
    modalEvents.innerHTML = '';
    if (events.length > 0) {
        events.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'modal-event-item';
            evDiv.innerHTML = `
                <div class="modal-event-name-bn">${ev.bn}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); opacity: 0.8;">${ev.name}</div>
            `;
            modalEvents.appendChild(evDiv);
        });
    } else {
        modalEvents.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">এই দিনে কোন বিশেষ অনুষ্ঠান নেই</p>';
    }
    
    dateModal.classList.add('active');
    // Push a state to the history so the back button can be intercepted
    history.pushState({ modal: 'dateModal' }, '');
}

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
