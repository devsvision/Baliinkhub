const $ = (selector) => document.querySelector(selector);
const formatIDR = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);
const transportFees = {
  Canggu: 150000,
  Karangasem: 350000,
  Singaraja: 400000,
  Ubud: 250000,
  Seminyak: 150000,
  Denpasar: 120000,
  Kuta: 150000,
  Sanur: 160000,
  Uluwatu: 280000,
  Amed: 380000
};

let activeServices = [];
let activeAreas = [];
const bookingState = {
  step: 1,
  clientLocation: "Canggu",
  serviceMode: "studio",
  serviceId: "",
  selectedDate: "2026-05-15",
  selectedTime: "10:00",
  name: "",
  email: "",
  phone: "",
  notes: "",
  paymentMethod: "credit",
  paymentGateway: "midtrans"
};
const bookingSteps = ["Location", "Service Mode", "Service", "Date & Time", "Personal Information", "Cart", "Payment", "Confirmation"];

document.addEventListener("DOMContentLoaded", async () => {
  const marketplace = await fetchMarketplace();
  const artistId = new URLSearchParams(window.location.search).get("id") || marketplace.artists[0].id;
  const artist = marketplace.artists.find((item) => item.id === artistId) || marketplace.artists[0];
  const services = marketplace.services.filter((service) => service.artistId === artist.id || service.style === artist.style);
  const reviews = marketplace.reviews.filter((review) => review.artistId === artist.id);
  activeServices = services;
  activeAreas = marketplace.areas;
  bookingState.clientLocation = marketplace.areas[0];
  bookingState.serviceId = services[0].id;

  renderStudio(artist, services, reviews.length ? reviews : marketplace.reviews.slice(0, 2));
  renderBookingWizard($("[data-studio-booking-form]"));
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
          <p>${escapeHTML(artist.studio)} is a Bali-based tattoo studio profile inside BALI INK HUB. Clients can compare work, review services, check availability signals, and submit booking services through the marketplace.</p>
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
          <p>Dates shown here are sample marketplace availability slots. Final confirmation happens after the artist reviews the booking service.</p>
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
            <div class="policy-card"><strong>Design review</strong><p>Artist reviews idea, size, placement, and reference before approving the booking service.</p></div>
            <div class="policy-card"><strong>Reschedule</strong><p>Clients can manage schedule changes through marketplace booking history.</p></div>
            <div class="policy-card"><strong>Verification</strong><p>${escapeHTML(artist.verified)}.</p></div>
          </div>
        </article>
      </div>

      <aside class="studio-side">
        <div class="studio-panel side-card">
          <span class="eyebrow">Booking service</span>
          <h2>Start from ${formatIDR(Math.min(...services.map((service) => service.price)))}</h2>
          <p>Send one structured booking to the marketplace. The artist reviews it from their studio dashboard before confirmation.</p>
          <button class="gold-btn" type="button" data-open-studio-booking>Booking Service</button>
          <a class="ghost-btn" href="index.html#artists">Compare Artists</a>
        </div>
        <div class="studio-panel artist-profile-card">
          <span class="eyebrow">Artist profile</span>
          <div class="profile-head">
            <div class="profile-avatar-wrap">
              <img src="${artist.image}" alt="${escapeHTML(artist.name)} profile photo">
              <span>✓</span>
            </div>
            <h2>${escapeHTML(artist.name)}</h2>
            <p><strong>${artist.rating.toFixed(1)}</strong> (${artist.completed} bookings)</p>
          </div>
          <div class="profile-list">
            <div><span>Member Since</span><strong>2024</strong></div>
            <div><span>Studio</span><strong>${escapeHTML(artist.studio)}</strong></div>
            <div><span>Address</span><strong>${escapeHTML(artist.address)}</strong></div>
            <div><span>Style</span><strong>${escapeHTML(artist.style)}</strong></div>
            <div><span>No of Listings</span><strong>${services.length}</strong></div>
            <div><span>Marketplace Contact</span><strong>In-platform only</strong></div>
          </div>
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
      if (modal?.showModal) {
        renderBookingWizard($("[data-studio-booking-form]"));
        modal.showModal();
      }
    }
    if (event.target.closest("[data-open-me]")) {
      const modal = $('[data-modal="me"]');
      if (modal?.showModal) modal.showModal();
    }
    handleMeModalClick(event);
  });

  $("[data-studio-booking-form]").addEventListener("submit", () => {
    showToast("Booking service submitted for artist review.");
  });

  $("[data-me-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    showDashboardPreview(event.currentTarget);
  });
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__studioToast);
  window.__studioToast = setTimeout(() => toast.classList.remove("show"), 3000);
}

function bookingTotals() {
  const selectedService = activeServices.find((service) => service.id === bookingState.serviceId) || activeServices[0];
  const location = bookingState.clientLocation || activeAreas[0];
  const mode = bookingState.serviceMode;
  const transport = mode === "mobile" ? transportFees[location] || 0 : 0;
  return { selectedService, transport, total: selectedService.price + transport };
}

function renderBookingWizard(form) {
  if (!form) return;
  const { selectedService, transport, total } = bookingTotals();
  form.querySelector("[data-booking-mini]").innerHTML = `<img src="${selectedService.image}" alt="${escapeHTML(selectedService.title)}"><div><strong>${escapeHTML(selectedService.title)}</strong><span>${selectedService.rating.toFixed(1)} (${selectedService.reviews} reviews)</span></div>`;
  form.querySelector("[data-booking-steps]").innerHTML = bookingSteps.map((step, index) => {
    const number = index + 1;
    const status = number < bookingState.step ? "done" : number === bookingState.step ? "active" : "";
    return `<li class="${status}"><span>${number < bookingState.step ? "✓" : number}</span>${number}. ${step}</li>`;
  }).join("");
  form.querySelector("[data-booking-title]").textContent = bookingSteps[bookingState.step - 1];
  form.querySelector("[data-booking-body]").innerHTML = bookingStepTemplate(bookingState.step, selectedService, transport, total);
  form.querySelector("[data-booking-prev]").disabled = bookingState.step === 1;
  form.querySelector("[data-booking-next]").classList.toggle("hidden", bookingState.step === 8);
  form.querySelector("[data-booking-submit]").classList.toggle("hidden", bookingState.step !== 8);
  bindBookingStepEvents(form);
}

function bookingStepTemplate(step, selectedService, transport, total) {
  if (step === 1) return `<div class="wizard-section"><p>Choose where the client is located. This location is used to calculate mobile service transport cost.</p><div class="choice-grid">${activeAreas.map((area) => `<button type="button" class="${bookingState.clientLocation === area ? "selected" : ""}" data-booking-location="${escapeHTML(area)}">${escapeHTML(area)}</button>`).join("")}</div></div>`;
  if (step === 2) return `<div class="service-mode-grid wizard-mode"><label class="${bookingState.serviceMode === "studio" ? "selected" : ""}"><input type="radio" name="serviceMode" value="studio" ${bookingState.serviceMode === "studio" ? "checked" : ""}><strong>In-Studio Experience</strong><small>Client visits the artist studio. No transport fee after service cost.</small></label><label class="${bookingState.serviceMode === "mobile" ? "selected" : ""}"><input type="radio" name="serviceMode" value="mobile" ${bookingState.serviceMode === "mobile" ? "checked" : ""}><strong>On-Demand / Mobile Service</strong><small>Artist goes to client location. Transport fee appears in cart.</small></label></div>`;
  if (step === 3) return `<div class="wizard-service-grid">${activeServices.map((service) => `<button type="button" class="${bookingState.serviceId === service.id ? "selected" : ""}" data-booking-service="${escapeHTML(service.id)}"><img src="${service.image}" alt="${escapeHTML(service.title)}"><span>${escapeHTML(service.title)}</span><strong>${formatIDR(service.price)}</strong></button>`).join("")}</div>`;
  if (step === 4) return `<div class="date-time-grid"><div><p>Select date</p><div class="mini-calendar">${calendarTemplate()}</div></div><div><p>Select time</p><div class="time-grid">${["09:00","10:00","11:30","13:00","14:30","16:00","18:00","20:00"].map((time) => `<button type="button" class="${bookingState.selectedTime === time ? "selected" : ""}" data-booking-time="${time}">${time}</button>`).join("")}</div></div></div>`;
  if (step === 5) return `<div class="personal-grid"><aside class="booking-summary static"><div><span>Selected service</span><strong>${escapeHTML(selectedService.title)}</strong></div><div><span>Client location</span><strong>${escapeHTML(bookingState.clientLocation)}</strong></div><div><span>Service mode</span><strong>${modeLabel()}</strong></div></aside><div class="booking-fields"><input name="name" value="${escapeHTML(bookingState.name)}" placeholder="Full name"><input name="email" value="${escapeHTML(bookingState.email)}" placeholder="Email address"><input name="phone" value="${escapeHTML(bookingState.phone)}" placeholder="Phone number"><textarea name="notes" placeholder="Tattoo idea, placement, size, and reference notes">${escapeHTML(bookingState.notes)}</textarea></div></div>`;
  if (step === 6) return cartTemplate(selectedService, transport, total);
  if (step === 7) {
    const gateway = bookingState.paymentMethod === "credit" ? ["midtrans"] : bookingState.paymentMethod === "digital" ? ["ovo", "dana", "qris"] : ["bank-transfer"];
    return `<div class="payment-grid"><div><h3>Payment method</h3>${[["credit","Credit Card"],["digital","Digital Wallet"],["other","Other Payment"]].map(([value,label]) => `<button type="button" class="${bookingState.paymentMethod === value ? "selected" : ""}" data-payment-method="${value}">${label}</button>`).join("")}</div><div><h3>Payment gateway</h3>${gateway.map((value) => `<button type="button" class="${bookingState.paymentGateway === value ? "selected" : ""}" data-payment-gateway="${value}">${gatewayLabel(value)}</button>`).join("")}</div></div>${cartTemplate(selectedService, transport, total)}`;
  }
  return `<div class="confirmation-box"><h3>Booking Service Ready</h3><p>Please review your booking. After confirmation, payment continues through the selected gateway.</p>${cartTemplate(selectedService, transport, total)}<div class="booking-summary static"><div><span>Date & time</span><strong>${bookingState.selectedDate} · ${bookingState.selectedTime}</strong></div><div><span>Payment</span><strong>${gatewayLabel(bookingState.paymentGateway)}</strong></div><div><span>Client</span><strong>${escapeHTML(bookingState.name || "Client name")}</strong></div></div></div>`;
}

function bindBookingStepEvents(form) {
  form.querySelector("[data-booking-prev]").onclick = () => {
    bookingState.step = Math.max(1, bookingState.step - 1);
    renderBookingWizard(form);
  };
  form.querySelector("[data-booking-next]").onclick = () => {
    capturePersonalInfo(form);
    bookingState.step = Math.min(8, bookingState.step + 1);
    renderBookingWizard(form);
  };
  form.querySelectorAll("[data-booking-location]").forEach((button) => button.onclick = () => {
    bookingState.clientLocation = button.dataset.bookingLocation;
    renderBookingWizard(form);
  });
  form.querySelectorAll("[name='serviceMode']").forEach((input) => input.onchange = () => {
    bookingState.serviceMode = input.value;
    renderBookingWizard(form);
  });
  form.querySelectorAll("[data-booking-service]").forEach((button) => button.onclick = () => {
    bookingState.serviceId = button.dataset.bookingService;
    renderBookingWizard(form);
  });
  form.querySelectorAll("[data-booking-date]").forEach((button) => button.onclick = () => {
    bookingState.selectedDate = button.dataset.bookingDate;
    renderBookingWizard(form);
  });
  form.querySelectorAll("[data-booking-time]").forEach((button) => button.onclick = () => {
    bookingState.selectedTime = button.dataset.bookingTime;
    renderBookingWizard(form);
  });
  form.querySelectorAll("[data-payment-method]").forEach((button) => button.onclick = () => {
    bookingState.paymentMethod = button.dataset.paymentMethod;
    bookingState.paymentGateway = bookingState.paymentMethod === "credit" ? "midtrans" : bookingState.paymentMethod === "digital" ? "ovo" : "bank-transfer";
    renderBookingWizard(form);
  });
  form.querySelectorAll("[data-payment-gateway]").forEach((button) => button.onclick = () => {
    bookingState.paymentGateway = button.dataset.paymentGateway;
    renderBookingWizard(form);
  });
}

function capturePersonalInfo(form) {
  ["name", "email", "phone", "notes"].forEach((name) => {
    const field = form.elements[name];
    if (field) bookingState[name] = field.value;
  });
}

function calendarTemplate() {
  const days = [26,27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  return `<div class="calendar-head"><button type="button">‹</button><strong>May 2026</strong><button type="button">›</button></div><div class="calendar-days">${["Su","Mo","Tu","We","Th","Fr","Sa"].map((day) => `<span>${day}</span>`).join("")}${days.map((day, index) => {
    const date = `2026-05-${String(day).padStart(2, "0")}`;
    const inMonth = index > 4 && index < 35;
    return `<button type="button" class="${bookingState.selectedDate === date ? "selected" : ""} ${inMonth ? "" : "muted"}" data-booking-date="${date}">${day}</button>`;
  }).join("")}</div>`;
}

function cartTemplate(selectedService, transport, total) {
  return `<aside class="booking-summary static"><div><span>Service price</span><strong>${formatIDR(selectedService.price)}</strong></div>${bookingState.serviceMode === "mobile" ? `<div><span>Transport fee</span><strong>${formatIDR(transport)}</strong></div>` : ""}<div><span>Total estimate</span><strong>${formatIDR(total)}</strong></div></aside>`;
}

function modeLabel() {
  return bookingState.serviceMode === "mobile" ? "On-Demand / Mobile Service" : "In-Studio Experience";
}

function gatewayLabel(value) {
  return ({ midtrans: "Midtrans", ovo: "OVO", dana: "DANA", qris: "QRIS", "bank-transfer": "Bank Transfer" })[value] || value;
}

function handleMeModalClick(event) {
  const modeButton = event.target.closest("[data-auth-mode]");
  if (!modeButton) return;
  const form = modeButton.closest("[data-me-form]");
  form.querySelectorAll("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button === modeButton));
  form.dataset.mode = modeButton.dataset.authMode;
}

function showDashboardPreview(form) {
  const role = form.elements.role.value;
  const labels = {
    client: "Client Dashboard",
    artist: "Artist Dashboard",
    admin: "Admin Dashboard"
  };
  const preview = form.querySelector("[data-dashboard-preview]");
  preview.classList.remove("hidden");
  preview.innerHTML = `<strong>${labels[role]}</strong><p>Login success placeholder. This role will be redirected to the ${labels[role]} when backend authentication is connected.</p>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
