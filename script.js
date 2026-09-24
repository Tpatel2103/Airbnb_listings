/* ===========================================================
   50 Stays, San Francisco
   Loads the first 50 listings from a local JSON file with
   fetch() + async/await, then renders them as "boarding pass"
   cards with a live amenity-match feature.
   =========================================================== */

const DATA_URL = "data/airbnb_listings.json";
const LISTING_COUNT = 50;
const TOP_AMENITY_COUNT = 10;

const state = {
  listings: [],       // the 50 listings, normalized
  amenityUniverse: [], // [{name, count}] top amenities across the set
  selectedAmenities: new Set(),
  searchTerm: "",
  sortBy: "default",
};

const el = {
  grid: document.getElementById("listingsGrid"),
  status: document.getElementById("statusBanner"),
  search: document.getElementById("searchInput"),
  sort: document.getElementById("sortSelect"),
  checklist: document.getElementById("amenityChecklist"),
  surpriseBtn: document.getElementById("surpriseBtn"),
  resultCount: document.getElementById("resultCount"),
  statAvgPrice: document.getElementById("statAvgPrice"),
  statSuperhosts: document.getElementById("statSuperhosts"),
  statAmenities: document.getElementById("statAmenities"),
};

/* ---------- helpers: tolerate a few different field shapes ---------- */

function firstDefined(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function parsePrice(raw) {
  if (raw === undefined) return 0;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    // Try real JSON first (Inside Airbnb sometimes ships amenities as a
    // JSON-looking string, e.g. {"Wifi","Kitchen"} which isn't valid JSON).
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      // fall through to manual split below
    }
    return raw
      .replace(/[{}\[\]"]/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeListing(raw, index) {
  const amenities = parseAmenities(
    firstDefined(raw, ["amenities"])
  );

  return {
    id: firstDefined(raw, ["id", "listing_id"]) ?? `row-${index}`,
    name: firstDefined(raw, ["name", "listing_name"]) ?? "Untitled stay",
    description:
      firstDefined(raw, ["description", "summary", "space"]) ??
      "No description provided for this listing.",
    price: parsePrice(firstDefined(raw, ["price"])),
    thumbnail: firstDefined(raw, [
      "picture_url",
      "thumbnail_url",
      "medium_url",
      "xl_picture_url",
    ]),
    hostName: firstDefined(raw, ["host_name"]) ?? "Unknown host",
    hostPhoto: firstDefined(raw, [
      "host_picture_url",
      "host_thumbnail_url",
    ]),
    isSuperhost: Boolean(
      firstDefined(raw, ["host_is_superhost"]) === true ||
        firstDefined(raw, ["host_is_superhost"]) === "t"
    ),
    neighbourhood:
      firstDefined(raw, ["neighbourhood_cleansed", "neighbourhood"]) ?? "",
    roomType: firstDefined(raw, ["room_type"]) ?? "",
    rating: Number(firstDefined(raw, ["review_scores_rating"]) ?? 0),
    reviews: Number(firstDefined(raw, ["number_of_reviews"]) ?? 0),
    minNights: Number(firstDefined(raw, ["minimum_nights"]) ?? 1),
    amenities,
  };
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* ---------- loading ---------- */

async function loadListings() {
  setStatus("Loading the manifest…", false);
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Server responded ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.listings ?? [];

    state.listings = rows.slice(0, LISTING_COUNT).map(normalizeListing);
    state.amenityUniverse = buildAmenityUniverse(state.listings, TOP_AMENITY_COUNT);

    clearStatus();
    renderAmenityChecklist();
    renderStats();
    render();
  } catch (err) {
    console.error("Failed to load listings:", err);
    setStatus(
      `Couldn't load ${DATA_URL} — ${err.message}. ` +
      `Make sure the JSON file exists and you're viewing this over http:// (not file://).`,
      true
    );
  }
}

function setStatus(message, isError) {
  el.status.hidden = false;
  el.status.textContent = message;
  el.status.classList.toggle("is-error", Boolean(isError));
}

function clearStatus() {
  el.status.hidden = true;
  el.status.textContent = "";
  el.status.classList.remove("is-error");
}

/* ---------- amenities & stats ---------- */

function buildAmenityUniverse(listings, topN) {
  const counts = new Map();
  for (const listing of listings) {
    for (const amenity of listing.amenities) {
      counts.set(amenity, (counts.get(amenity) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, count]) => ({ name, count }));
}

function renderAmenityChecklist() {
  el.checklist.innerHTML = state.amenityUniverse
    .map(
      ({ name, count }) => `
      <li>
        <label>
          <input type="checkbox" value="${escapeHTML(name)}" data-role="amenity-toggle" />
          ${escapeHTML(name)}
          <span class="amenity-count">${count}</span>
        </label>
      </li>`
    )
    .join("");
}

function renderStats() {
  const n = state.listings.length || 1;
  const avgPrice = state.listings.reduce((sum, l) => sum + l.price, 0) / n;
  const superhosts = state.listings.filter((l) => l.isSuperhost).length;
  const uniqueAmenities = new Set(state.listings.flatMap((l) => l.amenities)).size;

  el.statAvgPrice.textContent = `$${avgPrice.toFixed(0)}`;
  el.statSuperhosts.textContent = String(superhosts);
  el.statAmenities.textContent = String(uniqueAmenities);
}

function matchScore(listing) {
  if (state.selectedAmenities.size === 0) return null;
  let hits = 0;
  for (const wanted of state.selectedAmenities) {
    if (listing.amenities.includes(wanted)) hits += 1;
  }
  return { hits, total: state.selectedAmenities.size };
}

/* ---------- filtering + sorting ---------- */

function getVisibleListings() {
  const term = state.searchTerm.trim().toLowerCase();

  let list = state.listings.filter((listing) => {
    if (!term) return true;
    return (
      listing.name.toLowerCase().includes(term) ||
      listing.description.toLowerCase().includes(term) ||
      listing.neighbourhood.toLowerCase().includes(term)
    );
  });

  const withMatch = list.map((listing) => ({
    listing,
    match: matchScore(listing),
  }));

  switch (state.sortBy) {
    case "price-asc":
      withMatch.sort((a, b) => a.listing.price - b.listing.price);
      break;
    case "price-desc":
      withMatch.sort((a, b) => b.listing.price - a.listing.price);
      break;
    case "rating-desc":
      withMatch.sort((a, b) => b.listing.rating - a.listing.rating);
      break;
    case "match-desc":
      withMatch.sort((a, b) => {
        const aRatio = a.match ? a.match.hits / a.match.total : -1;
        const bRatio = b.match ? b.match.hits / b.match.total : -1;
        return bRatio - aRatio;
      });
      break;
    default:
      break;
  }

  return withMatch;
}

/* ---------- rendering ---------- */

function cardTemplate({ listing, match }, index) {
  const shownAmenities = listing.amenities.slice(0, 5);
  const remaining = listing.amenities.length - shownAmenities.length;
  const wanted = state.selectedAmenities;

  const amenityTagsHTML = shownAmenities
    .map((a) => {
      const isMatch = wanted.has(a);
      return `<span class="amenity-tag${isMatch ? " is-match" : ""}">${escapeHTML(a)}</span>`;
    })
    .join("") + (remaining > 0 ? `<span class="amenity-tag more">+${remaining} more</span>` : "");

  const stampHTML = match
    ? (() => {
        const pct = match.total ? match.hits / match.total : 0;
        const deg = Math.round(pct * 360);
        return `
        <div class="match-stamp is-active" title="${match.hits} of ${match.total} amenities you picked">
          <div class="ring" style="background: conic-gradient(var(--ggb-orange) ${deg}deg, var(--paper-dark) ${deg}deg)"></div>
          <div class="hole">
            <b>${match.hits}/${match.total}</b>
            <small>MATCH</small>
          </div>
        </div>`;
      })()
    : "";

  const photo = listing.thumbnail
    ? `<img src="${escapeHTML(listing.thumbnail)}" alt="Photo of ${escapeHTML(listing.name)}" loading="lazy" onerror="this.closest('.pass-photo').innerHTML='<div style=&quot;display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-soft);font-size:0.8rem;&quot;>No photo available</div>'" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-soft);font-size:0.8rem;">No photo available</div>`;

  const hostPhoto = listing.hostPhoto
    ? `<img src="${escapeHTML(listing.hostPhoto)}" alt="${escapeHTML(listing.hostName)}" loading="lazy" onerror="this.style.visibility='hidden'" />`
    : "";

  const shortDesc = listing.description.length > 140
    ? listing.description.slice(0, 140).trim() + "…"
    : listing.description;
  const needsExpand = listing.description.length > 140;

  return `
    <article class="pass-card" style="--i:${index}" data-id="${escapeHTML(String(listing.id))}">
      <div class="pass-photo">
        ${photo}
        <span class="pass-ticketno">NO. ${escapeHTML(String(listing.id))}</span>
        <span class="pass-price">$${listing.price.toFixed(0)}<span>per night</span></span>
        ${stampHTML}
        <div class="pass-host">${hostPhoto}</div>
      </div>
      <div class="pass-body">
        <p class="pass-hostname">Hosted by <strong>${escapeHTML(listing.hostName)}</strong>${listing.isSuperhost ? " · Superhost" : ""}</p>
        <h2 class="pass-name">${escapeHTML(listing.name)}</h2>
        <p class="pass-desc" data-role="desc" data-full="${escapeHTML(listing.description)}" data-short="${escapeHTML(shortDesc)}">
          ${escapeHTML(shortDesc)}
          ${needsExpand ? `<button type="button" data-role="toggle-desc">Read more ›</button>` : ""}
        </p>
        <div class="pass-meta">
          ${listing.neighbourhood ? `<span class="meta-chip">${escapeHTML(listing.neighbourhood)}</span>` : ""}
          ${listing.roomType ? `<span class="meta-chip">${escapeHTML(listing.roomType)}</span>` : ""}
          ${listing.rating ? `<span class="meta-chip">★ ${listing.rating.toFixed(1)}</span>` : ""}
        </div>
        <div class="amenity-tags">${amenityTagsHTML}</div>
      </div>
    </article>`;
}

function render() {
  const visible = getVisibleListings();

  el.grid.innerHTML = visible.map((entry, i) => cardTemplate(entry, i)).join("");
  el.resultCount.textContent = `${visible.length} of ${state.listings.length} listings shown`;
}

/* ---------- event wiring ---------- */

function attachEvents() {
  el.search.addEventListener("input", (e) => {
    state.searchTerm = e.target.value;
    render();
  });

  el.sort.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    render();
  });

  el.checklist.addEventListener("change", (e) => {
    const target = e.target;
    if (target.dataset.role !== "amenity-toggle") return;
    if (target.checked) state.selectedAmenities.add(target.value);
    else state.selectedAmenities.delete(target.value);
    render();
  });

  // Event delegation for per-card "Read more" toggles
  el.grid.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-role="toggle-desc"]');
    if (!btn) return;
    const p = btn.closest('[data-role="desc"]');
    const expanded = p.dataset.expanded === "true";
    if (expanded) {
      p.innerHTML = `${escapeHTML(p.dataset.short)} <button type="button" data-role="toggle-desc">Read more ›</button>`;
      p.dataset.expanded = "false";
    } else {
      p.innerHTML = `${escapeHTML(p.dataset.full)} <button type="button" data-role="toggle-desc">Show less ‹</button>`;
      p.dataset.expanded = "true";
    }
  });

  el.surpriseBtn.addEventListener("click", surpriseMe);
}

function surpriseMe() {
  const cards = [...el.grid.querySelectorAll(".pass-card")];
  if (cards.length === 0) return;
  const pick = cards[Math.floor(Math.random() * cards.length)];

  cards.forEach((c) => c.classList.remove("is-highlighted"));
  pick.scrollIntoView({ behavior: "smooth", block: "center" });
  // restart animation cleanly
  requestAnimationFrame(() => {
    pick.classList.add("is-highlighted");
    setTimeout(() => pick.classList.remove("is-highlighted"), 2300);
  });
}

/* ---------- boot ---------- */

attachEvents();
loadListings();