import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from './firebaseConfig.js';

const checkAdmin = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
            return true;
        } else {
            return false;
        }
    }
    return false;
};

const setupUIForAdmin = async () => {
    const isAdmin = await checkAdmin();
    
    if (isAdmin) {
        document.getElementById('upload-btn').style.display = 'block';
        document.getElementById('signup-btn').style.display = 'block';
        document.getElementById('edit-btn').style.display = 'block';
        document.getElementById('delete-btn').style.display = 'block';
    } else {
        document.getElementById('upload-btn').style.display = 'none';
        document.getElementById('signup-btn').style.display = 'none';
        document.getElementById('edit-btn').style.display = 'none';
        document.getElementById('delete-btn').style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', setupUIForAdmin);
