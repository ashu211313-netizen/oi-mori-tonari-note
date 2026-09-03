const KEY = "wildWorldCompanionState.v1";
const VALID_WEATHER = new Set(["unknown", "dry", "rain", "snow"]);
const VALID_CLOCK_MODES = new Set(["real", "custom", "offset"]);
const MAX_IMPORT_BYTES = 2_000_000;

export const CURRENT_SCHEMA_VERSION = 3;
export const MAX_CALCULATOR_QUANTITY = 9999;

export const defaultState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  clockMode: "real",
  customDateTime: "",
  offsetBaseReal: "",
  offsetBaseGame: "",
  profileName: "マイ村",
  weather: "unknown",
  caught: {},
  acquired: {},
  genuine: {},
  forged: {},
  identified: {},
  donated: {},
  favorites: {},
  itemAcquired: {},
  itemCataloged: {},
  gyroidCollected: {},
  notes: {},
  calculator: []
};

const objectKeys = [
  "caught", "acquired", "genuine", "forged", "identified", "donated", "favorites",
  "itemAcquired", "itemCataloged", "gyroidCollected", "notes"
];

function cloneDefault() {
  return structuredClone(defaultState);
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidDateText(value) {
  return typeof value === "string" && (!value || !Number.isNaN(new Date(value).getTime()));
}

function normalizeFlagMap(value) {
  if (!isPlainRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([id]) => id !== "__proto__" && id !== "constructor" && id !== "prototype")
      .map(([id, enabled]) => [id, Boolean(enabled)])
  );
}

function normalizeNotes(value) {
  if (!isPlainRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([id, note]) => !["__proto__", "constructor", "prototype"].includes(id) && typeof note === "string")
      .map(([id, note]) => [id, note.slice(0, 4000)])
  );
}

export function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_CALCULATOR_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

function repairStateInvariants(state) {
  const ids = new Set([
    ...Object.keys(state.donated),
    ...Object.keys(state.genuine),
    ...Object.keys(state.forged)
  ]);

  for (const id of ids) {
    if (state.forged[id]) {
      state.acquired[id] = true;
      state.genuine[id] = false;
      state.donated[id] = false;
    }
    if (state.genuine[id]) {
      state.acquired[id] = true;
      state.forged[id] = false;
    }
    if (!state.donated[id]) continue;
    if (id.startsWith("fish-") || id.startsWith("bug-")) state.caught[id] = true;
    if (id.startsWith("fossil-")) {
      state.acquired[id] = true;
      state.identified[id] = true;
    }
    if (id.startsWith("art-")) {
      state.acquired[id] = true;
      state.genuine[id] = true;
      state.forged[id] = false;
    }
  }
  return state;
}

export function normalizeState(value) {
  const parsed = isPlainRecord(value) ? value : {};
  const state = cloneDefault();
  state.clockMode = VALID_CLOCK_MODES.has(parsed.clockMode) ? parsed.clockMode : "real";
  state.customDateTime = typeof parsed.customDateTime === "string" ? parsed.customDateTime : "";
  state.offsetBaseReal = typeof parsed.offsetBaseReal === "string" ? parsed.offsetBaseReal : "";
  state.offsetBaseGame = typeof parsed.offsetBaseGame === "string" ? parsed.offsetBaseGame : "";
  state.profileName = typeof parsed.profileName === "string" ? parsed.profileName.slice(0, 80) : defaultState.profileName;
  state.weather = typeof parsed.weather === "string" ? parsed.weather : "unknown";
  if (!VALID_WEATHER.has(state.weather)) state.weather = "unknown";
  for (const key of objectKeys) {
    state[key] = key === "notes" ? normalizeNotes(parsed[key]) : normalizeFlagMap(parsed[key]);
  }
  state.calculator = (Array.isArray(parsed.calculator) ? parsed.calculator : [])
    .filter((row) => row && typeof row.id === "string")
    .map((row) => ({ id: row.id, quantity: normalizeQuantity(row.quantity) }));

  if (!isValidDateText(state.customDateTime)) state.customDateTime = "";
  if (!isValidDateText(state.offsetBaseReal)) state.offsetBaseReal = "";
  if (!isValidDateText(state.offsetBaseGame)) state.offsetBaseGame = "";
  if (state.clockMode === "custom" && !state.customDateTime) state.clockMode = "real";
  if (state.clockMode === "offset" && (!state.offsetBaseReal || !state.offsetBaseGame)) state.clockMode = "real";
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  return repairStateInvariants(state);
}

export function validateImportedState(value) {
  if (!isPlainRecord(value)) throw new Error("backup root must be an object");
  if (value.schemaVersion !== null && value.schemaVersion !== undefined) {
    if (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1) {
      throw new Error("schemaVersion is invalid");
    }
    if (value.schemaVersion > CURRENT_SCHEMA_VERSION) {
      throw new Error("backup schemaVersion is newer than supported");
    }
  }
  for (const key of objectKeys) {
    if (value[key] !== null && value[key] !== undefined && !isPlainRecord(value[key])) {
      throw new Error(`${key} must be an object`);
    }
  }
  if (value.calculator !== null && value.calculator !== undefined && !Array.isArray(value.calculator)) {
    throw new Error("calculator must be an array");
  }
  if (value.clockMode !== null && value.clockMode !== undefined && !VALID_CLOCK_MODES.has(value.clockMode)) {
    throw new Error("clockMode is invalid");
  }
  if (value.weather !== null && value.weather !== undefined && !VALID_WEATHER.has(value.weather)) {
    throw new Error("weather is invalid");
  }
  const state = normalizeState(value);
  if (value.customDateTime && !isValidDateText(value.customDateTime)) {
    throw new Error("customDateTime is invalid");
  }
  if (value.offsetBaseReal && !isValidDateText(value.offsetBaseReal)) {
    throw new Error("offsetBaseReal is invalid");
  }
  if (value.offsetBaseGame && !isValidDateText(value.offsetBaseGame)) {
    throw new Error("offsetBaseGame is invalid");
  }
  return state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return cloneDefault();
    return normalizeState(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(normalizeState(state)));
}

export function serializeState(state) {
  return JSON.stringify(normalizeState(state), null, 2);
}

export function parseImportedStateText(text) {
  return validateImportedState(JSON.parse(text));
}

export function exportState(state) {
  const blob = new Blob([serializeState(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "wild-world-companion-backup.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function importStateFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.size > MAX_IMPORT_BYTES) {
      reject(new Error("backup file is empty or too large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseImportedStateText(String(reader.result)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
