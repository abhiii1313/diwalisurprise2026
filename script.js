import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Firebase setup
const firebaseReady = Object.values(firebaseConfig).every(v =>
  typeof v === "string" &&
  v.length > 0 &&
  !v.startsWith("PASTE_") &&
  !v.includes("YOUR_")
);

let db = null;
let authReady = Promise.resolve();

if (firebaseReady) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    const auth = getAuth(app);
    authReady = signInAnonymously(auth);

  } catch (error) {
    console.warn("Firebase setup needs checking:", error);
  }
}

// Basic app state
const $ = (id) => document.getElementById(id);

const screens = ["welcomeScreen", "diyaScreen", "finalScreen"];

let visitorName = "";
let litCount = 0;
let sessionId = crypto.randomUUID();

let visitorId = localStorage.getItem("diwaliVisitorId");

if (!visitorId) {
  visitorId = crypto.randomUUID();
  localStorage.setItem("diwaliVisitorId", visitorId);
}

let sessionSaved = false;
let viewLogged = false;
let sessionWritePromise = Promise.resolve();

function showScreen(id) {
  screens.forEach(screenId =>
    $(screenId).classList.toggle("active", screenId === id)
  );
}

// Log page visit
async function logView() {
  if (!db || viewLogged) return;

  viewLogged = true;

  try {
    await authReady;

    await addDoc(collection(db, "page_views"), {
      visitorId,
      sessionId,
      createdAt: serverTimestamp(),
      page: "diwali-surprise-2026"
    });

  } catch (err) {
    console.warn("Visit could not be saved:", err);
  }
}

// Create visitor session
async function startSession() {
  if (!db || sessionSaved) return;

  sessionSaved = true;

  sessionWritePromise = (async () => {
    await authReady;

    await setDoc(doc(db, "visitor_sessions", sessionId), {
      visitorId,
      name: visitorName,
      diyaCount: 0,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  })();

  try {
    await sessionWritePromise;
  } catch (err) {
    sessionSaved = false;
    console.warn("Visitor session could not be saved:", err);
  }
}

// Update diya progress
async function saveSession() {
  if (!db || !sessionSaved) return;

  try {
    await authReady;
    await sessionWritePromise;

    await updateDoc(doc(db, "visitor_sessions", sessionId), {
      diyaCount: litCount,
      completed: litCount === 5,
      updatedAt: serverTimestamp()
    });

  } catch (err) {
    console.warn("Progress could not be updated:", err);
  }
}

// Start tracking
void logView();

// Visitor name form
$("nameForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("visitorName").value.trim();
  if (!name) return;

  visitorName = name.slice(0, 32);

  startMusic();
  void startSession();

  $("diyaHint").textContent =
    `A little light for you, ${visitorName}.`;

  showScreen("diyaScreen");
});

// Diya lighting system
document.querySelectorAll(".diya-card").forEach(card => {

  card.addEventListener("click", () => {

    if (card.classList.contains("lit")) return;

    card.classList.add("lit");
    card.disabled = true;

    playDiyaChime();

    litCount++;

    $("progressFill").style.width = `${litCount * 20}%`;
    $("progressText").textContent = `${litCount} / 5 LIGHTED`;

    void saveSession();

    burst(
      card.getBoundingClientRect().left + card.offsetWidth / 2,
      card.getBoundingClientRect().top + card.offsetHeight / 2,
      18
    );

    if (litCount === 5) {
      $("diyaHint").textContent =
        "All five wishes are glowing. Get ready…";

      setTimeout(showFinale, 1500);
    }
  });

});

// Final screen
function showFinale() {

  $("forName").textContent =
    `A special wish for ${visitorName}`;

  showScreen("finalScreen");

  void saveSession();

  launchGrandFinale();
}

// Replay button
$("replayButton").addEventListener("click", () => {

  litCount = 0;
  sessionSaved = false;
  sessionId = crypto.randomUUID();

  document.querySelectorAll(".diya-card").forEach(card => {
    card.classList.remove("lit");
    card.disabled = false;
  });

  $("progressFill").style.width = "0%";
  $("progressText").textContent = "0 / 5 LIGHTED";
  $("diyaHint").textContent = "Every light carries a wish.";

  showScreen("diyaScreen");

  void startSession();
});

// Fireworks and golden particles
const canvas = $("effects");
const ctx = canvas.getContext("2d");

let w = 0;
let h = 0;
let particles = [];
let rockets = [];

function resize() {

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  w = window.innerWidth;
  h = window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

function burst(x, y, amount = 36) {

  for (let i = 0; i < amount; i++) {

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 3.2;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 45 + Math.random() * 35,
      max: 80,
      size: 1 + Math.random() * 2.2,
      hue: 34 + Math.random() * 18
    });
  }
}

function launchRocket(
  x = w * (.2 + Math.random() * .6),
  targetY = h * (.15 + Math.random() * .32)
) {

  rockets.push({
    x,
    y: h + 8,
    targetY,
    vx: (Math.random() - .5) * 1.2,
    speed: 5 + Math.random() * 2,
    trail: []
  });
}

function launchGrandFinale() {

  for (let i = 0; i < 8; i++) {

    setTimeout(() => {
      launchRocket(
        w * (.12 + Math.random() * .76),
        h * (.12 + Math.random() * .38)
      );
    }, i * 260);
  }
}

let lastAuto = 0;

function animate(time = 0) {

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(13, 8, 25, 0.10)";
  ctx.fillRect(0, 0, w, h);

  if (
    time - lastAuto > 2600 &&
    $("finalScreen").classList.contains("active")
  ) {
    launchRocket();
    lastAuto = time;
  }

  for (let i = rockets.length - 1; i >= 0; i--) {

    const r = rockets[i];

    r.trail.push({ x: r.x, y: r.y });

    if (r.trail.length > 9) r.trail.shift();

    r.x += r.vx;
    r.y -= r.speed;

    ctx.beginPath();
    ctx.moveTo(r.x, r.y);

    r.trail.forEach(p => ctx.lineTo(p.x, p.y));

    ctx.strokeStyle = "rgba(255,203,112,.75)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (r.y <= r.targetY) {
      burst(r.x, r.y, 68);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {

    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vy += .035;
    p.vx *= .985;
    p.vy *= .985;

    p.life--;

    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = `hsl(${p.hue}, 95%, 70%)`;

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffc66c";

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    if (p.life <= 0) particles.splice(i, 1);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Ambient sparks
setInterval(() => {

  if (document.hidden || particles.length > 180) return;

  particles.push({
    x: Math.random() * w,
    y: h + 4,
    vx: (Math.random() - .5) * .35,
    vy: -(.5 + Math.random() * .8),
    life: 80,
    max: 80,
    size: .7 + Math.random() * 1.2,
    hue: 38
  });

}, 500);

// Original Diwali-inspired background music
let audioContext = null;
let masterGain = null;
let musicTimer = null;
let musicStep = 0;
let musicEnabled = false;

const melody = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.00, 698.46,
  523.25, 659.25, 783.99, 987.77,
  880.00, 783.99, 659.25, 587.33
];

const chordRoots = [130.81, 174.61, 146.83, 196.00];

function ensureAudio() {

  if (audioContext) return;

  const AudioCtx =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioCtx) return;

  audioContext = new AudioCtx();

  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.0001;

  masterGain.connect(audioContext.destination);

  [130.81, 164.81, 196.00].forEach((frequency, index) => {

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = index === 1 ? "triangle" : "sine";
    osc.frequency.value = frequency;

    filter.type = "lowpass";
    filter.frequency.value = 650;

    gain.gain.value = index === 0 ? 0.10 : 0.045;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start();
  });
}

function playTone(
  frequency,
  when,
  duration,
  volume,
  type = "sine"
) {

  if (!audioContext || !masterGain) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);

  filter.type = "lowpass";
  filter.frequency.value = type === "triangle" ? 1800 : 3200;

  gain.gain.setValueAtTime(0.0001, when);

  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.0002),
    when + 0.035
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    when + duration
  );

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(when);
  osc.stop(when + duration + 0.04);
}

function scheduleMusic() {

  if (!audioContext || !musicEnabled) return;

  const now = audioContext.currentTime + 0.04;
  const step = musicStep % 16;
  const note = melody[step];

  if (step % 2 === 0 || step === 7 || step === 15) {
    playTone(note, now, 0.62, 0.055, "triangle");
  }

  if (step % 4 === 0) {

    const root =
      chordRoots[Math.floor(step / 4) % chordRoots.length];

    playTone(root * 2, now, 0.42, 0.045, "triangle");
    playTone(root * 3, now + 0.07, 0.32, 0.018, "sine");
  }

  if (step === 0 || step === 8) {
    playTone(note * 2, now + 0.12, 1.15, 0.025, "sine");
  }

  musicStep++;
}

async function startMusic() {

  ensureAudio();

  if (!audioContext || musicEnabled) return;

  try {

    await audioContext.resume();

    musicEnabled = true;

    masterGain.gain.cancelScheduledValues(
      audioContext.currentTime
    );

    masterGain.gain.setTargetAtTime(
      0.20,
      audioContext.currentTime,
      1.1
    );

    musicStep = 0;

    scheduleMusic();

    musicTimer = window.setInterval(scheduleMusic, 420);

    updateMusicButton();

  } catch (error) {
    console.warn("Audio could not start:", error);
  }
}

function stopMusic() {

  if (!audioContext || !masterGain || !musicEnabled) return;

  musicEnabled = false;

  if (musicTimer) window.clearInterval(musicTimer);

  musicTimer = null;

  masterGain.gain.cancelScheduledValues(
    audioContext.currentTime
  );

  masterGain.gain.setTargetAtTime(
    0.0001,
    audioContext.currentTime,
    0.25
  );

  updateMusicButton();
}

function updateMusicButton() {

  const button = $("musicToggle");

  if (!button) return;

  button.classList.toggle("is-on", musicEnabled);

  button.setAttribute("aria-pressed", String(musicEnabled));

  button.setAttribute(
    "aria-label",
    musicEnabled
      ? "Turn background music off"
      : "Turn background music on"
  );

  $("musicLabel").textContent =
    musicEnabled ? "MUSIC ON" : "MUSIC OFF";
}

function playDiyaChime() {

  if (!audioContext || !musicEnabled) return;

  const now = audioContext.currentTime;

  playTone(1046.5, now, 0.75, 0.045, "sine");
  playTone(1568.0, now + 0.045, 0.9, 0.018, "sine");
}

$("musicToggle").addEventListener("click", () => {

  if (musicEnabled) {
    stopMusic();
  } else {
    startMusic();
  }

});
