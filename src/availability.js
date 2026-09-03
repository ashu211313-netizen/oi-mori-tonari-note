export const MINUTES_IN_DAY = 24 * 60;
export const WEATHER_VALUES = ["unknown", "dry", "rain", "snow"];

export function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getGameDate(state, now = new Date()) {
  if (state.clockMode === "custom" && state.customDateTime) {
    return new Date(state.customDateTime);
  }
  if (state.clockMode === "offset" && state.offsetBaseReal && state.offsetBaseGame) {
    const realBase = new Date(state.offsetBaseReal);
    const gameBase = new Date(state.offsetBaseGame);
    return new Date(gameBase.getTime() + (now.getTime() - realBase.getTime()));
  }
  return now;
}

// Month-only rules represent "through the end of February". Using 29 keeps
// those rules valid on leap day while remaining harmless in non-leap years.
export function monthEndDay(month) {
  if ([4, 6, 9, 11].includes(month)) return 30;
  if (month === 2) return 29;
  return 31;
}

export function isDateInRange(month, day, rule) {
  const start = rule.startMonth * 100 + (rule.startDay ?? 1);
  const end = rule.endMonth * 100 + (rule.endDay ?? monthEndDay(rule.endMonth));
  const current = month * 100 + day;
  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
}

export function isTimeInRange(minutes, rule) {
  if (rule.allDay) return true;
  const start = toMinutes(rule.startTime);
  const end = toMinutes(rule.endTime);
  // Equal endpoints are ambiguous. Only the explicit allDay flag may turn
  // them into a 24-hour range; otherwise the interval is empty.
  if (start === end) return false;
  if (rule.crossesMidnight || start > end) return minutes >= start || minutes < end;
  return minutes >= start && minutes < end;
}

function normalizeContext(context = {}) {
  if (typeof context === "string") return { weather: context };
  return context ?? {};
}

export function getWeatherMatch(rule, context = {}) {
  const required = rule.weather ?? "any";
  if (required === "any") return true;
  const { weather = "unknown" } = normalizeContext(context);
  if (!WEATHER_VALUES.includes(weather) || weather === "unknown") return null;
  if (required === "rain") return weather === "rain";
  if (required === "snow") return weather === "snow";
  if (required === "rain_or_snow") return weather === "rain" || weather === "snow";
  if (required === "not_rain_or_snow") return weather === "dry";
  return null;
}

export function getConditionMatch(rule, context = {}) {
  if (!rule.conditionCode) return true;
  const { knownConditions } = normalizeContext(context);
  if (!knownConditions) return null;
  if (knownConditions instanceof Set) {
    return knownConditions.has(rule.conditionCode) ? true : null;
  }
  if (typeof knownConditions !== "object" || Array.isArray(knownConditions)) return null;
  if (!Object.hasOwn(knownConditions, rule.conditionCode)) return null;
  return knownConditions[rule.conditionCode] === true;
}

export function getRuleContextMatch(rule, context = {}) {
  const checks = [getWeatherMatch(rule, context), getConditionMatch(rule, context)];
  if (checks.includes(false)) return false;
  if (checks.includes(null)) return null;
  return true;
}

export function isRuleTimeActive(rule, date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const minutes = date.getHours() * 60 + date.getMinutes();
  return isDateInRange(month, day, rule) && isTimeInRange(minutes, rule);
}

export function isRuleActive(rule, date, context = {}) {
  return isRuleTimeActive(rule, date) && getRuleContextMatch(rule, context) === true;
}

export function getActiveRules(entity, date, context = {}) {
  return (entity.availabilityRules ?? []).filter((rule) => isRuleActive(rule, date, context));
}

export function getConditionalRules(entity, date, context = {}) {
  return (entity.availabilityRules ?? []).filter(
    (rule) => isRuleTimeActive(rule, date) && getRuleContextMatch(rule, context) === null
  );
}

export function getAvailabilityStatus(entity, date, context = {}) {
  if (!entity.availabilityRules?.length) return "unavailable";
  const timeActive = entity.availabilityRules.filter((rule) => isRuleTimeActive(rule, date));
  if (!timeActive.length) return "unavailable";
  if (timeActive.some((rule) => getRuleContextMatch(rule, context) === true)) return "available";
  if (timeActive.some((rule) => getRuleContextMatch(rule, context) === null)) return "conditional";
  return "unavailable";
}

export function isAvailableNow(entity, date, context = {}) {
  return getAvailabilityStatus(entity, date, context) === "available";
}

export function isPotentiallyAvailableNow(entity, date, context = {}) {
  return getAvailabilityStatus(entity, date, context) !== "unavailable";
}

export function isAvailableOnDate(entity, date) {
  if (!entity.availabilityRules?.length) return false;
  return entity.availabilityRules.some((rule) =>
    isDateInRange(date.getMonth() + 1, date.getDate(), rule)
  );
}

export function isMonthInRange(month, rule) {
  if (rule.startMonth <= rule.endMonth) return month >= rule.startMonth && month <= rule.endMonth;
  return month >= rule.startMonth || month <= rule.endMonth;
}

export function isAvailableThisMonth(entity, month) {
  if (!entity.availabilityRules?.length) return false;
  return entity.availabilityRules.some((rule) => isMonthInRange(month, rule));
}

function withTime(date, time) {
  const next = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function windowForActiveRule(rule, date) {
  if (rule.allDay) {
    const start = startOfDay(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { rule, start, end };
  }
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = toMinutes(rule.startTime);
  const endMinutes = toMinutes(rule.endTime);
  const start = withTime(date, rule.startTime);
  const end = withTime(date, rule.endTime);
  if (rule.crossesMidnight || startMinutes > endMinutes) {
    if (currentMinutes < endMinutes) start.setDate(start.getDate() - 1);
    if (currentMinutes >= startMinutes) end.setDate(end.getDate() + 1);
  }
  return { rule, start, end };
}

export function getNextAvailableTime(entity, fromDate, context = {}) {
  if (!entity.availabilityRules?.length) return null;
  const from = new Date(fromDate);
  from.setSeconds(0, 0);
  if (isAvailableNow(entity, from, context)) return from;

  const firstDay = startOfDay(from);
  let best = null;
  for (let dayOffset = 0; dayOffset <= 367; dayOffset += 1) {
    const day = new Date(firstDay);
    day.setDate(day.getDate() + dayOffset);
    for (const rule of entity.availabilityRules) {
      if (!isDateInRange(day.getMonth() + 1, day.getDate(), rule)) continue;
      if (getRuleContextMatch(rule, context) !== true) continue;
      const candidate = rule.allDay ? startOfDay(day) : withTime(day, rule.startTime);
      if (candidate < from) continue;
      if (!isAvailableNow(entity, candidate, context)) continue;
      if (!best || candidate < best) best = candidate;
    }
    if (best) return best;
  }
  return null;
}

export function getCurrentAvailabilityWindow(entity, date, context = {}) {
  let activeRules = getActiveRules(entity, date, context);
  if (!activeRules.length) return null;
  const initialWindows = activeRules.map((rule) => windowForActiveRule(rule, date));
  const start = initialWindows.reduce((earliest, item) => item.start < earliest ? item.start : earliest, initialWindows[0].start);
  let end = initialWindows.reduce((latest, item) => item.end > latest ? item.end : latest, initialWindows[0].end);

  // Merge adjacent rules (e.g. 16:00-21:00 + 21:00-04:00) so the UI does not
  // claim that an uninterrupted availability period ends at an internal boundary.
  for (let i = 0; i < 370; i += 1) {
    if (!isAvailableNow(entity, end, context)) return { start, end, continuous: false };
    activeRules = getActiveRules(entity, end, context);
    if (!activeRules.length) return { start, end, continuous: false };
    const nextEnd = activeRules
      .map((rule) => windowForActiveRule(rule, end).end)
      .reduce((latest, value) => value > latest ? value : latest, end);
    if (nextEnd <= end) return { start, end, continuous: false };
    end = nextEnd;
  }
  return { start, end: null, continuous: true };
}

export function getRemainingAvailability(entity, fromDate, context = {}) {
  if (!isAvailableNow(entity, fromDate, context)) return null;
  const window = getCurrentAvailabilityWindow(entity, fromDate, context);
  if (!window?.end || window.continuous) return null;
  return Math.max(0, window.end.getTime() - fromDate.getTime());
}

export function getEnteringThisMonth(entity, monthOrDate) {
  const month = monthOrDate instanceof Date ? monthOrDate.getMonth() + 1 : monthOrDate;
  const previous = month === 1 ? 12 : month - 1;
  return isAvailableThisMonth(entity, month) && !isAvailableThisMonth(entity, previous);
}

export function getLeavingThisMonth(entity, monthOrDate) {
  const month = monthOrDate instanceof Date ? monthOrDate.getMonth() + 1 : monthOrDate;
  const next = month === 12 ? 1 : month + 1;
  return isAvailableThisMonth(entity, month) && !isAvailableThisMonth(entity, next);
}

export const getEnteringDate = getEnteringThisMonth;
export const getLeavingDate = getLeavingThisMonth;

export function getLeavingToday(entity, date) {
  if (!entity.availabilityRules?.length || !isAvailableOnDate(entity, date)) return false;
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return !isAvailableOnDate(entity, tomorrow);
}

export function getAvailableNow(entities, date, context = {}) {
  return entities.filter((entity) => isAvailableNow(entity, date, context));
}

export function getPotentiallyAvailableNow(entities, date, context = {}) {
  return entities.filter((entity) => isPotentiallyAvailableNow(entity, date, context));
}

export function getAvailableUndonated(entities, state, date, context = {}, { includeConditional = false } = {}) {
  const candidates = includeConditional
    ? getPotentiallyAvailableNow(entities, date, context)
    : getAvailableNow(entities, date, context);
  return candidates.filter((entity) => !state.donated[entity.id]);
}

export function getHighestValueAvailable(entities, date, limit = 10, context = {}, { includeConditional = false } = {}) {
  const candidates = includeConditional
    ? getPotentiallyAvailableNow(entities, date, context)
    : getAvailableNow(entities, date, context);
  return candidates
    .slice()
    .sort((a, b) => b.sellPrice - a.sellPrice)
    .slice(0, limit);
}

export function setCalendarMonth(date, month) {
  const target = Math.min(12, Math.max(1, Number(month) || 1));
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(target - 1);
  const lastDay = new Date(next.getFullYear(), target, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  return next;
}

export function formatDuration(ms) {
  if (ms === null || ms === undefined) return "";
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `あと${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `あと${hours}時間${rest}分` : `あと${hours}時間`;
}

export function formatDateTime(date) {
  if (!date) return "未定";
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
