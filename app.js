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
let programRows = null;

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
  cell.className = `program-cell col-2 ${className}`;
  if (text) cell.textContent = text;
  return cell;
}

function buildYearCell(year) {
  const cell = document.createElement("div");
  cell.className = "program-cell program-year-cell col-1";

  if (!year) {
    cell.classList.add("program-empty");
    return cell;
  }

  const yearEl = document.createElement("span");
  yearEl.className = "program-year";
  yearEl.textContent = year;
  cell.appendChild(yearEl);
  return cell;
}

function buildMonthCell(month, groupId) {
  const cell = document.createElement("div");
  cell.className = "program-cell program-month-cell col-1";
  if (groupId) cell.dataset.group = groupId;

  if (!month) {
    cell.classList.add("program-empty");
    return cell;
  }

  const monthEl = document.createElement("span");
  monthEl.className = "program-month";
  monthEl.textContent = month;
  cell.appendChild(monthEl);
  return cell;
}

function buildSessionCell({ day, mode, speaker, title, time, info }, groupId, sessionId) {
  const isEmpty = !day && !speaker && !title;
  if (isEmpty) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "program-cell program-empty col-2";
    return emptyCell;
  }

  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "program-cell program-session col-2";
  if (groupId) cell.dataset.group = groupId;
  if (sessionId) cell.dataset.sessionId = sessionId;
  cell.dataset.time = time || "";
  cell.dataset.info = info || title || "";
  cell.setAttribute("aria-expanded", "false");

  const dayRow = document.createElement("div");
  dayRow.className = "program-day";
  dayRow.textContent = day;
  cell.appendChild(dayRow);

  if (mode) {
    const normalizedMode = mode.trim().toLowerCase();
    let modeType = null;
    if (normalizedMode.startsWith("on")) modeType = "online";
    if (normalizedMode.startsWith("off")) modeType = "offline";

    const modeEl = document.createElement("span");
    modeEl.className = "program-mode";
    if (modeType) {
      modeEl.classList.add(`program-mode--${modeType}`);
      modeEl.setAttribute("aria-label", modeType);
      modeEl.setAttribute("title", modeType.toUpperCase());
    } else {
      modeEl.textContent = mode;
    }
    cell.appendChild(modeEl);
  }

  if (speaker || title) {
    const textWrap = document.createElement("div");
    textWrap.className = "program-text";

    if (speaker) {
      const speakerEl = document.createElement("div");
      speakerEl.className = "program-speaker";
      speakerEl.textContent = speaker;
      textWrap.appendChild(speakerEl);
    }

    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "program-title";
      titleEl.textContent = title;
      textWrap.appendChild(titleEl);
    }

    cell.appendChild(textWrap);
  }
  return cell;
}

function buildDetailRow(groupId) {
  const detail = document.createElement("div");
  detail.className = "program-detail";
  detail.dataset.group = groupId;
  detail.hidden = true;

  const timeEl = document.createElement("div");
  timeEl.className = "program-detail-time";

  const textEl = document.createElement("div");
  textEl.className = "program-detail-text";

  detail.appendChild(timeEl);
  detail.appendChild(textEl);
  return detail;
}

function getSessionsPerRow(container) {
  const styles = getComputedStyle(container);
  const rawPerRow = styles.getPropertyValue("--program-sessions-per-row").trim();
  const perRow = Number.parseInt(rawPerRow, 10);
  if (Number.isFinite(perRow) && perRow > 0) {
    return perRow;
  }
  const rawColumns = styles.getPropertyValue("--program-columns").trim();
  const columns = Number.parseInt(rawColumns, 10);
  const totalColumns = Number.isFinite(columns) && columns > 0 ? columns : 12;
  return Math.max(1, Math.floor((totalColumns - 2) / 2));
}

function hasSessionContent(session) {
  return Boolean(
    session.day ||
    session.mode ||
    session.speaker ||
    session.title ||
    session.time ||
    session.info,
  );
}

function renderProgramGrid(container, rows) {
  container.innerHTML = "";
  activeSession = null;
  const sessionsPerRow = getSessionsPerRow(container);

  rows.forEach((row, rowIndex) => {
    const sessions = [];
    for (let slot = 1; slot <= 6; slot += 1) {
      sessions.push({
        day: row[`day${slot}`],
        mode: row[`mode${slot}`],
        speaker: row[`speaker${slot}`],
        title: row[`title${slot}`],
        time: row[`time${slot}`],
        info: row[`info${slot}`],
        sessionId: `${rowIndex}-${slot - 1}`,
      });
    }

    for (let start = 0; start < sessions.length; start += sessionsPerRow) {
      const groupSessions = sessions.slice(start, start + sessionsPerRow);
      if (start > 0 && groupSessions.every((session) => !hasSessionContent(session))) {
        continue;
      }
      const groupId = `${rowIndex}-${start}`;
      const year = start === 0 ? row.year : "";
      const month = start === 0 ? row.month : "";
      container.appendChild(buildYearCell(year));
      container.appendChild(buildMonthCell(month, groupId));

      for (let i = 0; i < sessionsPerRow; i += 1) {
        const session = groupSessions[i];
        container.appendChild(buildSessionCell(session || {}, groupId, session?.sessionId));
      }
      container.appendChild(buildDetailRow(groupId));
    }
  });

  if (activeSessionId) {
    const session = container.querySelector(`.program-session[data-session-id="${activeSessionId}"]`);
    if (session) {
      openSession(container, session);
    }
  }
}

async function loadProgramGrid() {
  if (!programGrid) return;
  try {
    const response = await fetch("data/program1.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("CSV not found");
    const text = await response.text();
    const rows = parseCsv(text, ";");
    programRows = rows;
    renderProgramGrid(programGrid, rows);
  } catch (error) {
    programGrid.textContent = "Programma non disponibile.";
  }
}

loadProgramGrid();

let programResizeRaf = null;
window.addEventListener("resize", () => {
  if (!programGrid || !programRows) return;
  if (programResizeRaf) cancelAnimationFrame(programResizeRaf);
  programResizeRaf = requestAnimationFrame(() => {
    renderProgramGrid(programGrid, programRows);
    programResizeRaf = null;
  });
});

let activeSession = null;
let activeSessionId = null;

function clearActiveSession(container) {
  if (!activeSession) return;
  const groupId = activeSession.dataset.group;
  activeSession.classList.remove("program-session--active");
  activeSession.setAttribute("aria-expanded", "false");
  activeSessionId = null;

  const monthCell = container.querySelector(`.program-month-cell[data-group="${groupId}"] .program-month`);
  monthCell?.classList.remove("program-month--active");

  const detail = container.querySelector(`.program-detail[data-group="${groupId}"]`);
  if (detail) {
    detail.hidden = true;
    detail.classList.remove("program-detail--open");
  }

  activeSession = null;
}

function openSession(container, session) {
  const groupId = session.dataset.group;
  const detail = container.querySelector(`.program-detail[data-group="${groupId}"]`);
  if (!detail) return;

  const time = session.dataset.time || "";
  const info = session.dataset.info || "";
  if (!time && !info) return;

  detail.querySelector(".program-detail-time").textContent = time;
  detail.querySelector(".program-detail-text").textContent = info;
  detail.hidden = false;
  detail.classList.add("program-detail--open");

  const monthCell = container.querySelector(`.program-month-cell[data-group="${groupId}"] .program-month`);
  monthCell?.classList.add("program-month--active");

  session.classList.add("program-session--active");
  session.setAttribute("aria-expanded", "true");
  activeSession = session;
  activeSessionId = session.dataset.sessionId || null;
}

programGrid?.addEventListener("click", (event) => {
  const session = event.target.closest(".program-session");
  if (!session) return;

  if (activeSession === session) {
    clearActiveSession(programGrid);
    return;
  }

  clearActiveSession(programGrid);
  openSession(programGrid, session);
});
