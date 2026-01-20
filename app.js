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

const EXCLUDED_ACTIVE_IDS = new Set(["momento-1"]);
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
