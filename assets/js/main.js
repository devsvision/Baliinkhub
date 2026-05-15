const state = {
  marketplace: null,
  artistFilter: "recommended"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const formatIDR = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);

document.addEventListener("DOMContentLoaded", async () => {
  state.marketplace = await fetchMarketplace();
  fillFilters();
  renderCategories();
  renderServices(state.marketplace.services);
  renderStyleTabs();
  renderPopular(state.marketplace.styles[0]);
  renderArtists();
  renderReviews();
  setupEvents();
});

async function fetchMarketplace() {
  const response = await fetch("data/marketplace.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load marketplace data");
  return response.json();
}

function fillFilters() {
  const areaSelect = $("[name='area']");
  const styleSelect = $("[name='style']");
  const artistSelect = $("[name='artist']");
  const { areas, styles, artists } = state.marketplace;

  areaSelect.innerHTML += areas.map((area) => `<option value="${escapeHTML(area)}">${escapeHTML(area)}</option>`).join("");
  styleSelect.innerHTML += styles.map((style) => `<option value="${escapeHTML(style)}">${escapeHTML(style)}</option>`).join("");
  artistSelect.innerHTML = artists.map((artist) => `<option value="${escapeHTML(artist.id)}">${escapeHTML(artist.name)} - ${escapeHTML(artist.area)}</option>`).join("");
}

function renderCategories() {
  $("[data-category-grid]").innerHTML = state.marketplace.categories
    .map(
      (category) => `
        <article class="category-card">
          <img src="${category.image}" alt="${escapeHTML(category.name)} tattoo category" loading="lazy">
          <h3>${escapeHTML(category.name)}</h3>
          <p>${category.count} Services</p>
          <button class="ghost-btn" type="button" data-quick-search="${escapeHTML(category.name)}">View All</button>
        </article>`
    )
    .join("");
}

function renderServices(services) {
  $("[data-service-grid]").innerHTML = services
    .map(
      (service) => `
        <article class="card">
          <img src="${service.image}" alt="${escapeHTML(service.title)}" loading="lazy">
          <div class="card-body">
            <span class="pill">${escapeHTML(service.area)}</span>
            <h3>${escapeHTML(service.title)}</h3>
            <p>${escapeHTML(service.style)} tattoo service in Bali.</p>
            <div class="price-row"><strong>Starts at ${formatIDR(service.price)}</strong><span>${service.rating.toFixed(1)}</span></div>
          </div>
        </article>`
    )
    .join("");
}

function renderStyleTabs() {
  $("[data-style-tabs]").innerHTML = state.marketplace.styles
    .slice(0, 5)
    .map((style, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-style-tab="${escapeHTML(style)}">${escapeHTML(style)}</button>`)
    .join("");
}

function renderPopular(style) {
  const items = state.marketplace.services.filter((service) => service.style === style);
  const services = items.length ? items : state.marketplace.services.slice(0, 4);
  $("[data-popular-grid]").innerHTML = services
    .slice(0, 4)
    .map(
      (service) => `
        <article class="card">
          <img src="${service.image}" alt="${escapeHTML(service.title)}" loading="lazy">
          <div class="card-body">
            <h3>${escapeHTML(service.title)}</h3>
            <div class="rating-row"><span>${service.rating} (${service.reviews} Reviews)</span><strong>From ${formatIDR(service.price)}</strong></div>
            <p>${service.bookings} Bookings &middot; ${escapeHTML(service.area)}</p>
          </div>
        </article>`
    )
    .join("");
}

function renderArtists() {
  const artists = state.artistFilter === "featured" ? state.marketplace.artists.filter((artist) => artist.featured) : state.marketplace.artists;
  $("[data-artist-grid]").innerHTML = artists
    .map(
      (artist) => `
        <article class="artist-card">
          <img src="${artist.image}" alt="${escapeHTML(artist.name)}" loading="lazy">
          <div class="artist-body">
            <span class="pill">${escapeHTML(artist.style)}</span>
            <h3>${escapeHTML(artist.name)}</h3>
            <p>${escapeHTML(artist.area)}, Bali</p>
            <div class="artist-actions">
              <a class="ghost-btn" href="studio.html?id=${escapeHTML(artist.id)}">View Studio</a>
              <button class="gold-btn" type="button" data-open-booking>Request</button>
            </div>
          </div>
        </article>`
    )
    .join("");
}

function renderReviews() {
  $("[data-review-grid]").innerHTML = state.marketplace.reviews
    .map(
      (review) => `
        <article class="review-card">
          <div class="stars">${"&#9733;".repeat(review.rating)}</div>
          <p>${escapeHTML(review.comment)}</p>
          <strong>${escapeHTML(review.name)}</strong>
        </article>`
    )
    .join("");
}

function setupEvents() {
  $("[data-nav-toggle]").addEventListener("click", () => $("[data-nav-menu]").classList.toggle("open"));

  $("[data-search-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = sanitize(form.get("query")).toLowerCase();
    const area = form.get("area");
    const style = form.get("style");
    const filtered = state.marketplace.services.filter((service) => {
      const text = `${service.title} ${service.style} ${service.area}`.toLowerCase();
      return (!query || text.includes(query)) && (!area || service.area === area) && (!style || service.style === style);
    });
    renderServices(filtered.length ? filtered : state.marketplace.services);
    $("#services").scrollIntoView({ behavior: "smooth" });
  });

  document.addEventListener("click", (event) => {
    const quick = event.target.closest("[data-quick-search]");
    if (quick) {
      const style = quick.dataset.quickSearch;
      $("[name='query']").value = style;
      renderServices(state.marketplace.services.filter((service) => service.style === style));
      $("#services").scrollIntoView({ behavior: "smooth" });
    }

    const tab = event.target.closest("[data-style-tab]");
    if (tab) {
      $$("[data-style-tab]").forEach((item) => item.classList.toggle("active", item === tab));
      renderPopular(tab.dataset.styleTab);
    }

    const artistFilter = event.target.closest("[data-artist-filter]");
    if (artistFilter) {
      state.artistFilter = artistFilter.dataset.artistFilter;
      $$("[data-artist-filter]").forEach((item) => item.classList.toggle("active", item === artistFilter));
      renderArtists();
    }

    if (event.target.closest("[data-open-booking]")) openModal("booking");
    if (event.target.closest("[data-open-login]")) openModal("login");
  });

  $("[data-booking-form]").addEventListener("submit", () => {
    showToast("Booking request saved in the marketplace flow.");
  });
}

function openModal(name) {
  const modal = document.querySelector(`[data-modal="${name}"]`);
  if (modal?.showModal) modal.showModal();
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => toast.classList.remove("show"), 3000);
}

function sanitize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
