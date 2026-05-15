const $ = (selector) => document.querySelector(selector);
const formatIDR = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);

let marketplace = null;
let messages = [];

document.addEventListener("DOMContentLoaded", async () => {
  marketplace = await fetchMarketplace();
  messages = [
    {
      role: "assistant",
      text: "Hi, saya Devs. Saya bisa bantu cari tattoo artist di Bali, jelaskan style, booking service, estimasi harga, lokasi studio, dan aftercare."
    }
  ];
  renderMessages();
  setupEvents();
});

async function fetchMarketplace() {
  const response = await fetch("data/marketplace.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load marketplace data");
  return response.json();
}

function setupEvents() {
  $("[data-chat-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    sendMessage(input.value);
    input.value = "";
  });

  document.addEventListener("click", (event) => {
    const prompt = event.target.closest("[data-prompt]");
    if (prompt) sendMessage(prompt.dataset.prompt);

    if (event.target.closest("[data-clear-chat]")) {
      messages = [{ role: "assistant", text: "Chat cleared. Mau cari artist, style, service, atau estimasi harga?" }];
      renderMessages();
    }
  });
}

function sendMessage(text) {
  const clean = sanitize(text);
  if (!clean) return;
  messages.push({ role: "user", text: clean });
  renderMessages();

  window.setTimeout(() => {
    messages.push({ role: "assistant", text: answer(clean) });
    renderMessages();
  }, 360);
}

function answer(input) {
  const text = input.toLowerCase();

  if (matches(text, ["canggu", "ubud", "seminyak", "denpasar", "sanur", "singaraja", "karangasem", "amed", "kuta", "uluwatu"])) {
    return areaAnswer(text);
  }

  if (matches(text, ["price", "harga", "biaya", "cost", "berapa"])) {
    return priceAnswer(text);
  }

  if (matches(text, ["artist", "artis", "studio", "recommend", "rekomendasi"])) {
    return artistAnswer(text);
  }

  if (matches(text, ["style", "kategori", "category", "blackwork", "realism", "fine line", "japanese", "balinese"])) {
    return styleAnswer(text);
  }

  if (matches(text, ["booking", "book", "mobile", "on-demand", "in-studio", "transport"])) {
    return "Di BALI INK HUB ada dua mode layanan: In-Studio Experience untuk datang ke studio artist, dan On-Demand / Mobile Service untuk layanan di lokasi client. Jika memilih mobile service, sistem menambahkan transport fee berdasarkan area client.";
  }

  if (matches(text, ["aftercare", "healing", "sembuh", "rawat", "perawatan"])) {
    return "Aftercare umum: jaga tattoo tetap bersih, jangan digaruk, hindari matahari langsung, kolam, laut, dan sauna selama fase awal healing. Gunakan aftercare balm tipis sesuai instruksi artist. Untuk gejala infeksi atau reaksi berat, konsultasikan ke tenaga medis.";
  }

  if (matches(text, ["payment", "bayar", "midtrans", "ovo", "dana", "qris", "credit"])) {
    return "Flow payment disiapkan untuk Credit Card via Midtrans, Digital Wallet seperti OVO/DANA/QRIS, dan opsi lain seperti bank transfer. Saat ini masih prototype frontend, jadi pembayaran asli perlu backend/payment gateway.";
  }

  const query = encodeURIComponent(`${input} tattoo Bali`);
  return `Saya belum punya data spesifik untuk itu di database internal. Untuk sementara, kamu bisa cek lewat pencarian eksternal: https://www.google.com/search?q=${query}. Nanti jika backend sudah aktif, Devs bisa diperkuat dengan Google/Search API dan data real-time.`;
}

function areaAnswer(text) {
  const area = marketplace.areas.find((item) => text.includes(item.toLowerCase()));
  const artists = marketplace.artists.filter((artist) => !area || artist.area === area);
  if (!artists.length) return `Belum ada artist dummy untuk area ${area}. Coba area lain seperti Canggu, Ubud, Seminyak, Denpasar, atau Sanur.`;
  return `Untuk ${area || "Bali"}, saya menemukan ${artists.length} artist relevan: ${artists.slice(0, 4).map((artist) => `${artist.name} (${artist.style}, ${artist.rating.toFixed(1)})`).join(", ")}. Kamu bisa buka profile studio dari section Artists.`;
}

function priceAnswer(text) {
  const services = filteredServices(text);
  const sample = services.length ? services : marketplace.services;
  const cheapest = sample.reduce((min, service) => service.price < min.price ? service : min, sample[0]);
  const highest = sample.reduce((max, service) => service.price > max.price ? service : max, sample[0]);
  return `Estimasi harga layanan di data saat ini mulai dari ${formatIDR(cheapest.price)} untuk ${cheapest.title}, sampai ${formatIDR(highest.price)} untuk ${highest.title}. Harga final tergantung ukuran, detail, placement, dan mode layanan.`;
}

function artistAnswer(text) {
  const artists = marketplace.artists.slice(0, 5);
  return `Rekomendasi awal: ${artists.map((artist) => `${artist.name} di ${artist.area} untuk ${artist.style}`).join("; ")}. Kalau kamu sebut area atau style tertentu, saya bisa persempit pilihan.`;
}

function styleAnswer(text) {
  const styles = marketplace.styles.filter((style) => text.includes(style.toLowerCase().split(" ")[0])).slice(0, 5);
  const fallback = marketplace.styles.slice(0, 8);
  return `BALI INK HUB punya banyak category/style, termasuk ${(styles.length ? styles : fallback).join(", ")}. Pilih style dari category section untuk melihat layanan yang cocok.`;
}

function filteredServices(text) {
  return marketplace.services.filter((service) => `${service.title} ${service.style} ${service.area}`.toLowerCase().includes(text));
}

function renderMessages() {
  const box = $("[data-chat-messages]");
  box.innerHTML = messages.map((message) => `
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
