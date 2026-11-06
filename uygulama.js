"use strict";
const $ = (id) => document.getElementById(id);
const sayi = (x, b = 0) => x.toLocaleString("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
const milyon = (x) => `${sayi(x / 1e6, 1)} milyon`;
const GRUP = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80-84", "85+"];
const ALT = GRUP.map((g) => parseInt(g, 10)), GEN = GRUP.map((_, i) => (i === 17 ? 15 : 5));
const SON = 2025;
let V, YILLAR, dogum = null, oynuyor = null;

function bilinen(y) { return GRUP.map((g) => V[y][g]); }
function toplam(y) { return bilinen(y).reduce((a, b) => a + b[0], 0); }

// a yaşından büyük olanların oranı (grup içinde eşit dağılım)
function yasliOran(y, a) {
  const b = bilinen(y), T = toplam(y);
  let ust = 0;
  for (let i = 0; i < 18; i++) {
    const lo = ALT[i], hi = lo + GEN[i];
    if (a < lo) ust += b[i][0];
    else if (a < hi) ust += (b[i][0] * (hi - a - 0.5)) / GEN[i];
  }
  return ust / T;
}
function ortanca(y) {
  const b = bilinen(y), T = toplam(y);
  let k = 0;
  for (let i = 0; i < 18; i++) {
    if (k + b[i][0] >= T / 2) return ALT[i] + ((T / 2 - k) / b[i][0]) * GEN[i];
    k += b[i][0];
  }
}
function grupNo(a) { for (let i = 17; i >= 0; i--) if (a >= ALT[i]) return i; return -1; }

function piramit(y) {
  const b = bilinen(y), T = toplam(y);
  const G = 820, satir = 22, ust = 6, H = ust + satir * 18 + 24, orta = G / 2, bos = 34;
  const enb = 0.075; // %7,5 sabit ölçek: yıllar karşılaştırılabilsin
  const w = (x) => (x / T / enb) * (orta - bos - 10);
  const senGrup = dogum !== null && y >= dogum ? grupNo(y - dogum) : -1;
  let s = `<svg viewBox="0 0 ${G} ${H}" role="img" aria-label="${y} nüfus piramidi">`;
  for (let i = 0; i < 18; i++) {
    const yy = ust + (17 - i) * satir, sen = i === senGrup;
    const e = w(b[i][1]), k = w(b[i][2]);
    s += `<rect x="${orta - bos - e}" y="${yy}" width="${e}" height="${satir - 4}" rx="2" fill="${sen ? "var(--sen)" : "var(--erkek)"}"/>`;
    s += `<rect x="${orta + bos}" y="${yy}" width="${k}" height="${satir - 4}" rx="2" fill="${sen ? "var(--sen)" : "var(--kadin)"}"/>`;
    s += `<text x="${orta}" y="${yy + 13}" text-anchor="middle">${GRUP[i]}</text>`;
    if (sen) s += `<text class="sen-yazi" x="${orta + bos + k + 8}" y="${yy + 13}">sen (${y - dogum} yaş)</text>`;
  }
  s += `<text x="${orta - bos}" y="${H - 6}" text-anchor="end">erkek</text><text x="${orta + bos}" y="${H - 6}">kadın</text>`;
  $("piramit").setAttribute("viewBox", `0 0 ${G} ${H}`);
  $("piramit").innerHTML = s.replace(/^<svg[^>]*>/, "");
  $("pYil").textContent = y;
  let alt = `${y}: ${milyon(T)} kişi, ortanca yaş ${sayi(ortanca(y), 1)}.`;
  if (dogum !== null && y < dogum) alt += " Sen henüz doğmamıştın.";
  $("pAlt").textContent = alt + " Sol erkek, sağ kadın; her çubuk 5 yaşlık grup, nüfusun yüzdesi olarak.";
}

function ortancaGrafik() {
  const G = 820, H = 200, sol = 34, sag = 20, ust = 16, alt = 24;
  const o = YILLAR.map((y) => ({ y: Number(y), m: ortanca(y) }));
  const X = (y) => sol + ((y - 1935) / (SON - 1935)) * (G - sol - sag);
  const Y = (m) => ust + (1 - (m - 15) / (40 - 15)) * (H - ust - alt);
  let s = `<svg viewBox="0 0 ${G} ${H}" role="img" aria-label="Ortanca yaş">`;
  for (const m of [20, 25, 30, 35]) s += `<line x1="${sol}" x2="${G - sag}" y1="${Y(m)}" y2="${Y(m)}" stroke="var(--cizgi)"/><text x="${sol - 6}" y="${Y(m) + 4}" text-anchor="end">${m}</text>`;
  for (let y = 1940; y <= 2020; y += 20) s += `<text x="${X(y)}" y="${H - 6}" text-anchor="middle">${y}</text>`;
  s += `<path d="${o.map((p, i) => `${i ? "L" : "M"}${X(p.y)},${Y(p.m)}`).join("")}" fill="none" stroke="var(--vurgu)" stroke-width="2.5"/>`;
  o.forEach((p) => (s += `<circle cx="${X(p.y)}" cy="${Y(p.m)}" r="3" fill="var(--vurgu)"><title>${p.y}: ${sayi(p.m, 1)}</title></circle>`));
  const enDusuk = o.reduce((a, b) => (b.m < a.m ? b : a));
  $("oAlt").textContent = `Nüfusun yarısı bu yaştan genç. En düşük ${enDusuk.y}'te ${sayi(enDusuk.m, 1)}; ${SON}'te ${sayi(o[o.length - 1].m, 1)}.`;
  $("ortanca").innerHTML = s + "</svg>";
}

function ozet() {
  if (dogum === null) {
    const m = ortanca(String(SON));
    $("ozet").innerHTML = `<p class="cumle">${SON}'te Türkiye'de ${milyon(toplam(String(SON)))} kişi yaşıyor ve yarısı <b>${sayi(m, 1)}</b> yaşından genç. Doğum yılını yaz, kaçının senden yaşlı olduğunu gör.</p>`;
    return;
  }
  const a = SON - dogum, T = toplam(String(SON)), o = yasliOran(String(SON), a);
  let c = `<p class="buyuk">%${sayi(100 * o)}<small>senden yaşlı</small></p><p class="cumle">${SON}'te ${a} yaşındasın. Türkiye'deki ${milyon(T)} kişiden yaklaşık <b>${milyon(o * T)}</b> senden yaşlı, <b>${milyon((1 - o) * T)}</b> senden genç.`;
  const dy = YILLAR.map(Number).filter((y) => y <= dogum).pop();
  if (dy !== undefined && dogum - dy <= 5) {
    c += ` Doğduğun yıla en yakın veride (${dy}) Türkiye ${milyon(toplam(String(dy)))} kişiydi ve ortanca yaş ${sayi(ortanca(String(dy)), 1)} idi.`;
  }
  $("ozet").innerHTML = c + "</p>";
}

function yilGoster(i) { $("kaydir").value = i; piramit(YILLAR[i]); }

async function baslat() {
  V = await (await fetch("veri/yas.json")).json();
  YILLAR = Object.keys(V).sort();
  $("kaydir").max = YILLAR.length - 1;
  $("kaydir").oninput = (e) => { durdur(); yilGoster(Number(e.target.value)); };
  const p = Number(new URLSearchParams(location.search).get("yil"));
  if (p >= 1930 && p <= SON) { dogum = p; $("yil").value = p; }
  else { dogum = 2000; $("yil").value = 2000; $("form").insertAdjacentHTML("afterend", '<p class="alt" id="ornekNot">Örnek olarak 2000 doğumlu gösteriliyor. Kendi yılını yaz.</p>'); }
  ozet(); ortancaGrafik(); yilGoster(YILLAR.length - 1);
  $("form").onsubmit = (e) => {
    e.preventDefault();
    const y = Number($("yil").value); if (!(y >= 1930 && y <= SON)) return;
    dogum = y; history.replaceState(null, "", `?yil=${y}`); $("ornekNot")?.remove();
    ozet(); oynat(YILLAR.findIndex((x) => Number(x) >= y - 0) || 0);
  };
  $("oynat").onclick = () => (oynuyor ? durdur() : oynat(0));
}
function durdur() { clearInterval(oynuyor); oynuyor = null; $("oynat").textContent = "Oynat"; }
function oynat(bas) {
  durdur();
  let i = Math.max(0, bas);
  $("oynat").textContent = "Durdur";
  yilGoster(i);
  oynuyor = setInterval(() => { i++; if (i >= YILLAR.length) return durdur(); yilGoster(i); }, 450);
}
baslat();
