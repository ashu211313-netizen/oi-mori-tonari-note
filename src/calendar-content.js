const englishMonths = Object.freeze({
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
});

export function parseResidentBirthday(value) {
  const japanese = String(value ?? "").match(/^(\d{1,2})月(\d{1,2})日$/);
  if (japanese) return { month: Number(japanese[1]), day: Number(japanese[2]) };
  const english = String(value ?? "").match(/^([A-Z][a-z]+)\s+(\d{1,2})$/);
  if (english && englishMonths[english[1]]) return { month: englishMonths[english[1]], day: Number(english[2]) };
  return null;
}

export function residentBirthdaysForMonth(residents, month) {
  return residents
    .map((resident) => ({ resident, parsed: parseResidentBirthday(resident.birthday) }))
    .filter(({ parsed }) => parsed?.month === month)
    .map(({ resident, parsed }) => ({ ...resident, birthdayText: `${parsed.month}月${parsed.day}日`, birthdayMonth: parsed.month, birthdayDay: parsed.day }))
    .sort((a, b) => a.birthdayDay - b.birthdayDay || a.id.localeCompare(b.id));
}

export function eventsForMonth(events, month) {
  return events.filter((event) => event.dateRule?.months?.includes(month));
}

function nthWeekday(year, month, weekday, nth) {
  const first = new Date(year, month - 1, 1);
  return 1 + ((weekday - first.getDay() + 7) % 7) + (nth - 1) * 7;
}

export function isEventOnDate(event, date) {
  const rule = event.dateRule;
  if (!rule) return false;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  if (!rule.months?.includes(month)) return false;
  if (rule.kind === "WEEKLY") return weekday === rule.weekday;
  if (rule.kind === "NTH_WEEKDAY") return weekday === rule.weekday && day === nthWeekday(date.getFullYear(), month, rule.weekday, rule.nth);
  if (rule.kind === "NTH_WEEKDAY_BY_MONTH") {
    const nth = rule.nthByMonth?.[month];
    return Boolean(nth) && weekday === rule.weekday && day === nthWeekday(date.getFullYear(), month, rule.weekday, nth);
  }
  if (rule.kind === "NTH_WEEKDAY_SPAN") {
    const start = nthWeekday(date.getFullYear(), month, rule.startWeekday, rule.nth);
    return day >= start && day <= start + 6;
  }
  if (rule.kind === "YEAR_BOUNDARY") {
    return (month === rule.start.month && day === rule.start.day) || (month === rule.end.month && day === rule.end.day);
  }
  return false;
}

export function eventsForDate(events, date) {
  return events.filter((event) => isEventOnDate(event, date));
}
