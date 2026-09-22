const q = document.getElementById("q");
const btn = document.getElementById("btn");
const retry = document.getElementById("retry");
const load = document.getElementById("load");
const err = document.getElementById("err");
const eMsg = document.getElementById("e-msg");
const card = document.getElementById("card");
const empty = document.getElementById("empty");
const sugs = document.getElementById("sugs");

const API = "https://api.github.com";
let current = "";

function fmtDate(s) {
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

function show(el) {
  [load, err, card, empty].forEach(e => e.classList.add("hide"));
  el.classList.remove("hide");
}

async function getUser(name) {
  const r = await fetch(`${API}/users/${name}`);
  if (!r.ok) throw new Error(r.status === 404 ? "User not found" : "API error");
  return r.json();
}

async function getRepos(name) {
  const r = await fetch(`${API}/users/${name}/repos?sort=updated&per_page=6`);
  return r.ok ? r.json() : [];
}

function renderProfile(user, repos) {
  document.getElementById("pic").src = user.avatar_url;
  document.getElementById("name").textContent = user.name || user.login;
  document.getElementById("user").textContent = `@${user.login}`;
  document.getElementById("bio").textContent = user.bio || "No bio available";

  document.getElementById("repos").textContent = fmtNum(user.public_repos);
  document.getElementById("followers").textContent = fmtNum(user.followers);
  document.getElementById("following").textContent = fmtNum(user.following);
  document.getElementById("gists").textContent = fmtNum(user.public_gists);

  document.getElementById("comp").textContent = user.company || "No company";
  document.getElementById("loc").textContent = user.location || "No location";

  const web = document.getElementById("web");
  if (user.blog) {
    let url = user.blog;
    if (!url.startsWith("http")) url = "https://" + url;
    web.textContent = url;
    web.href = url;
  } else {
    web.textContent = "No website";
    web.href = "#";
  }

  const twit = document.getElementById("twit");
  if (user.twitter_username) {
    twit.textContent = `@${user.twitter_username}`;
    twit.href = `https://twitter.com/${user.twitter_username}`;
  } else {
    twit.textContent = "No Twitter";
    twit.href = "#";
  }

  document.getElementById("date").textContent = `Joined ${fmtDate(user.created_at)}`;
  document.getElementById("link").href = user.html_url;

  const sec = document.getElementById("repos-section");
  const list = document.getElementById("repo-list");
  if (repos.length) {
    sec.classList.remove("hide");
    list.innerHTML = repos.map(r => `
      <div class="repo">
        <div class="repo-head">
          <a href="${r.html_url}" target="_blank" class="repo-name">${r.name}</a>
          <span class="repo-vis">${r.private ? "Private" : "Public"}</span>
        </div>
        <p class="repo-desc">${r.description || "No description"}</p>
        <div class="repo-nums">
          <span class="repo-n">${r.language || "Unknown"}</span>
          <span class="repo-n">⭐ ${r.stargazers_count}</span>
          <span class="repo-n">🍴 ${r.forks_count}</span>
        </div>
      </div>
    `).join("");
  } else {
    sec.classList.add("hide");
  }

  show(card);
}

async function loadProfile(name) {
  if (!name.trim()) return show(empty);
  current = name;
  show(load);
  try {
    const [user, repos] = await Promise.all([getUser(name), getRepos(name)]);
    if (user.login.toLowerCase() !== name.toLowerCase()) {
      eMsg.textContent = "User not found";
      return show(err);
    }
    renderProfile(user, repos);
    saveHistory(name);
  } catch (e) {
    eMsg.textContent = e.message || "Error loading profile";
    show(err);
  }
}

function saveHistory(name) {
  let h = JSON.parse(localStorage.getItem("h") || "[]");
  h = h.filter(i => i.toLowerCase() !== name.toLowerCase());
  h.unshift(name);
  h = h.slice(0, 10);
  localStorage.setItem("h", JSON.stringify(h));
}

function getHistory() {
  return JSON.parse(localStorage.getItem("h") || "[]");
}

let timer;

q.addEventListener("input", e => {
  const v = e.target.value.trim();
  clearTimeout(timer);
  if (v.length < 2) return sugs.classList.remove("show");
  timer = setTimeout(async () => {
    const hist = getHistory().filter(i => i.toLowerCase().includes(v.toLowerCase()));
    if (hist.length) {
      sugs.innerHTML = hist.slice(0, 5).map(u => `
        <div class="sug" data-u="${u}">
          <span class="user">${u}</span>
          <span class="type">Recent</span>
        </div>
      `).join("");
      return sugs.classList.add("show");
    }
    try {
      const r = await fetch(`${API}/search/users?q=${encodeURIComponent(v)}&per_page=8`);
      const d = await r.json();
      if (d.items?.length) {
        sugs.innerHTML = d.items.map(u => `
          <div class="sug" data-u="${u.login}">
            <span class="user">${u.login}</span>
            <span class="type">${u.type}</span>
          </div>
        `).join("");
        sugs.classList.add("show");
      } else {
        sugs.classList.remove("show");
      }
    } catch { sugs.classList.remove("show"); }
  }, 300);
});

sugs.addEventListener("click", e => {
  const item = e.target.closest(".sug");
  if (!item) return;
  const u = item.dataset.u;
  q.value = u;
  sugs.classList.remove("show");
  loadProfile(u);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search") && !e.target.closest(".sugs")) {
    sugs.classList.remove("show");
  }
});

btn.addEventListener("click", () => loadProfile(q.value));
q.addEventListener("keypress", e => { if (e.key === "Enter") loadProfile(q.value); });
retry.addEventListener("click", () => current ? loadProfile(current) : show(empty));

window.addEventListener("online", () => {
  if (current && load.classList.contains("hide") && err.classList.contains("hide")) {
    loadProfile(current);
  }
});
