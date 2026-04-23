/**
 * Shonar Ponjika — Core Bangla Calendar Logic
 * Implements the 2019 Revised Bangla Calendar (Bangladesh Standard)
 */

const BENGALI_MONTHS = [
    { name: 'Baishakh', bn: 'বৈশাখ', length: 31 },
    { name: 'Jyoishtha', bn: 'জ্যৈষ্ঠ', length: 31 },
    { name: 'Ashar', bn: 'আষাঢ়', length: 31 },
    { name: 'Shrabon', bn: 'শ্রাবণ', length: 31 },
    { name: 'Bhadro', bn: 'ভাদ্র', length: 31 },
    { name: 'Ashshin', bn: 'আশ্বিন', length: 31 },
    { name: 'Kartik', bn: 'কার্তিক', length: 30 },
    { name: 'Ogrohayon', bn: 'অগ্রহায়ণ', length: 30 },
    { name: 'Poush', bn: 'পৌষ', length: 30 },
    { name: 'Magh', bn: 'মাঘ', length: 30 },
    { name: 'Falgun', bn: 'ফাল্গুন', length: 29 }, // 30 in leap year
    { name: 'Choitro', bn: 'চৈত্র', length: 30 }
];

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBengaliDigit(number) {
    return number.toString().split('').map(digit => BENGALI_DIGITS[parseInt(digit)] || digit).join('');
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Converts Gregorian date to Bengali date
 * Logic: Boishakh 1 starts on April 14
 */
function getBengaliDate(date) {
    const d = new Date(date);
    let gDay = d.getDate();
    let gMonth = d.getMonth() + 1; // 1-12
    let gYear = d.getFullYear();

    let bYear = gYear - 593;
    if (gMonth < 4 || (gMonth === 4 && gDay < 14)) {
        bYear -= 1;
    }

    // Days since Baishakh 1 (April 14)
    // We calculate from April 14 of the current/previous Gregorian year
    const startOfBengaliYear = new Date(gYear, 3, 14); // April 14
    if (d < startOfBengaliYear) {
        startOfBengaliYear.setFullYear(gYear - 1);
    }

    let diffTime = d.getTime() - startOfBengaliYear.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let bMonthIndex = 0;
    let bDay = diffDays + 1;

    for (let i = 0; i < 12; i++) {
        let monthLength = BENGALI_MONTHS[i].length;
        if (BENGALI_MONTHS[i].name === 'Falgun' && isLeapYear(gYear)) {
            // Note: If Gregorian year is leap, Falgun (which falls in Feb/March of that year) gets the extra day.
            // Actually, Falgun 31 happens if the Gregorian year containing that Falgun is leap.
            // e.g. Falgun 1430 was in 2024 (Leap), so it had 30 days.
            monthLength = 30;
        }

        if (bDay <= monthLength) {
            bMonthIndex = i;
            break;
        }
        bDay -= monthLength;
        bMonthIndex = i + 1;
    }

    return {
        day: bDay,
        month: BENGALI_MONTHS[bMonthIndex],
        monthIndex: bMonthIndex,
        year: bYear
    };
}

/**
 * Get all days in a Bengali month for rendering
 */
function getBengaliMonthDays(bYear, bMonthIndex) {
    // To render a month, we need to know what day of the week it starts on.
    // We'll find the Gregorian date for the 1st of this Bengali month.
    
    // First, find the Gregorian year associated with this Bengali month
    // Baishakh 1st is always April 14 of (bYear + 593)
    let gYear = bYear + 593;
    let targetDate = new Date(gYear, 3, 14); // April 14

    // Traverse months to find the 1st day of the target month
    for (let i = 0; i < bMonthIndex; i++) {
        let monthLength = BENGALI_MONTHS[i].length;
        if (BENGALI_MONTHS[i].name === 'Falgun' && isLeapYear(gYear + 1)) {
            // Falgun usually spans Feb-March of the NEXT Gregorian year from Boishakh
            monthLength = 30;
        }
        targetDate.setDate(targetDate.getDate() + monthLength);
    }

    let startDayOfWeek = targetDate.getDay(); // 0 (Sun) to 6 (Sat)
    let monthLength = BENGALI_MONTHS[bMonthIndex].length;
    if (BENGALI_MONTHS[bMonthIndex].name === 'Falgun' && isLeapYear(targetDate.getFullYear())) {
        monthLength = 30;
    }

    const days = [];
    for (let i = 1; i <= monthLength; i++) {
        const currentDate = new Date(targetDate);
        currentDate.setDate(targetDate.getDate() + (i - 1));
        days.push({
            bDay: i,
            gDate: currentDate
        });
    }

    return {
        startDayOfWeek,
        days
    };
}

if (typeof module !== 'undefined') {
    module.exports = { getBengaliDate, getBengaliMonthDays, toBengaliDigit, BENGALI_MONTHS };
}
