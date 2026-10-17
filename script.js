"use strict";

/* ===== Einstellungen ===== */
const CONFIG = {
  discordInvite: "6zyr6N59D7",
  twitchChannel: "vallqe",
  // Für das neueste YouTube-Video: Kanal-ID eintragen (beginnt mit "UC").
  // Zu finden unter youtube.com/account_advanced (Kanal-ID) oder in der Seitenquelle des Kanals.
  youtubeChannelId: ""
};

const $ = id => document.getElementById(id);
const root = document.documentElement;
let toastTimer;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Link kopiert ✓");
  } catch {
    const field = Object.assign(document.createElement("textarea"), { value: text });
    field.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    showToast(ok ? "Link kopiert ✓" : "Kopieren nicht möglich. Bitte Link manuell kopieren.");
  }
}

const pageUrl = () => location.href.split("#")[0];
$("copyBtn").addEventListener("click", () => copyText(pageUrl()));
$("shareBtn").addEventListener("click", async () => {
  const data = { title: "Size", text: "Alle Links von Size", url: pageUrl() };
  if (!navigator.share) return copyText(data.url);
  try { await navigator.share(data); }
  catch (err) { if (err.name !== "AbortError") showToast("Teilen gerade nicht möglich."); }
});

/* ===== Hell/Dunkel ===== */
const systemDark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches);
function renderTheme() {
  $("themeIcon").textContent = isDark() ? "☀" : "☾";
  document.querySelector('meta[name="theme-color"]').content = isDark() ? "#2a2563" : "#a99cf0";
}
$("themeBtn").addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  renderTheme();
});
systemDark.addEventListener("change", renderTheme);
renderTheme();

/* ===== Discord: Server-Infos über die öffentliche Einladung ===== */
async function loadDiscord() {
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${CONFIG.discordInvite}?with_counts=true`);
    if (!res.ok) throw new Error(res.status);
    const { guild, approximate_member_count: members, approximate_presence_count: online } = await res.json();
    $("dName").textContent = guild.name;
    $("dCount").textContent = `${online.toLocaleString("de-DE")} online · ${members.toLocaleString("de-DE")} Mitglieder`;
    if (guild.icon) {
      $("dIcon").src = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`;
      $("dIcon").hidden = false;
    }
    $("dServer").hidden = false;
  } catch { /* Karte bleibt ohne Server-Infos */ }
}

/* ===== Twitch: Live-Status ===== */
async function loadTwitch() {
  const ch = CONFIG.twitchChannel;
  let live = false;
  try {
    const res = await fetch(`https://decapi.me/twitch/uptime/${ch}`, { cache: "no-store" });
    const text = (await res.text()).trim();
    live = res.ok && text !== "" && !/offline|not found|error|does not exist/i.test(text);
    if (live) {
      $("liveThumb").src = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${ch}-640x360.jpg?t=${Date.now()}`;
      const title = await fetch(`https://decapi.me/twitch/title/${ch}`).then(r => r.text()).catch(() => "");
      if (title && !/error|not found/i.test(title)) $("liveTitle").textContent = title;
    }
  } catch { live = false; }
  $("live").hidden = !live;
  $("offline").hidden = live;
}

/* ===== YouTube: neuestes Video (Uploads-Playlist der Kanal-ID) ===== */
function loadYouTube() {
  const id = CONFIG.youtubeChannelId.trim();
  if (!/^UC[\w-]{22}$/.test(id)) return;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/videoseries?list=UU${id.slice(2)}`;
  iframe.title = "Neuestes YouTube-Video";
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  $("ytVideo").appendChild(iframe);
  $("ytVideo").hidden = false;
  $("ytFallback").hidden = true;
}

loadDiscord();
loadTwitch();
setInterval(loadTwitch, 60000);
loadYouTube();
