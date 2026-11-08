import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const ready = Object.values(firebaseConfig).every(v => typeof v === "string" && v && !v.startsWith("PASTE_") && !v.includes("YOUR_")) && !ADMIN_EMAIL.includes("YOUR_");
const $ = id => document.getElementById(id);
if (!ready) {
  $("loginError").textContent = "Firebase is not configured yet. Follow SETUP.md first.";
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  $("loginButton").addEventListener("click", async () => {
    $("loginError").textContent = "";
    try { await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value); }
    catch (e) { $("loginError").textContent = "Sign-in failed. Check your email, password and Firebase setup."; }
  });
  $("logoutButton").addEventListener("click", () => signOut(auth));
  $("refreshButton").addEventListener("click", loadDashboard);

  onAuthStateChanged(auth, user => {
    const isAdmin = user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    $("loginPanel").hidden = !!isAdmin;
    $("dashboardPanel").hidden = !isAdmin;
    if (isAdmin) { $("signedInAs").textContent = `Signed in as ${user.email}`; loadDashboard(); }
    else if (user) { signOut(auth); $("loginError").textContent = "This account is not the configured admin."; }
  });

  async function loadDashboard() {
    $("dashboardError").textContent = "";
    try {
      const [viewsSnap, sessionsSnap] = await Promise.all([
        getDocs(query(collection(db, "page_views"), orderBy("createdAt", "desc"), limit(1000))),
        getDocs(query(collection(db, "visitor_sessions"), orderBy("createdAt", "desc"), limit(500)))
      ]);
      const views = viewsSnap.docs.map(d => d.data());
      const sessions = sessionsSnap.docs.map(d => d.data());
      $("totalVisits").textContent = views.length;
      $("uniqueVisitors").textContent = new Set(views.map(v => v.visitorId).filter(Boolean)).size;
      $("namedSessions").textContent = sessions.length;
      $("completed").textContent = sessions.filter(s => s.completed).length;
      $("visitorRows").innerHTML = "";
      if (!sessions.length) {
        $("visitorRows").innerHTML = '<tr><td colspan="4">No named sessions yet.</td></tr>';
      } else {
        sessions.forEach(s => {
          const tr = document.createElement("tr");
          const name = document.createElement("td"); name.textContent = s.name || "Name not provided";
          const date = document.createElement("td");
          date.textContent = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : "—";
          const progress = document.createElement("td"); progress.textContent = `${s.diyaCount || 0}/5`;
          const status = document.createElement("td"); status.textContent = s.completed ? "Completed" : "In progress";
          [name,date,progress,status].forEach(td => tr.appendChild(td));
          $("visitorRows").appendChild(tr);
        });
      }
    } catch (e) {
      $("dashboardError").textContent = "Could not load data. Check Firestore rules and indexes in SETUP.md.";
    }
  }
}
