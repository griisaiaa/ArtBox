// Импортируем необходимые функции из Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ВАША КОНФИГУРАЦИЯ FIREBASE (из Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyCLIvnrmLoEhyW_cLAhpcEm3CThcheKB8I",
    authDomain: "artbox-ea446.firebaseapp.com",
    projectId: "artbox-ea446",
    storageBucket: "artbox-ea446.firebasestorage.app",
    messagingSenderId: "528277485751",
    appId: "1:528277485751:web:fb59ed77d47076b9c83532"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Экспортируем все необходимые функции и объекты
export { 
    db, 
    auth,
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy,
    getDoc,
    setDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
};