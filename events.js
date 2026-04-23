/**
 * Shonar Ponjika — Bangla Event Detection Engine
 * Detects cultural, national, and religious events using rule-based calculations.
 */

// Import Hijri logic (assuming it's available or we embed a mini version)
// For this standalone version, I'll embed a simplified Hijri converter.
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

// Simplified Moon Phase for Tithis/Purnima/Amavasya
const MoonCalc = {
    // Reference New Moon: 2000-01-06 18:14 UTC
    LUNAR_MONTH: 29.530588853,
    NEW_MOON_REF: new Date('2000-01-06T18:14:00Z').getTime(),

    getMoonAge: function(date) {
        const msPerDay = 86400000;
        const diff = date.getTime() - this.NEW_MOON_REF;
        const age = (diff / msPerDay) % this.LUNAR_MONTH;
        return age < 0 ? age + this.LUNAR_MONTH : age;
    },

    getTithi: function(date) {
        const age = this.getMoonAge(date);
        // Tithi = (Age / LunarMonth) * 30
        const tithi = Math.floor((age / this.LUNAR_MONTH) * 30) + 1;
        return tithi; // 1 to 30
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
                if (bDate.monthIndex === rule.bMonth && tithi === rule.tithi) match = true;
                break;
        }

        if (match) results.push(rule);
    });

    return results;
}

// Helper to get raw rule for UI listings
function getUpcomingEvents(startDate, days = 60) {
    // This is more complex for a detection engine because we have to iterate
    const upcoming = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const b = getBengaliDate(d);
        const evs = getEventsForDate(d, b);
        evs.forEach(e => {
            upcoming.push({ ...e, dateObj: d });
        });
    }
    // Remove duplicates found on same day
    return upcoming.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.dateObj.getTime() === v.dateObj.getTime())) === i);
}
