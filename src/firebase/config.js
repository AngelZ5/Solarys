import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Credenciais públicas do cliente Firebase (seguro expor no front).
 * Opcional: defina VITE_FIREBASE_* no .env para sobrescrever.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBiOuT_w99n7TKBZo2KJjmJx0Anzf28rM8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "solarys-form.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "solarys-form",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "solarys-form.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "198531340598",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:198531340598:web:9078967d454202b4457b97",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-50YGRQHCQ9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
