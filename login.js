import { auth, provider } from './firebase.js';
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

const btnLoginGoogle = document.getElementById('btn-login-google');

// Escuchar cambios en la autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si ya hay un usuario logueado, lo mandamos directo al home
        window.location.href = 'home.html';
    }
});

// Evento de clic en el botón de Google
btnLoginGoogle.addEventListener('click', async () => {
    try {
        btnLoginGoogle.disabled = true;
        btnLoginGoogle.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Conectando...</span>';
        
        const result = await signInWithPopup(auth, provider);
        // Si es exitoso, onAuthStateChanged se disparará y redirigirá a home.html
        
    } catch (error) {
        console.error("Error en la autenticación:", error);
        alert("Hubo un error al iniciar sesión con Google. Revisa la consola.");
        
        // Restaurar botón
        btnLoginGoogle.disabled = false;
        btnLoginGoogle.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" class="google-logo"> <span>Continuar con Google</span>';
    }
});
