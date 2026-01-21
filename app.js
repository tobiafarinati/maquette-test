const links = Array.from(document.querySelectorAll(".menu__link"));
const sections = Array.from(document.querySelectorAll("section[id]"));

const linksById = new Map(
  links
    .map((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : null;
      return id ? [id, link] : null;
    })
    .filter(Boolean),
);

const EXCLUDED_ACTIVE_IDS = new Set(["home"]);
const ratioById = new Map();

function setActiveId(id) {
  for (const link of links) link.classList.remove("menu__link--active");
  if (!id || EXCLUDED_ACTIVE_IDS.has(id)) return;
  linksById.get(id)?.classList.add("menu__link--active");
}

const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      ratioById.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
    }

    let bestId = null;
    let bestRatio = 0;
    for (const [id, ratio] of ratioById.entries()) {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestId = id;
      }
    }
    setActiveId(bestId);
  },
  { threshold: thresholds },
);

for (const section of sections) {
  ratioById.set(section.id, 0);
  observer.observe(section);
}

window.addEventListener("hashchange", () => {
  const id = (location.hash || "").slice(1);
  if (id) setActiveId(id);
});


//programma da excell

const programGrid = document.getElementById("program-grid");

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsv(text, delimiter = ";") {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0], delimiter);
  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i], delimiter);
    const row = {};
    normalizedHeaders.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function buildCell(className, text) {
  const cell = document.createElement("div");
  cell.className = `program-cell col-1 ${className}`;
  if (text) cell.textContent = text;
  return cell;
}

function buildYearMonthCell(year, month) {
  const cell = document.createElement("div");
  cell.className = "program-cell program-year-month col-1";

  if (!year && !month) {
    cell.classList.add("program-empty");
    return cell;
  }

  const yearEl = document.createElement("span");
  yearEl.className = "program-year";
  yearEl.textContent = year || "";

  const monthEl = document.createElement("span");
  monthEl.className = "program-month";
  monthEl.textContent = month || "";

  cell.appendChild(yearEl);
  cell.appendChild(monthEl);
  return cell;
}

function buildSessionCell({ day, mode, speaker, title }) {
  const cell = document.createElement("div");
  cell.className = "program-cell program-session col-1";

  if (!day && !speaker && !title) {
    cell.classList.add("program-empty");
    return cell;
  }

  const dayRow = document.createElement("div");
  dayRow.className = "program-day";
  dayRow.textContent = day;

  if (mode) {
    const modeEl = document.createElement("span");
    modeEl.className = "program-mode";
    modeEl.textContent = mode;
    dayRow.appendChild(modeEl);
  }

  const speakerEl = document.createElement("div");
  speakerEl.className = "program-speaker";
  speakerEl.textContent = speaker;

  const titleEl = document.createElement("div");
  titleEl.className = "program-title";
  titleEl.textContent = title;

  cell.appendChild(dayRow);
  if (speaker) cell.appendChild(speakerEl);
  if (title) cell.appendChild(titleEl);
  return cell;
}

function renderProgramGrid(container, rows) {
  container.innerHTML = "";

  rows.forEach((row) => {
    const sessions = [];
    for (let slot = 1; slot <= 6; slot += 1) {
      sessions.push({
        day: row[`day${slot}`],
        mode: row[`mode${slot}`],
        speaker: row[`speaker${slot}`],
        title: row[`title${slot}`],
      });
    }

    for (let start = 0; start < sessions.length; start += 5) {
      const year = start === 0 ? row.year : "";
      const month = start === 0 ? row.month : "";
      container.appendChild(buildYearMonthCell(year, month));

      for (let i = 0; i < 5; i += 1) {
        container.appendChild(buildSessionCell(sessions[start + i] || {}));
      }
    }
  });
}

async function loadProgramGrid() {
  if (!programGrid) return;
  try {
    const response = await fetch("data/program1.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("CSV not found");
    const text = await response.text();
    const rows = parseCsv(text, ";");
    renderProgramGrid(programGrid, rows);
  } catch (error) {
    programGrid.textContent = "Programma non disponibile.";
  }
}

loadProgramGrid();
