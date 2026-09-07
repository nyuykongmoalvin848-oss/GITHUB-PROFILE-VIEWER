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
