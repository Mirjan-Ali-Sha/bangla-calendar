/**
 * Shonar Ponjika — Bangla Event Detection & Calendar Engine
 */

const BENGALI_MONTHS = [
    { bn: 'বৈশাখ', en: 'Boishakh', days: 31 },
    { bn: 'জ্যৈষ্ঠ', en: 'Jyaistha', days: 31 },
    { bn: 'আষাঢ়', en: 'Ashadha', days: 31 },
    { bn: 'শ্রাবণ', en: 'Shravana', days: 31 },
    { bn: 'ভাদ্র', en: 'Bhadra', days: 31 },
    { bn: 'আশ্বিন', en: 'Ashvina', days: 30 },
    { bn: 'কার্তিক', en: 'Kartika', days: 30 },
    { bn: 'অগ্রহায়ণ', en: 'Agrahayana', days: 30 },
    { bn: 'পৌষ', en: 'Pausha', days: 30 },
    { bn: 'মাঘ', en: 'Magha', days: 30 },
    { bn: 'ফাল্গুন', en: 'Phalguna', days: 30 },
    { bn: 'চৈত্র', en: 'Chaitra', days: 30 }
];

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function toBengaliDigit(num) {
    const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return String(num).split('').map(d => digits[d] || d).join('');
}

function getBengaliDate(gDate) {
    // Shonar Ponjika Engine v2.0 - Sunrise-to-Sunrise Implementation
    // Bengali Day changes at Sunrise (~6:00 AM)
    const shiftedDate = new Date(gDate.getTime() - (6 * 60 * 60 * 1000));
    
    // Reference points:
    // 1431: April 14, 2024
    // 1432: April 14, 2025
    // 1433: April 15, 2026 (Shifted due to Surjasiddhanta / Prokerala calculations)
    
    let refGDate = new Date(2024, 3, 14); // Default 1431
    let baseYear = 1431;

    const currentGYear = shiftedDate.getFullYear();
    if (currentGYear === 2026) {
        refGDate = new Date(2026, 3, 15); // April 15, 2026
        baseYear = 1433;
    } else if (currentGYear === 2025) {
        refGDate = new Date(2025, 3, 14);
        baseYear = 1432;
    }

    const diffDays = Math.floor((shiftedDate.setHours(0,0,0,0) - refGDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    
    let bYear = baseYear;
    let bMonthIndex = 0;
    let bDay = 1;
    let remainingDays = diffDays;

    if (remainingDays >= 0) {
        while (true) {
            const daysInMonth = (bMonthIndex === 10 && isLeapYear(bYear + 593)) ? 31 : BENGALI_MONTHS[bMonthIndex].days;
            if (remainingDays < daysInMonth) { bDay = remainingDays + 1; break; }
            remainingDays -= daysInMonth;
            bMonthIndex++; if (bMonthIndex > 11) { bMonthIndex = 0; bYear++; }
        }
    } else {
        remainingDays = Math.abs(remainingDays);
        while (remainingDays > 0) {
            bMonthIndex--; if (bMonthIndex < 0) { bMonthIndex = 11; bYear--; }
            const daysInMonth = (bMonthIndex === 10 && isLeapYear(bYear + 593)) ? 31 : BENGALI_MONTHS[bMonthIndex].days;
            if (remainingDays <= daysInMonth) { bDay = daysInMonth - remainingDays + 1; break; }
            remainingDays -= daysInMonth;
        }
    }
    return { day: bDay, monthIndex: bMonthIndex, month: BENGALI_MONTHS[bMonthIndex], year: bYear };
}

function getBengaliMonthDays(bYear, bMonthIndex) {
    // Anchor to the adjusted reference
    let gDate;
    if (bYear === 1433) gDate = new Date(2026, 3, 15);
    else if (bYear === 1432) gDate = new Date(2025, 3, 14);
    else gDate = new Date(2024, 3, 14);
    
    let curY = (bYear === 1433) ? 1433 : (bYear === 1432 ? 1432 : 1431), curM = 0;
    
    while (curY < bYear || (curY === bYear && curM < bMonthIndex)) {
        const d = (curM === 10 && isLeapYear(curY + 593)) ? 31 : BENGALI_MONTHS[curM].days;
        gDate.setDate(gDate.getDate() + d);
        curM++; if (curM > 11) { curM = 0; curY++; }
    }
    while (curY > bYear || (curY === bYear && curM > bMonthIndex)) {
        curM--; if (curM < 0) { curM = 11; curY--; }
        const d = (curM === 10 && isLeapYear(curY + 593)) ? 31 : BENGALI_MONTHS[curM].days;
        gDate.setDate(gDate.getDate() - d);
    }
    const daysInM = (bMonthIndex === 10 && isLeapYear(bYear + 593)) ? 31 : BENGALI_MONTHS[bMonthIndex].days;
    const startDayOfWeek = gDate.getDay();
    const days = [];
    for (let i = 1; i <= daysInM; i++) {
        days.push({ bDay: i, gDate: new Date(gDate) });
        gDate.setDate(gDate.getDate() + 1);
    }
    return { startDayOfWeek, days };
}

// Import Hijri logic (simplified)
const HijriCalc = {
    gregorianToHijri: function(date) {
        const jd = Math.floor(date.getTime() / 86400000) + 2440588;
        const l = jd - 1948440 + 10632;
        const n = Math.floor((l - 1) / 10631);
        let l2 = l - 10631 * n + 354;
        const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
        l2 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
        const m = Math.floor((24 * l2) / 709);
        const d = l2 - Math.floor((709 * m) / 24);
        const y = 30 * n + j - 30;
        return { hYear: y, hMonth: m, hDay: d };
    }
};

const MoonCalc = {
    // Reference New Moon: calibrated to match Prokerala 2026 data
    LUNAR_MONTH: 29.530588853,
    NEW_MOON_REF: new Date('2026-04-16T17:52:00Z').getTime(), // Advanced 1 day to sync
    SIDEREAL_MONTH: 27.321661,

    getMoonAge: function(date) {
        const msPerDay = 86400000;
        const diff = date.getTime() - this.NEW_MOON_REF;
        const age = (diff / msPerDay) % this.LUNAR_MONTH;
        return age < 0 ? age + this.LUNAR_MONTH : age;
    },

    getTithi: function(date) {
        const age = this.getMoonAge(date);
        const tithiNum = Math.floor((age / this.LUNAR_MONTH) * 30) + 1;
        const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
        const tithis = [
            'প্রতিপদ', 'দ্বিতীয়া', 'তৃতীয়া', 'চতুর্থী', 'পঞ্চমী', 'ষষ্ঠী', 'সপ্তমী', 'অষ্টমী', 
            'নবমী', 'দশমী', 'একাদশী', 'দ্বাদশী', 'ত্রয়োদশী', 'চতুর্দশী', 'পূর্ণিমা',
            'প্রতিপদ', 'দ্বিতীয়া', 'তৃতীয়া', 'চতুর্থী', 'পঞ্চমী', 'ষষ্ঠী', 'সপ্তমী', 'অষ্টমী', 
            'নবমী', 'দশমী', 'একাদশী', 'দ্বাদশী', 'ত্রয়োদশী', 'চতুর্দশী', 'অমাবস্যা'
        ];
        return { name: tithis[tithiNum - 1], paksha: paksha, num: tithiNum };
    }
};

const PanjikaEngine = {
    getDayAuspiciousTimings: function(date) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayOfWeek = dayStart.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        const { sunrise, sunset } = this.getSunTimes(date);
        
        // Helper to parse time string "সকাল ০৫:১৩"
        const parseTimeStr = (str) => {
            const [period, time] = str.split(' ');
            let [h, m] = time.split(':').map(n => {
                const map = {'০':0,'১':1,'২':2,'৩':3,'৪':4,'৫':5,'৬':6,'৭':7,'৮':8,'৯':9};
                return parseInt(n.split('').map(c => map[c]).join(''));
            });
            if (period === "রাত" && h < 12) h += 0; 
            if ((period === "দুপুর" || period === "বিকেল" || period === "সন্ধ্যা" || period === "রাত") && h < 12) h += 12;
            if (period === "রাত" && h >= 24) h -= 24;
            if (period === "সকাল" && h === 12) h = 0;
            const d = new Date(dayStart);
            d.setHours(h, m, 0, 0);
            return d;
        };

        const rise = parseTimeStr(sunrise);
        const set = parseTimeStr(sunset);
        const dayLen = (set - rise);
        const partLen = dayLen / 8;

        const results = [];
        
        // Define Day Parts
        const dayRules = [
            /*Sun*/ { amrita: [5], mahendra: [4], kaal: [1], vaar: [2] },
            /*Mon*/ { amrita: [1, 2, 7], mahendra: [3], kaal: [2], vaar: [3] },
            /*Tue*/ { amrita: [3, 4], mahendra: [2], kaal: [3], vaar: [4] },
            /*Wed*/ { amrita: [5, 6], mahendra: [8], kaal: [4], vaar: [5] },
            /*Thu*/ { amrita: [1, 2, 7], mahendra: [4], kaal: [5], vaar: [6] },
            /*Fri*/ { amrita: [1, 5, 7], mahendra: [4], kaal: [6], vaar: [7] },
            /*Sat*/ { amrita: [1, 2, 6], mahendra: [7], kaal: [7], vaar: [8] }
        ];

        const rule = dayRules[dayOfWeek];
        
        for (let i = 0; i < 8; i++) {
            const start = new Date(rise.getTime() + i * partLen);
            const end = new Date(rise.getTime() + (i + 1) * partLen);
            const partNum = i + 1;
            
            let label = "";
            if (rule.amrita.includes(partNum)) label = "অমৃত যোগ";
            else if (rule.mahendra.includes(partNum)) label = "মাহেন্দ্র যোগ";
            else if (rule.kaal.includes(partNum)) label = "কাল বেলা";
            else if (rule.vaar.includes(partNum)) label = "বার বেলা";

            if (label) {
                results.push({ name: label, range: `${this.formatTime(start)} থেকে ${this.formatTime(end)}` });
            }
        }

        // Add Kaal Ratri
        const nightLen = (24 * 3600000) - dayLen;
        const nightPartLen = nightLen / 8;
        const kaalRatriRule = [4, 8, 6, 2, 7, 3, 5]; 
        const krPart = kaalRatriRule[dayOfWeek];
        const krStart = new Date(set.getTime() + (krPart - 1) * nightPartLen);
        const krEnd = new Date(set.getTime() + krPart * nightPartLen);
        results.push({ name: "কাল রাত্রি", range: `${this.formatTime(krStart)} থেকে ${this.formatTime(krEnd)}` });

        return results;
    },

    NAKSHATRAS: [
        'অশ্বিনী', 'ভরণী', 'কৃত্তিকা', 'রোহিণী', 'মৃগশিরা', 'আর্দ্রা', 'পুনর্বসু', 'পুষ্যা', 'অশ্লেষা',
        'মঘা', 'পূর্বফল্গুনী', 'উত্তরফল্গুনী', 'হস্ত', 'চিত্রা', 'স্বাতী', 'বিশাখা', 'অনুরাধা', 'জ্যেষ্ঠা',
        'মূল', 'পূর্বাষাঢ়া', 'উত্তরাষাঢ়া', 'শ্রবণা', 'ধনিষ্ঠা', 'শতভিষা', 'পূর্বভাদ্রপদ', 'উত্তরভাদ্রপদ', 'রেবতী'
    ],
    YOGAS: [
        'বিষকুম্ভ', 'প্রীতি', 'আয়ুষ্মান', 'সৌভাগ্য', 'শোভন', 'অতিগণ্ড', 'সুকর্মা', 'ধৃতি', 'শূল',
        'গণ্ড', 'বৃদ্ধি', 'ধ্রুব', 'ব্যাঘাত', 'হর্ষণ', 'বজ্র', 'সিদ্ধি', 'ব্যতিপাত', 'বরীয়ান',
        'পরিঘ', 'শিব', 'সিদ্ধ', 'সাধ্য', 'শুভ', 'শুক্ল', 'ব্রহ্ম', 'ঐন্দ্র', 'বৈধৃতি'
    ],
    KARANAS: [
        'বব', 'বালব', 'কৌলব', 'তৈতিল', 'গর', 'বণিজ', 'বিষ্টি', 'শকুনি', 'চতুষ্পাদ', 'নাগ', 'কিস্তুঘ্ন'
    ],

    getPanjikaDetails: function(date) {
        const segments = { tithi: [], nakshatra: [], yoga: [], karana: [] };
        
        // Start scanning from Sunrise (6:00 AM) of the target day
        const dayBreak = new Date(date);
        dayBreak.setHours(6, 0, 0, 0);

        const scanLimit = 1440; // 24 hours from daybreak
        let lastState = null;

        for (let m = 0; m <= scanLimit; m += 15) {
            const scanTime = new Date(dayBreak.getTime() + m * 60000);
            const state = this.getInstantState(scanTime);
            
            const timeStr = this.formatTime(scanTime);
            if (!lastState) {
                segments.tithi.push({ name: state.tithi, startTime: "সূর্যোদয় ০৬:০০", m });
                segments.nakshatra.push({ name: state.nakshatra, startTime: "সূর্যোদয় ০৬:০০", m });
                segments.yoga.push({ name: state.yoga, startTime: "সূর্যোদয় ০৬:০০", m });
                segments.karana.push({ name: state.karana, startTime: "সূর্যোদয় ০৬:০০", m });
            } else {
                if (state.tithi !== lastState.tithi) this.handleTransition(segments.tithi, state.tithi, timeStr, m);
                if (state.nakshatra !== lastState.nakshatra) this.handleTransition(segments.nakshatra, state.nakshatra, timeStr, m);
                if (state.yoga !== lastState.yoga) this.handleTransition(segments.yoga, state.yoga, timeStr, m);
                if (state.karana !== lastState.karana) this.handleTransition(segments.karana, state.karana, timeStr, m);
            }
            lastState = state;
        }

        const formatSegments = (list) => {
            return list.map((s, idx) => {
                const next = list[idx + 1];
                let rangeText = "";
                if (next) {
                    rangeText = `${s.startTime} থেকে ${next.startTime} পর্যন্ত`;
                } else {
                    rangeText = `${s.startTime} থেকে চলছে`;
                }
                return { name: s.name, range: rangeText };
            });
        };

        return {
            segments: {
                tithi: formatSegments(segments.tithi),
                nakshatra: formatSegments(segments.nakshatra),
                yoga: formatSegments(segments.yoga),
                karana: formatSegments(segments.karana)
            },
            sun: this.getSunTimes(date)
        };
    },

    handleTransition: function(list, newName, timeStr, m) {
        list.push({ name: newName, startTime: timeStr, m });
    },

    getSunTimes: function(date) {
        // Very basic approximation for Bengal region (~23.5N)
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        const diff = 70 * Math.cos((dayOfYear + 10) * 2 * Math.PI / 365); // variation in minutes
        
        const sunrise = new Date(date);
        sunrise.setHours(6, 0, 0, 0); // 6:00 AM base
        sunrise.setMinutes(sunrise.getMinutes() + diff);

        const sunset = new Date(date);
        sunset.setHours(18, 0, 0, 0); // 6:00 PM base
        sunset.setMinutes(sunset.getMinutes() - diff);

        return {
            sunrise: this.formatTime(sunrise),
            sunset: this.formatTime(sunset)
        };
    },

    getInstantState: function(date) {
        const jd = (date.getTime() / 86400000) + 2440587.5;
        const t = (jd - 2451545.0) / 36525;
        let moonLon = 218.316 + 481267.881 * t - 8.16; // Advanced 1 day offset
        let sunLon = 280.466 + 36000.770 * t - 11.52; 
        moonLon = (moonLon % 360 + 360) % 360;
        sunLon = (sunLon % 360 + 360) % 360;

        const tithiData = MoonCalc.getTithi(date);
        const nakIndex = Math.floor(moonLon / (360 / 27));
        
        // Yoga is moon + sun. Nirayana systems often have a specific offset for this.
        const yogaSum = (moonLon + sunLon + 360 - 20.85) % 360; 
        const yogaIndex = Math.floor(yogaSum / (360 / 27)) % 27;
        
        const k = Math.floor(((moonLon - sunLon + 360) % 360) / 6);
        let karana;
        if (k === 0) karana = 'কিস্তুঘ্ন';
        else if (k >= 57) {
            const fixed = ['শকুনি', 'চতুষ্পাদ', 'নাগ'];
            karana = fixed[k - 57];
        } else {
            const movable = ['বব', 'বালব', 'কৌলব', 'তৈতিল', 'গর', 'বণিজ', 'বিষ্টি'];
            karana = movable[(k - 1) % 7];
        }

        const paksha = tithiData.paksha === 'Shukla' ? 'শুক্ল পক্ষ' : 'কৃষ্ণ পক্ষ';
        return {
            tithi: `${tithiData.name} (${paksha})`,
            nakshatra: this.NAKSHATRAS[nakIndex],
            yoga: this.YOGAS[yogaIndex],
            karana: karana
        };
    },

    formatTime: function(date) {
        let h = date.getHours();
        let m = date.getMinutes();
        
        let period = "";
        if (h >= 4 && h < 6) period = "ভোর";
        else if (h >= 6 && h < 12) period = "সকাল";
        else if (h >= 12 && h < 15) period = "দুপুর";
        else if (h >= 15 && h < 18) period = "বিকেল";
        else if (h >= 18 && h < 20) period = "সন্ধ্যা";
        else period = "রাত";

        let displayH = h % 12 || 12;
        const hBn = toBengaliDigit(displayH);
        const mBn = toBengaliDigit(m < 10 ? '0' + m : m);
        
        return `${period} ${hBn}:${mBn}`;
    },

    getAuspiciousDates: function(bYear, bMonthIndex) {
        // bMonthIndex: 0=Boishakh, 1=Jyeshtha, etc.
        // Sample shubh dates for Boishakh 1433 (April-May 2026)
        const shubh = [
            // Marriage (Bibah) - Verified for 2026/1433
            { gDay: 20, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "সন্ধ্যা ৬:৫০ থেকে রাত ১২:৩০" },
            { gDay: 21, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "রাত ৮:১৫ থেকে রাত ১১:৪৫" },
            { gDay: 25, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "রাত ৭:৩০ থেকে রাত ১:০০" },
            { gDay: 26, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "রাত ৮:০০ থেকে ভোর ৩:৩০" },
            { gDay: 27, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "রাত ৮:৩০ থেকে রাত ১২:৩০" },
            { gDay: 28, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "সন্ধ্যা ৭:৪৫ থেকে রাত ২:১৫" },
            { gDay: 29, gMonth: 3, gYear: 2026, category: "বিবাহ", time: "রাত ৯:০০ থেকে ভোর ৪:০০" },
            { gDay: 3, gMonth: 4, gYear: 2026, category: "বিবাহ", time: "রাত ৮:৩০ থেকে রাত ১২:০০" },
            { gDay: 5, gMonth: 4, gYear: 2026, category: "বিবাহ", time: "রাত ৭:৪৫ থেকে রাত ১১:৩০" },

            // Annaprashan
            { gDay: 19, gMonth: 3, gYear: 2026, category: "অন্নপ্রাশন", time: "সকাল ১০:৩০ থেকে দুপুর ১:০৫" },
            { gDay: 29, gMonth: 3, gYear: 2026, category: "অন্নপ্রাশন", time: "সকাল ১১:০০ থেকে দুপুর ২:৩০" },
            { gDay: 4, gMonth: 4, gYear: 2026, category: "অন্নপ্রাশন", time: "সকাল ৯:১৫ থেকে দুপুর ১২:০০" },
            { gDay: 8, gMonth: 4, gYear: 2026, category: "অন্নপ্রাশন", time: "সকাল ১০:০০ থেকে দুপুর ১:৩০" },

            // Griha Pravesh
            { gDay: 1, gMonth: 3, gYear: 2026, category: "গৃহ প্রবেশ", time: "সকাল ৯:১৫ থেকে দুপুর ১২:০০" },
            { gDay: 16, gMonth: 3, gYear: 2026, category: "গৃহ প্রবেশ", time: "সকাল ৮:০০ থেকে দুপুর ১:৪৫" },
            { gDay: 17, gMonth: 3, gYear: 2026, category: "গৃহ প্রবেশ", time: "সকাল ১০:৩০ থেকে দুপুর ১:৩০" },
            { gDay: 24, gMonth: 3, gYear: 2026, category: "গৃহ প্রবেশ", time: "সকাল ১১:৪৫ থেকে দুপুর ৩:১৫" },
            { gDay: 22, gMonth: 4, gYear: 2026, category: "গৃহ প্রবেশ", time: "সকাল ৯:৩০ থেকে দুপুর ১২:১৫" }
        ];

        return shubh.map(d => {
            const date = new Date(d.gYear, d.gMonth, d.gDay);
            const bDate = getBengaliDate(date);
            return { ...d, bDay: bDate.day, bMonthIndex: bDate.monthIndex, bYear: bDate.year };
        }).filter(d => d.bMonthIndex === bMonthIndex && d.bYear === bYear);
    }
};

const EVENT_RULES = [
    // --- Fixed Bengali Dates ---
    { name: 'Pohela Boishakh', bn: 'পহেলা বৈশাখ', type: 'FIXED_BN', bMonth: 0, bDay: 1, impact: 'major', category: 'cultural' },
    { name: 'Akshaya Tritiya', bn: 'অক্ষয় তৃতীয়া', type: 'LUNAR', bMonth: 0, tithi: 3, impact: 'medium', category: 'religious' },
    { name: 'Buddha Purnima', bn: 'বুদ্ধ পূর্ণিমা', type: 'LUNAR', bMonth: 0, tithi: 15, impact: 'major', category: 'religious' },
    { name: 'Rabindra Jayanti', bn: 'রবীন্দ্র জয়ন্তী', type: 'FIXED_BN', bMonth: 0, bDay: 25, impact: 'medium', category: 'cultural' },
    { name: 'Nazrul Jayanti', bn: 'নজরুল জয়ন্তী', type: 'FIXED_BN', bMonth: 1, bDay: 11, impact: 'medium', category: 'cultural' },
    
    { name: 'Jamai Sashthi', bn: 'জামাই ষষ্ঠী', type: 'LUNAR', bMonth: 1, tithi: 6, impact: 'medium', category: 'cultural' },
    { name: 'Rath Yatra', bn: 'রথযাত্রা', type: 'LUNAR', bMonth: 2, tithi: 2, impact: 'major', category: 'religious' },
    { name: 'Rakhi Purnima', bn: 'রাখিপূর্ণিমা', type: 'LUNAR', bMonth: 3, tithi: 15, impact: 'medium', category: 'cultural' },
    
    { name: 'Janmashtami', bn: 'জন্মাষ্টমী', type: 'LUNAR', bMonth: 4, tithi: 23, impact: 'major', category: 'religious' },
    { name: 'Ganesh Chaturthi', bn: 'গণেশ চতুর্থী', type: 'LUNAR', bMonth: 4, tithi: 4, impact: 'medium', category: 'religious' },
    
    // Durga Puja
    { name: 'Mahalaya', bn: 'মহালয়া', type: 'LUNAR', bMonth: 5, tithi: 30, impact: 'medium', category: 'cultural' },
    { name: 'Maha Shasthi', bn: 'মহাষষ্ঠী (দুর্গাপূজা)', type: 'LUNAR', bMonth: 5, tithi: 6, impact: 'medium', category: 'religious' },
    { name: 'Maha Saptami', bn: 'মহাসপ্তমী (দুর্গাপূজা)', type: 'LUNAR', bMonth: 5, tithi: 7, impact: 'medium', category: 'religious' },
    { name: 'Maha Ashtami', bn: 'মহাষ্টমী (দুর্গাপূজা)', type: 'LUNAR', bMonth: 5, tithi: 8, impact: 'major', category: 'religious' },
    { name: 'Maha Navami', bn: 'মহানবমী (দুর্গাপূজা)', type: 'LUNAR', bMonth: 5, tithi: 9, impact: 'medium', category: 'religious' },
    { name: 'Vijaya Dashami', bn: 'বিজয়া দশমী (দুর্গাপূজা)', type: 'LUNAR', bMonth: 5, tithi: 10, impact: 'major', category: 'cultural' },
    
    { name: 'Kojagari Lakshmi Puja', bn: 'লক্ষ্মী পূজা', type: 'LUNAR', bMonth: 5, tithi: 15, impact: 'medium', category: 'religious' },
    { name: 'Kali Puja / Diwali', bn: 'কালী পূজা', type: 'LUNAR', bMonth: 6, tithi: 30, impact: 'major', category: 'religious' },
    { name: 'Bhai Phonta', bn: 'ভাইফোঁটা', type: 'LUNAR', bMonth: 6, tithi: 17, impact: 'medium', category: 'cultural' },
    { name: 'Jagaddhatri Puja', bn: 'জগদ্ধাত্রী পূজা', type: 'LUNAR', bMonth: 6, tithi: 9, impact: 'medium', category: 'religious' },
    { name: 'Kartik Puja', bn: 'কার্তিক পূজা', type: 'FIXED_BN', bMonth: 6, bDay: 30, impact: 'medium', category: 'religious' },
    
    { name: 'Guru Nanak Jayanti', bn: 'গুরু নানক জয়ন্তী', type: 'LUNAR', bMonth: 7, tithi: 15, impact: 'medium', category: 'religious' },
    { name: 'Poush Parbon', bn: 'পৌষ সংক্রান্তি', type: 'FIXED_BN', bMonth: 8, bDay: 30, impact: 'medium', category: 'cultural' },
    
    { name: 'Saraswati Puja', bn: 'সরস্বতী পূজা', type: 'LUNAR', bMonth: 10, tithi: 5, impact: 'minor', category: 'religious' },
    { name: 'Dol Purnima (Holi)', bn: 'দোল পূর্ণিমা', type: 'LUNAR', bMonth: 10, tithi: 15, impact: 'medium', category: 'cultural' },
    { name: 'Shivaratri', bn: 'শিবরাত্রি', type: 'LUNAR', bMonth: 10, tithi: 28, impact: 'medium', category: 'religious' },

    // --- Islamic Lunar Dates (Hijri) ---
    { name: 'Eid-ul-Fitr', bn: 'ঈদুল ফিতর', type: 'HIJRI', hMonth: 10, hDay: 1, impact: 'major', category: 'religious' },
    { name: 'Eid-ul-Adha', bn: 'ঈদুল আযহা', type: 'HIJRI', hMonth: 12, hDay: 10, impact: 'major', category: 'religious' },
    { name: 'Ashura', bn: 'আশুরা', type: 'HIJRI', hMonth: 1, hDay: 10, impact: 'medium', category: 'religious' },
    { name: 'Shab-e-Barat', bn: 'শবে বরাত', type: 'HIJRI', hMonth: 8, hDay: 15, impact: 'medium', category: 'religious' },
    { name: 'Shab-e-Meraj', bn: 'শবে মেরাজ', type: 'HIJRI', hMonth: 7, hDay: 27, impact: 'medium', category: 'religious' },
    { name: 'Ramadan Start', bn: 'রমজান শুরু', type: 'HIJRI', hMonth: 9, hDay: 1, impact: 'major', category: 'religious' },

    // --- Fixed Gregorian Dates ---
    { name: 'New Year', bn: 'ইংরেজি নববর্ষ', type: 'FIXED_GR', gMonth: 0, gDay: 1, impact: 'minor', category: 'cultural' },
    { name: 'Mother Language Day', bn: 'আন্তর্জাতিক মাতৃভাষা দিবস', type: 'FIXED_GR', gMonth: 1, gDay: 21, impact: 'major', category: 'national' },
    { name: 'Independence Day', bn: 'স্বাধীনতা দিবস', type: 'FIXED_GR', gMonth: 2, gDay: 26, impact: 'major', category: 'national' },
    { name: 'Christmas', bn: 'বড়দিন', type: 'FIXED_GR', gMonth: 11, gDay: 25, impact: 'medium', category: 'religious' },
    { name: 'Victory Day', bn: 'বিজয় দিবস', type: 'FIXED_GR', gMonth: 11, gDay: 16, impact: 'major', category: 'national' },
];

function getEventsForDate(date, bDate) {
    const results = [];
    const gMonth = date.getMonth();
    const gDay = date.getDate();
    const hijri = HijriCalc.gregorianToHijri(date);
    const tithi = MoonCalc.getTithi(date);

    EVENT_RULES.forEach(rule => {
        let match = false;

        switch (rule.type) {
            case 'FIXED_BN':
                if (bDate.monthIndex === rule.bMonth && bDate.day === rule.bDay) match = true;
                break;
            case 'FIXED_GR':
                if (gMonth === rule.gMonth && gDay === rule.gDay) match = true;
                break;
            case 'HIJRI':
                if (hijri.hMonth === rule.hMonth && hijri.hDay === rule.hDay) match = true;
                break;
            case 'LUNAR':
                // Check if the Bengali month matches AND the Tithi matches
                // Tithis are approximate in this engine (+/- 1 day)
                if (bDate.monthIndex === rule.bMonth && tithi.num === rule.tithi) match = true;
                break;
        }

        if (match) results.push(rule);
    });

    return results;
}

// Helper to get raw rule for UI listings
function getUpcomingEvents(startDate, days = 60) {
    const getLocalDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // This is more complex for a detection engine because we have to iterate
    const upcoming = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const b = getBengaliDate(d);
        const evs = getEventsForDate(d, b);
        const dStr = getLocalDateStr(d);
        evs.forEach(e => {
            upcoming.push({ ...e, dateObj: d, dateStr: dStr });
        });
    }
    // Remove duplicates found on same day
    return upcoming.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.dateStr === v.dateStr)) === i);
}
