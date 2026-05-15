const $ = (selector) => document.querySelector(selector);
const formatIDR = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);

document.addEventListener("DOMContentLoaded", async () => {
  const marketplace = await fetchMarketplace();
  const artistId = new URLSearchParams(window.location.search).get("id") || marketplace.artists[0].id;
  const artist = marketplace.artists.find((item) => item.id === artistId) || marketplace.artists[0];
  const services = marketplace.services.filter((service) => service.artistId === artist.id || service.style === artist.style);
  const reviews = marketplace.reviews.filter((review) => review.artistId === artist.id);

  renderStudio(artist, services, reviews.length ? reviews : marketplace.reviews.slice(0, 2));
  fillBookingServices(services);
  setupEvents();
});

async function fetchMarketplace() {
  const response = await fetch("data/marketplace.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load marketplace data");
  return response.json();
}

function renderStudio(artist, services, reviews) {
  document.title = `${artist.studio} | BALI INK HUB`;
  const root = $("[data-studio-root]");
  root.innerHTML = `
    <section class="studio-hero" style="--studio-cover:url('${artist.cover}')">
      <div class="container studio-hero__grid">
        <img class="studio-avatar" src="${artist.image}" alt="${escapeHTML(artist.name)}">
        <div class="studio-title">
          <span class="eyebrow">Verified Artist Studio</span>
          <h1>${escapeHTML(artist.studio)}</h1>
          <p>${escapeHTML(artist.bio)}</p>
          <div class="studio-meta">
            <span class="pill">${escapeHTML(artist.name)}</span>
            <span class="pill">${escapeHTML(artist.area)}, Bali</span>
            <span class="pill">${escapeHTML(artist.style)}</span>
            <span class="pill">${artist.experience}+ years</span>
          </div>
        </div>
        <aside class="studio-score">
          <span>Studio rating</span>
          <strong>${artist.rating.toFixed(1)}</strong>
          <p>${artist.completed} completed marketplace bookings</p>
        </aside>
      </div>
    </section>

    <nav class="studio-nav">
      <div class="container studio-nav__inner">
        <a href="#overview">Overview</a>
        <a href="#studio-services">Services</a>
        <a href="#portfolio">Portfolio</a>
        <a href="#availability">Availability</a>
        <a href="#location">Location</a>
        <a href="#studio-reviews">Reviews</a>
        <a href="#policies">Policies</a>
      </div>
    </nav>

    <section class="container studio-layout">
      <div class="studio-main">
        <article class="studio-panel" id="overview">
          <span class="eyebrow">Studio overview</span>
          <h2>Service profile</h2>
          <p>${escapeHTML(artist.studio)} is a Bali-based tattoo studio profile inside BALI INK HUB. Clients can compare work, review services, check availability signals, and submit booking requests through the marketplace.</p>
          <div class="studio-stats">
            <article><strong>${artist.rating.toFixed(1)}</strong><span>Rating</span></article>
            <article><strong>${artist.completed}</strong><span>Completed</span></article>
            <article><strong>${artist.experience}y</strong><span>Experience</span></article>
            <article><strong>${escapeHTML(artist.response)}</strong><span>Response</span></article>
          </div>
        </article>

        <article class="studio-panel" id="studio-services">
          <span class="eyebrow">Packages</span>
          <h2>Studio services</h2>
          <div class="package-grid">
            ${services.map(packageTemplate).join("")}
          </div>
        </article>

        <article class="studio-panel" id="portfolio">
          <span class="eyebrow">Portfolio</span>
          <h2>Recent tattoo work</h2>
          <div class="portfolio-grid">
            ${portfolioImages(artist, services).map((image) => `<img src="${image}" alt="${escapeHTML(artist.style)} tattoo portfolio" loading="lazy">`).join("")}
          </div>
        </article>

        <article class="studio-panel" id="availability">
          <span class="eyebrow">Calendar</span>
          <h2>Availability preview</h2>
          <p>Dates shown here are sample marketplace availability slots. Final confirmation happens after the artist reviews the request.</p>
          <div class="availability-grid">
            ${Array.from({ length: 21 }, (_, index) => `<span class="${[2, 5, 9, 13, 18].includes(index) ? "available" : ""}">${index + 1}</span>`).join("")}
          </div>
        </article>

        <article class="studio-panel" id="location">
          <span class="eyebrow">Studio location</span>
          <h2>Map and directions</h2>
          <p>This dummy map represents the studio location that artists will provide during registration. Clients can open the location as a direction marker before visiting the studio.</p>
          <div class="studio-map">
            <iframe
              title="${escapeHTML(artist.studio)} location map"
              src="${mapEmbedUrl(artist)}"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
          <div class="map-info">
            <div>
              <strong>${escapeHTML(artist.studio)}</strong>
              <p>${escapeHTML(artist.address)}</p>
            </div>
            <a class="gold-btn" href="${mapDirectionUrl(artist)}" target="_blank" rel="noopener">Open Direction</a>
          </div>
        </article>

        <article class="studio-panel" id="studio-reviews">
          <span class="eyebrow">Client feedback</span>
          <h2>Studio reviews</h2>
          ${reviews.map(reviewTemplate).join("")}
        </article>

        <article class="studio-panel" id="policies">
          <span class="eyebrow">Marketplace standards</span>
          <h2>Booking policies</h2>
          <div class="policy-grid">
            <div class="policy-card"><strong>Deposit flow</strong><p>Deposit handling is prepared for platform escrow or payment gateway integration.</p></div>
            <div class="policy-card"><strong>Design review</strong><p>Artist reviews idea, size, placement, and reference before approving the request.</p></div>
            <div class="policy-card"><strong>Reschedule</strong><p>Clients can request schedule changes through marketplace booking history.</p></div>
            <div class="policy-card"><strong>Verification</strong><p>${escapeHTML(artist.verified)}.</p></div>
          </div>
        </article>
      </div>

      <aside class="studio-side">
        <div class="studio-panel side-card">
          <span class="eyebrow">Request booking</span>
          <h2>Start from ${formatIDR(Math.min(...services.map((service) => service.price)))}</h2>
          <p>Send one structured request to the marketplace. The artist reviews it from their studio dashboard before confirmation.</p>
          <button class="gold-btn" type="button" data-open-studio-booking>Request Booking</button>
          <a class="ghost-btn" href="index.html#artists">Compare Artists</a>
        </div>
        <div class="studio-panel">
          <span class="eyebrow">Languages</span>
          <p>${artist.languages.map(escapeHTML).join(", ")}</p>
        </div>
      </aside>
    </section>
  `;
}

function packageTemplate(service) {
  return `
    <div class="package-card">
      <span>${escapeHTML(service.area)} &middot; ${escapeHTML(service.style)}</span>
      <h3>${escapeHTML(service.title)}</h3>
      <p>Includes consultation, placement guidance, size estimate, and aftercare notes.</p>
      <strong>Starts at ${formatIDR(service.price)}</strong>
    </div>`;
}

function reviewTemplate(review) {
  return `
    <div class="studio-review">
      <div class="stars">${"&#9733;".repeat(review.rating)}</div>
      <p>${escapeHTML(review.comment)}</p>
      <strong>${escapeHTML(review.name)}</strong>
    </div>`;
}

function portfolioImages(artist, services) {
  const base = services.map((service) => service.image);
  return [...base, artist.cover, artist.image].slice(0, 6);
}

function fillBookingServices(services) {
  $("[data-studio-service-select]").innerHTML = services
    .map((service) => `<option value="${escapeHTML(service.id)}">${escapeHTML(service.title)} - From ${formatIDR(service.price)}</option>`)
    .join("");
}

function mapEmbedUrl(artist) {
  const delta = 0.01;
  const left = artist.longitude - delta;
  const right = artist.longitude + delta;
  const top = artist.latitude + delta;
  const bottom = artist.latitude - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${artist.latitude}%2C${artist.longitude}`;
}

function mapDirectionUrl(artist) {
  return `https://www.google.com/maps/search/?api=1&query=${artist.latitude},${artist.longitude}`;
}

function setupEvents() {
  $("[data-nav-toggle]")?.addEventListener("click", () => $("[data-nav-menu]").classList.toggle("open"));

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-studio-booking]")) {
      const modal = $('[data-modal="studio-booking"]');
      if (modal?.showModal) modal.showModal();
    }
  });

  $("[data-studio-booking-form]").addEventListener("submit", () => {
    showToast("Marketplace request submitted for artist review.");
  });
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__studioToast);
  window.__studioToast = setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
