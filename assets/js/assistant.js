const assistantState = {
  marketplace: null,
  isOpen: false,
  messages: [
    {
      role: "assistant",
      text: "Hi, I am Devs. I can help you find tattoo artists in Bali, explain tattoo styles, booking service, price estimates, studio locations, payments, and aftercare."
    }
  ],
  drag: {
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  }
};

const $ = (selector) => document.querySelector(selector);
const formatIDR = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);

document.addEventListener("DOMContentLoaded", async () => {
  injectAssistantWidget();
  setupAssistantEvents();
  try {
    assistantState.marketplace = await fetchMarketplace();
  } catch (error) {
    assistantState.messages.push({
      role: "assistant",
      text: "The internal database could not be loaded right now, but Devs can still help explain the booking flow and general marketplace information."
    });
  }
  renderMessages();
});

async function fetchMarketplace() {
  const response = await fetch("data/marketplace.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load marketplace data");
  return response.json();
}

function injectAssistantWidget() {
  if ($("[data-ai-widget]")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <section class="ai-chat-widget" data-ai-widget aria-label="Devs AI assistant">
      <div class="ai-chat-window" data-ai-window aria-hidden="true">
        <header class="ai-chat-header" data-ai-drag>
          <div>
            <span class="assistant-orb">D</span>
            <div>
              <strong>Devs</strong>
              <small>BALI INK HUB assistant</small>
            </div>
          </div>
          <button type="button" data-ai-close aria-label="Close assistant">&times;</button>
        </header>
        <div class="chat-messages" data-chat-messages></div>
        <form class="chat-form" data-chat-form>
          <input name="message" autocomplete="off" placeholder="Ask Devs..." required />
          <button class="gold-btn" type="submit">Send</button>
        </form>
      </div>
      <div class="ai-launcher-wrap" data-ai-drag>
        <button class="ai-close-mini" type="button" data-ai-hide aria-label="Hide assistant">&times;</button>
        <span class="ai-here-text" aria-hidden="true">
          <span>W</span><span>e</span><span>A</span><span>r</span><span>e</span><span>H</span><span>e</span><span>r</span><span>e</span><span>!</span>
        </span>
        <button class="ai-launcher" type="button" data-ai-toggle aria-label="Open Devs assistant">
          <span></span>
        </button>
      </div>
    </section>
  `);
}

function setupAssistantEvents() {
  document.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-chat-form]")) return;
    event.preventDefault();
    const input = event.target.elements.message;
    sendMessage(input.value);
    input.value = "";
  });

  document.addEventListener("click", (event) => {
    if (assistantState.drag.moved) {
      event.preventDefault();
      event.stopPropagation();
      assistantState.drag.moved = false;
      return;
    }

    if (event.target.closest("[data-ai-toggle], [data-open-assistant]")) {
      openAssistant();
      return;
    }

    if (event.target.closest("[data-ai-close]")) {
      closeAssistant();
      return;
    }

    if (event.target.closest("[data-ai-hide]")) {
      hideAssistant();
      return;
    }

  }, true);

  document.addEventListener("pointerdown", startDrag);
  document.addEventListener("pointermove", dragWidget);
  document.addEventListener("pointerup", stopDrag);
  window.addEventListener("resize", keepWidgetInViewport);
}

function openAssistant() {
  const widget = $("[data-ai-widget]");
  const windowEl = $("[data-ai-window]");
  if (!widget || !windowEl) return;
  assistantState.isOpen = true;
  widget.classList.remove("is-hidden");
  widget.classList.remove("is-compact");
  widget.classList.add("is-open");
  windowEl.setAttribute("aria-hidden", "false");
  window.setTimeout(() => $("[data-chat-form] input")?.focus(), 120);
}

function closeAssistant() {
  const widget = $("[data-ai-widget]");
  const windowEl = $("[data-ai-window]");
  if (!widget || !windowEl) return;
  assistantState.isOpen = false;
  widget.classList.remove("is-open");
  windowEl.setAttribute("aria-hidden", "true");
}

function hideAssistant() {
  const widget = $("[data-ai-widget]");
  if (!widget) return;
  closeAssistant();
  widget.classList.add("is-compact");
}

function startDrag(event) {
  const handle = event.target.closest("[data-ai-drag]");
  const widget = $("[data-ai-widget]");
  if (!handle || !widget || event.button !== 0) return;
  const rect = widget.getBoundingClientRect();
  assistantState.drag = {
    active: true,
    moved: false,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  widget.classList.add("is-dragging");
  event.target.setPointerCapture?.(event.pointerId);
}

function dragWidget(event) {
  if (!assistantState.drag.active) return;
  const widget = $("[data-ai-widget]");
  if (!widget) return;
  const distanceX = Math.abs(event.clientX - assistantState.drag.startX);
  const distanceY = Math.abs(event.clientY - assistantState.drag.startY);
  if (!assistantState.drag.moved && distanceX < 8 && distanceY < 8) return;
  assistantState.drag.moved = true;
  const width = widget.offsetWidth;
  const height = widget.offsetHeight;
  const nextLeft = clamp(event.clientX - assistantState.drag.offsetX, 10, window.innerWidth - width - 10);
  const nextTop = clamp(event.clientY - assistantState.drag.offsetY, 10, window.innerHeight - height - 10);
  widget.style.left = `${nextLeft}px`;
  widget.style.top = `${nextTop}px`;
  widget.style.right = "auto";
  widget.style.bottom = "auto";
}

function stopDrag(event) {
  if (!assistantState.drag.active) return;
  const widget = $("[data-ai-widget]");
  const wasMoved = assistantState.drag.moved;
  assistantState.drag.active = false;
  widget?.classList.remove("is-dragging");
  event.target.releasePointerCapture?.(event.pointerId);
  keepWidgetInViewport();
  if (!wasMoved && event.target.closest("[data-ai-toggle]")) {
    openAssistant();
  }
}

function keepWidgetInViewport() {
  const widget = $("[data-ai-widget]");
  if (!widget || !widget.style.left) return;
  const rect = widget.getBoundingClientRect();
  const left = clamp(rect.left, 10, window.innerWidth - rect.width - 10);
  const top = clamp(rect.top, 10, window.innerHeight - rect.height - 10);
  widget.style.left = `${left}px`;
  widget.style.top = `${top}px`;
}

function sendMessage(text) {
  const clean = sanitize(text);
  if (!clean) return;
  assistantState.messages.push({ role: "user", text: clean });
  renderMessages();

  window.setTimeout(() => {
    assistantState.messages.push({ role: "assistant", text: answer(clean) });
    renderMessages();
  }, 320);
}

function answer(input) {
  const data = assistantState.marketplace;
  const text = input.toLowerCase();

  if (!data) {
    return "I can guide the general flow first: choose an artist, click Booking Service, enter your location, choose In-Studio or On-Demand, select a service, schedule a date and time, fill personal information, review cart, choose payment, then confirm.";
  }

  if (matches(text, ["canggu", "ubud", "seminyak", "denpasar", "sanur", "singaraja", "karangasem", "amed", "kuta", "uluwatu"])) {
    return areaAnswer(text, data);
  }

  if (matches(text, ["price", "harga", "biaya", "cost", "berapa"])) {
    return priceAnswer(text, data);
  }

  if (matches(text, ["artist", "artis", "studio", "recommend", "rekomendasi"])) {
    return artistAnswer(data);
  }

  if (matches(text, ["style", "kategori", "category", "blackwork", "realism", "fine line", "japanese", "balinese"])) {
    return styleAnswer(text, data);
  }

  if (matches(text, ["booking", "book", "mobile", "on-demand", "in-studio", "transport"])) {
    return "BALI INK HUB supports two service modes: In-Studio Experience for visiting the artist's studio, and On-Demand / Mobile Service for appointments at the client's location. When mobile service is selected, the system adds a transport fee based on the client's area.";
  }

  if (matches(text, ["aftercare", "healing", "sembuh", "rawat", "perawatan"])) {
    return "General aftercare: keep the tattoo clean, do not scratch it, and avoid direct sun, pools, ocean water, and saunas during the early healing phase. Apply a thin layer of aftercare balm according to the artist's instructions.";
  }

  if (matches(text, ["payment", "bayar", "midtrans", "ovo", "dana", "qris", "credit"])) {
    return "The payment flow is prepared for Credit Card via Midtrans, Digital Wallet options such as OVO/DANA/QRIS, and other options such as bank transfer. Real payments will require an active backend and payment gateway integration.";
  }

  const query = encodeURIComponent(`${input} tattoo Bali`);
  return generalAnswer(input, query, data);
}

function areaAnswer(text, data) {
  const area = data.areas.find((item) => text.includes(item.toLowerCase()));
  const artists = data.artists.filter((artist) => !area || artist.area === area);
  if (!artists.length) return `There are no dummy artists for ${area} yet. Try another Bali area such as Canggu, Ubud, Seminyak, Denpasar, or Sanur.`;
  return `For ${area || "Bali"}, I found ${artists.length} relevant artists: ${artists.slice(0, 4).map((artist) => `${artist.name} (${artist.style}, ${artist.rating.toFixed(1)})`).join(", ")}. You can open the studio profile from the Artists section.`;
}

function priceAnswer(text, data) {
  const services = data.services.filter((service) => `${service.title} ${service.style} ${service.area}`.toLowerCase().includes(text));
  const sample = services.length ? services : data.services;
  const cheapest = sample.reduce((min, service) => service.price < min.price ? service : min, sample[0]);
  const highest = sample.reduce((max, service) => service.price > max.price ? service : max, sample[0]);
  return `Service price estimates start from ${formatIDR(cheapest.price)} for ${cheapest.title}, up to ${formatIDR(highest.price)} for ${highest.title}. Final pricing depends on size, detail, placement, and service mode.`;
}

function artistAnswer(data) {
  return `Initial recommendations: ${data.artists.slice(0, 5).map((artist) => `${artist.name} in ${artist.area} for ${artist.style}`).join("; ")}. Mention a specific area or style and I can narrow the options.`;
}

function styleAnswer(text, data) {
  const styles = data.styles.filter((style) => text.includes(style.toLowerCase().split(" ")[0])).slice(0, 5);
  const fallback = data.styles.slice(0, 8);
  return `BALI INK HUB has many categories/styles, including ${(styles.length ? styles : fallback).join(", ")}. Choose a style from the category section to discover matching services.`;
}

function generalAnswer(input, query, data) {
  const lower = input.toLowerCase();
  const foundArtist = data.artists.find((artist) => lower.includes(artist.name.toLowerCase()) || lower.includes(artist.studio.toLowerCase()));
  if (foundArtist) {
    return `${foundArtist.studio} is managed by ${foundArtist.name} in ${foundArtist.area}, Bali. Main style: ${foundArtist.style}, rating ${foundArtist.rating.toFixed(1)}, with ${foundArtist.experience}+ years of experience. Open the studio page from the artist card to view portfolio, services, maps, and booking service.`;
  }

  const foundService = data.services.find((service) => lower.includes(service.title.toLowerCase()) || lower.includes(service.style.toLowerCase()));
  if (foundService) {
    return `${foundService.title} is available as a ${foundService.style} service in ${foundService.area}. Estimated price starts from ${formatIDR(foundService.price)} with a ${foundService.rating.toFixed(1)} rating. Final pricing is usually affected by size, detail, placement, and In-Studio or On-Demand mode.`;
  }

  return `I am Devs, the BALI INK HUB assistant. I do not have a specific local database answer for that yet, but I can guide you: use search for area/style, open an artist studio for portfolio and maps, then continue to Booking Service for schedule and payment. Temporary external reference: https://www.google.com/search?q=${query}`;
}

function renderMessages() {
  const box = $("[data-chat-messages]");
  if (!box) return;
  box.innerHTML = assistantState.messages.map((message) => `
    <article class="chat-message ${message.role}">
      <div>${linkify(escapeHTML(message.text))}</div>
    </article>
  `).join("");
  box.scrollTop = box.scrollHeight;
}

function matches(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function sanitize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function linkify(value) {
  return value.replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
