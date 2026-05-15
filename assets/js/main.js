const state = {
  marketplace: null,
  artistFilter: "recommended",
  showAllCategories: false,
  bookingStep: 1,
  booking: {
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
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
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
  const { areas, styles } = state.marketplace;

  areaSelect.innerHTML += areas.map((area) => `<option value="${escapeHTML(area)}">${escapeHTML(area)}</option>`).join("");
  styleSelect.innerHTML += styles.map((style) => `<option value="${escapeHTML(style)}">${escapeHTML(style)}</option>`).join("");
  state.booking.clientLocation = areas[0];
  state.booking.serviceId = state.marketplace.services[0].id;
  renderBookingWizard($("[data-booking-form]"), state.marketplace.services);
}

function renderCategories() {
  const categories = state.showAllCategories ? state.marketplace.categories : state.marketplace.categories.slice(0, 10);
  $("[data-category-grid]").innerHTML = categories
    .map(
      (category) => `
        <article class="category-card" data-quick-search="${escapeHTML(category.name)}">
          <div>
            <h3>${escapeHTML(category.name)}</h3>
            <p>${category.count} Artists</p>
          </div>
        </article>`
    )
    .join("");
  const toggle = $("[data-toggle-categories]");
  if (toggle) toggle.textContent = state.showAllCategories ? "Show less" : "View all";
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
              <button class="gold-btn" type="button" data-open-booking>Booking Service</button>
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

    if (event.target.closest("[data-toggle-categories]")) {
      state.showAllCategories = !state.showAllCategories;
      renderCategories();
    }

    if (event.target.closest("[data-open-booking]")) openModal("booking");
    if (event.target.closest("[data-open-login]")) openModal("login");
  });

  $("[data-booking-form]").addEventListener("submit", () => {
    showToast("Booking service submitted in the marketplace flow.");
  });
}

function openModal(name) {
  const modal = document.querySelector(`[data-modal="${name}"]`);
  if (modal?.showModal) {
    if (name === "booking") renderBookingWizard($("[data-booking-form]"), state.marketplace.services);
    modal.showModal();
  }
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => toast.classList.remove("show"), 3000);
}

function bookingTotals(services) {
  const selectedService = services.find((service) => service.id === state.booking.serviceId) || services[0];
  const location = state.booking.clientLocation || state.marketplace.areas[0];
  const mode = state.booking.serviceMode;
  const transport = mode === "mobile" ? transportFees[location] || 0 : 0;
  return { selectedService, transport, total: selectedService.price + transport };
}

const bookingSteps = ["Location", "Service Mode", "Service", "Date & Time", "Personal Information", "Cart", "Payment", "Confirmation"];

function renderBookingWizard(form, services) {
  if (!form) return;
  const { selectedService, transport, total } = bookingTotals(services);
  form.querySelector("[data-booking-mini]").innerHTML = `
    <img src="${selectedService.image}" alt="${escapeHTML(selectedService.title)}">
    <div><strong>${escapeHTML(selectedService.title)}</strong><span>${selectedService.rating.toFixed(1)} (${selectedService.reviews} reviews)</span></div>`;
  form.querySelector("[data-booking-steps]").innerHTML = bookingSteps.map((step, index) => {
    const number = index + 1;
    const status = number < state.bookingStep ? "done" : number === state.bookingStep ? "active" : "";
    return `<li class="${status}"><span>${number < state.bookingStep ? "✓" : number}</span>${number}. ${step}</li>`;
  }).join("");
  form.querySelector("[data-booking-title]").textContent = bookingSteps[state.bookingStep - 1];
  form.querySelector("[data-booking-body]").innerHTML = bookingStepTemplate(state.bookingStep, services, selectedService, transport, total);
  form.querySelector("[data-booking-prev]").disabled = state.bookingStep === 1;
  form.querySelector("[data-booking-next]").classList.toggle("hidden", state.bookingStep === 8);
  form.querySelector("[data-booking-submit]").classList.toggle("hidden", state.bookingStep !== 8);
  bindBookingStepEvents(form, services);
}

function bookingStepTemplate(step, services, selectedService, transport, total) {
  if (step === 1) {
    return `<div class="wizard-section"><p>Choose where the client is located. This location is used to calculate mobile service transport cost.</p><div class="choice-grid">${state.marketplace.areas.map((area) => `<button type="button" class="${state.booking.clientLocation === area ? "selected" : ""}" data-booking-location="${escapeHTML(area)}">${escapeHTML(area)}</button>`).join("")}</div></div>`;
  }
  if (step === 2) {
    return `<div class="service-mode-grid wizard-mode"><label class="${state.booking.serviceMode === "studio" ? "selected" : ""}"><input type="radio" name="serviceMode" value="studio" ${state.booking.serviceMode === "studio" ? "checked" : ""}><strong>In-Studio Experience</strong><small>Client visits the artist studio. No transport fee after service cost.</small></label><label class="${state.booking.serviceMode === "mobile" ? "selected" : ""}"><input type="radio" name="serviceMode" value="mobile" ${state.booking.serviceMode === "mobile" ? "checked" : ""}><strong>On-Demand / Mobile Service</strong><small>Artist goes to client location. Transport fee appears in cart.</small></label></div>`;
  }
  if (step === 3) {
    return `<div class="wizard-service-grid">${services.map((service) => `<button type="button" class="${state.booking.serviceId === service.id ? "selected" : ""}" data-booking-service="${escapeHTML(service.id)}"><img src="${service.image}" alt="${escapeHTML(service.title)}"><span>${escapeHTML(service.title)}</span><strong>${formatIDR(service.price)}</strong></button>`).join("")}</div>`;
  }
  if (step === 4) {
    return `<div class="date-time-grid"><div><p>Select date</p><div class="mini-calendar">${calendarTemplate()}</div></div><div><p>Select time</p><div class="time-grid">${["09:00","10:00","11:30","13:00","14:30","16:00","18:00","20:00"].map((time) => `<button type="button" class="${state.booking.selectedTime === time ? "selected" : ""}" data-booking-time="${time}">${time}</button>`).join("")}</div></div></div>`;
  }
  if (step === 5) {
    return `<div class="personal-grid"><aside class="booking-summary static"><div><span>Selected service</span><strong>${escapeHTML(selectedService.title)}</strong></div><div><span>Client location</span><strong>${escapeHTML(state.booking.clientLocation)}</strong></div><div><span>Service mode</span><strong>${modeLabel()}</strong></div></aside><div class="booking-fields"><input name="name" value="${escapeHTML(state.booking.name)}" placeholder="Full name"><input name="email" value="${escapeHTML(state.booking.email)}" placeholder="Email address"><input name="phone" value="${escapeHTML(state.booking.phone)}" placeholder="Phone number"><textarea name="notes" placeholder="Tattoo idea, placement, size, and reference notes">${escapeHTML(state.booking.notes)}</textarea></div></div>`;
  }
  if (step === 6) return cartTemplate(selectedService, transport, total);
  if (step === 7) {
    const gateway = state.booking.paymentMethod === "credit" ? ["midtrans"] : state.booking.paymentMethod === "digital" ? ["ovo", "dana", "qris"] : ["bank-transfer"];
    return `<div class="payment-grid"><div><h3>Payment method</h3>${[["credit","Credit Card"],["digital","Digital Wallet"],["other","Other Payment"]].map(([value,label]) => `<button type="button" class="${state.booking.paymentMethod === value ? "selected" : ""}" data-payment-method="${value}">${label}</button>`).join("")}</div><div><h3>Payment gateway</h3>${gateway.map((value) => `<button type="button" class="${state.booking.paymentGateway === value ? "selected" : ""}" data-payment-gateway="${value}">${gatewayLabel(value)}</button>`).join("")}</div></div>${cartTemplate(selectedService, transport, total)}`;
  }
  return `<div class="confirmation-box"><h3>Booking Service Ready</h3><p>Please review your booking. After confirmation, payment continues through the selected gateway.</p>${cartTemplate(selectedService, transport, total)}<div class="booking-summary static"><div><span>Date & time</span><strong>${state.booking.selectedDate} · ${state.booking.selectedTime}</strong></div><div><span>Payment</span><strong>${gatewayLabel(state.booking.paymentGateway)}</strong></div><div><span>Client</span><strong>${escapeHTML(state.booking.name || "Client name")}</strong></div></div></div>`;
}

function bindBookingStepEvents(form, services) {
  form.querySelector("[data-booking-prev]").onclick = () => {
    state.bookingStep = Math.max(1, state.bookingStep - 1);
    renderBookingWizard(form, services);
  };
  form.querySelector("[data-booking-next]").onclick = () => {
    capturePersonalInfo(form);
    state.bookingStep = Math.min(8, state.bookingStep + 1);
    renderBookingWizard(form, services);
  };
  form.querySelectorAll("[data-booking-location]").forEach((button) => button.onclick = () => {
    state.booking.clientLocation = button.dataset.bookingLocation;
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[name='serviceMode']").forEach((input) => input.onchange = () => {
    state.booking.serviceMode = input.value;
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[data-booking-service]").forEach((button) => button.onclick = () => {
    state.booking.serviceId = button.dataset.bookingService;
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[data-booking-date]").forEach((button) => button.onclick = () => {
    state.booking.selectedDate = button.dataset.bookingDate;
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[data-booking-time]").forEach((button) => button.onclick = () => {
    state.booking.selectedTime = button.dataset.bookingTime;
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[data-payment-method]").forEach((button) => button.onclick = () => {
    state.booking.paymentMethod = button.dataset.paymentMethod;
    state.booking.paymentGateway = state.booking.paymentMethod === "credit" ? "midtrans" : state.booking.paymentMethod === "digital" ? "ovo" : "bank-transfer";
    renderBookingWizard(form, services);
  });
  form.querySelectorAll("[data-payment-gateway]").forEach((button) => button.onclick = () => {
    state.booking.paymentGateway = button.dataset.paymentGateway;
    renderBookingWizard(form, services);
  });
}

function capturePersonalInfo(form) {
  ["name", "email", "phone", "notes"].forEach((name) => {
    const field = form.elements[name];
    if (field) state.booking[name] = field.value;
  });
}

function calendarTemplate() {
  const days = [26,27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  return `<div class="calendar-head"><button type="button">‹</button><strong>May 2026</strong><button type="button">›</button></div><div class="calendar-days">${["Su","Mo","Tu","We","Th","Fr","Sa"].map((day) => `<span>${day}</span>`).join("")}${days.map((day, index) => {
    const date = `2026-05-${String(day).padStart(2, "0")}`;
    const inMonth = index > 4 && index < 35;
    return `<button type="button" class="${state.booking.selectedDate === date ? "selected" : ""} ${inMonth ? "" : "muted"}" data-booking-date="${date}">${day}</button>`;
  }).join("")}</div>`;
}

function cartTemplate(selectedService, transport, total) {
  return `<aside class="booking-summary static"><div><span>Service price</span><strong>${formatIDR(selectedService.price)}</strong></div>${state.booking.serviceMode === "mobile" ? `<div><span>Transport fee</span><strong>${formatIDR(transport)}</strong></div>` : ""}<div><span>Total estimate</span><strong>${formatIDR(total)}</strong></div></aside>`;
}

function modeLabel() {
  return state.booking.serviceMode === "mobile" ? "On-Demand / Mobile Service" : "In-Studio Experience";
}

function gatewayLabel(value) {
  return ({ midtrans: "Midtrans", ovo: "OVO", dana: "DANA", qris: "QRIS", "bank-transfer": "Bank Transfer" })[value] || value;
}


function sanitize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
