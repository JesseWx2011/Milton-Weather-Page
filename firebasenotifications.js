// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQs_Cu6bIuZk1AXd5CzWz-c4VkOcwn5WQ",
  authDomain: "notifications-fbe00.firebaseapp.com",
  projectId: "notifications-fbe00",
  storageBucket: "notifications-fbe00.firebasestorage.app",
  messagingSenderId: "659594251104",
  appId: "1:659594251104:web:573b8561b682925158ac05",
  measurementId: "G-RG2B8N173S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Banner elements
const banner = document.getElementById("notification-banner");
const text = document.getElementById("notification-text");
const dismissBtn = document.getElementById("dismiss-btn");

// Dismiss button
dismissBtn.addEventListener("click", () => {
  banner.remove();
});

// Firestore query
const notificationsQuery = query(
  collection(db, "notifications"),
  orderBy("timestamp", "desc")
);

const THREE_HOURS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

onSnapshot(notificationsQuery, (snapshot) => {
  const now = Date.now(); // current time

  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const data = change.doc.data();

      // Check timestamp (skip old notifications)
      if (data.timestamp) {
        const notificationTime = data.timestamp.toMillis
          ? data.timestamp.toMillis() // Firestore Timestamp
          : new Date(data.timestamp).getTime(); // plain Date
        if (now - notificationTime > THREE_HOURS) {
          return; // skip old notifications
        }
      }

      // Show notification
      const title = data.title || "No title";
      const description = data.description || "No description";
      text.textContent = `${title}: ${description}`;

      banner.className = "";
      banner.classList.add("visible");

      // Determine type dynamically
      let typeClass = "regular";
      const lowerTitle = title.toLowerCase();
      const lowerDesc = description.toLowerCase();
      if (lowerTitle.includes("tornado") || lowerDesc.includes("tornado")) typeClass = "tornado";
      else if (lowerTitle.includes("evacuate") || lowerDesc.includes("evacuate")) typeClass = "evacuate";
      else if (lowerTitle.includes("power") || lowerDesc.includes("power")) typeClass = "power-out";
      else if (lowerTitle.includes("severe") || lowerDesc.includes("severe")) typeClass = "severe";
      else if (lowerTitle.includes("rainbow") || lowerDesc.includes("rainbow")) typeClass = "rainbow";

      banner.classList.add(typeClass);
const timestampEl = document.getElementById("notification-timestamp");

// Inside your onSnapshot logic, after setting text:
let notifTime;
if (data.timestamp.toMillis) {
  // Firestore Timestamp
  notifTime = new Date(data.timestamp.toMillis());
} else {
  notifTime = new Date(data.timestamp); // fallback
}

const localTime = notifTime.toLocaleTimeString('en-US', { hour12: true, timeZoneName: 'short' });
const utcTime = notifTime.toUTCString().split(' ')[4]; // just hh:mm:ss UTC

timestampEl.textContent = `Last Updated: ${localTime} (${utcTime} UTC)`;

    }
  });
});
 
