// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQs_Cu6bIuZk1AXd5CzWz-c4VkOcwn5WQ",
  authDomain: "notifications-fbe00.firebaseapp.com",
  projectId: "notifications-fbe00",
  storageBucket: "notifications-fbe00.firebasestorage.app",
  messagingSenderId: "659594251104",
  appId: "1:659594251104:web:573b8561b682925158ac05",
  measurementId: "G-RG2B8N173S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Banner elements
const banner = document.getElementById("notification-banner");
const text = document.getElementById("notification-text");
const dismissBtn = document.getElementById("dismiss-btn");

dismissBtn.addEventListener("click", () => {
  banner.style.display = "none";
});

// Listen for notifications in Firestore
const notificationsQuery = query(
  collection(db, "notifications"), // your collection name
  orderBy("timestamp", "desc")     // newest first
);

onSnapshot(notificationsQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const data = change.doc.data();
      // Show notification banner
      text.textContent = `${data.title}: ${data.message}`;
      banner.style.display = "block";

      // Optional: auto-hide after 8 seconds
      setTimeout(() => {
        banner.style.display = "none";
      }, 8000);
    }
  });
});
