import { auth, db } from './firebaseConfig.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const checkAdminStatus = async () => {
    const user = auth.currentUser;
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        return userData && userData.isAdmin;
    }
    return false;
};

document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminStatus();
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
});
