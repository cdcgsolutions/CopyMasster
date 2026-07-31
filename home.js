// home.js

// --- STATE & DATA ---
const STORAGE_KEY = 'copymaster_data';
let appData = {
    theme: 'dark',
    categories: [
        { id: 'cat-1', title: 'Tokens', icon: 'fa-key' },
        { id: 'cat-2', title: 'Scripts JS', icon: 'fa-code' },
        { id: 'cat-3', title: 'Comandos SQL', icon: 'fa-database' },
        { id: 'cat-4', title: 'Snippets CSS', icon: 'fa-css3-alt' }
    ],
    notes: []
};

let currentCategoryId = null;

// --- DOM ELEMENTS ---
const themeToggle = document.getElementById('theme-toggle');
const dashboardView = document.getElementById('dashboard-view');
const categoryView = document.getElementById('category-view');
const viewApunte = document.getElementById('view-apunte');
const categoriesGrid = document.getElementById('categories-grid');
const notesGrid = document.getElementById('notes-grid');
const currentCategoryTitle = document.getElementById('current-category-title');

const btnBackDashboard = document.getElementById('btn-back-dashboard');
const btnOpenCategoryModal = document.getElementById('btn-open-category-modal');
const btnOpenNoteModal = document.getElementById('btn-open-note-modal');

// --- INITIALIZATION ---
async function initApp() {
    // 1. Cargar datos de localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        appData = JSON.parse(savedData);
    }
    
    // 2. Aplicar Tema
    applyTheme(appData.theme);
    
    // 3. Cargar Modales HTML separados dinámicamente
    await loadModals();

    // 4. Renderizar Vistas
    renderDashboard();
    setupEventListeners();
}

async function loadModals() {
    try {
        // Fetch Modal Categorias
        const catRes = await fetch('ModalCreacionEdicionCategorias.html');
        if (catRes.ok) {
            const catHtml = await catRes.text();
            document.getElementById('modal-container-categorias').innerHTML = catHtml;
            // Inicializar el JS de este modal
            if (window.initCategoryModal) window.initCategoryModal();
        } else {
            console.warn("No se pudo cargar ModalCreacionEdicionCategorias.html. Recuerda usar un servidor local (Live Server).");
        }

        // Fetch Modal Apuntes
        const noteRes = await fetch('ModalCrearVerApuntes.html');
        if (noteRes.ok) {
            const noteHtml = await noteRes.text();
            document.getElementById('modal-container-apuntes').innerHTML = noteHtml;
            if (window.initNoteModal) window.initNoteModal();
        } else {
            console.warn("No se pudo cargar ModalCrearVerApuntes.html");
        }

        // Fetch VerContenidoApunte View
        const verApunteRes = await fetch('VerContenidoApunte.html');
        if (verApunteRes.ok) {
            const verApunteHtml = await verApunteRes.text();
            viewApunte.innerHTML = verApunteHtml;
            if (window.initVerApunteView) window.initVerApunteView();
        } else {
            console.warn("No se pudo cargar VerContenidoApunte.html");
        }
    } catch (e) {
        console.error("Error cargando los modales. Asegúrate de ejecutar esto en un servidor (ej. Live Server en VSCode) y no abriendo el archivo directamente con doble clic.", e);
        showToast("Error de CORS: Usa Live Server para cargar los modales.", true);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// --- THEME MANAGEMENT ---
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    appData.theme = appData.theme === 'light' ? 'dark' : 'light';
    applyTheme(appData.theme);
    saveData();
});

// --- NAVIGATION ---
function showDashboard() {
    categoryView.style.display = 'none';
    if(viewApunte) viewApunte.style.display = 'none';
    dashboardView.style.display = 'block';
    
    dashboardView.classList.remove('fade-in');
    void dashboardView.offsetWidth; 
    dashboardView.classList.add('fade-in');
    
    currentCategoryId = null;
    renderDashboard();
}

function showCategory(categoryId) {
    currentCategoryId = categoryId;
    const cat = appData.categories.find(c => c.id === categoryId);
    currentCategoryTitle.textContent = cat.title;
    
    dashboardView.style.display = 'none';
    if(viewApunte) viewApunte.style.display = 'none';
    categoryView.style.display = 'block';
    
    categoryView.classList.remove('fade-in');
    void categoryView.offsetWidth;
    categoryView.classList.add('fade-in');
    
    renderNotes();
}

window.showCategory = showCategory; // Exponer al window para llamarlo desde VerContenidoApunte.js
window.getCurrentCategoryId = () => currentCategoryId;

// --- RENDERING ---
function renderDashboard() {
    categoriesGrid.innerHTML = '';
    appData.categories.forEach(cat => {
        const count = appData.notes.filter(n => n.categoryId === cat.id).length;
        
        const card = document.createElement('div');
        card.className = 'glass-card category-card';
        card.innerHTML = `
            <i class="fa-solid ${cat.icon} category-icon"></i>
            <div class="category-title">${cat.title}</div>
            <div class="category-count">${count} apunte(s)</div>
        `;
        card.addEventListener('click', () => showCategory(cat.id));
        categoriesGrid.appendChild(card);
    });
}

function renderNotes() {
    notesGrid.innerHTML = '';
    const catNotes = appData.notes.filter(n => n.categoryId === currentCategoryId);
    
    if (catNotes.length === 0) {
        notesGrid.innerHTML = '<p style="color: var(--text-secondary);">No hay apuntes aquí. ¡Crea uno nuevo!</p>';
        return;
    }
    
    catNotes.sort((a,b) => b.date - a.date).forEach(note => {
        const card = document.createElement('div');
        card.className = 'glass-card note-card';
        
        const date = new Date(note.date).toLocaleDateString();
        
        const escapeHtml = (unsafe) => {
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;");
        };
        
        card.innerHTML = `
            <div class="note-title">${note.title || 'Sin título'}</div>
            <div class="note-preview">${escapeHtml(note.content)}</div>
            <div class="note-date"><i class="fa-regular fa-clock"></i> ${date}</div>
        `;
        card.addEventListener('click', () => {
            // En vez de abrir el modal, abrimos la nueva interfaz
            if(window.showVerApunte) window.showVerApunte(note);
        });
        notesGrid.appendChild(card);
    });
}

// Nueva función de navegación hacia Ver Apunte
window.showVerApunte = function(note) {
    dashboardView.style.display = 'none';
    categoryView.style.display = 'none';
    viewApunte.style.display = 'block';
    
    viewApunte.classList.remove('fade-in');
    void viewApunte.offsetWidth;
    viewApunte.classList.add('fade-in');

    if (window.openVerApunteView) {
        window.openVerApunteView(note);
    }
};

// --- API PARA LOS MODALES SEPARADOS ---

// Función llamada por ModalCreacionEdicionCategorias.js
window.addCategoryToApp = function(newCat) {
    appData.categories.push(newCat);
    saveData();
    renderDashboard();
    showToast('Categoría creada');
};

// Función llamada por ModalCrearVerApuntes.js
window.saveNoteToApp = function(noteData) {
    if (noteData.id) {
        // Actualizar
        const index = appData.notes.findIndex(n => n.id === noteData.id);
        if (index > -1) {
            appData.notes[index].title = noteData.title;
            appData.notes[index].content = noteData.content;
            appData.notes[index].date = Date.now();
        }
    } else {
        // Crear
        appData.notes.push({
            id: 'note-' + Date.now(),
            categoryId: currentCategoryId,
            title: noteData.title,
            content: noteData.content,
            date: Date.now()
        });
    }
    saveData();
    renderNotes();
    renderDashboard();
    showToast('¡Apunte guardado!');
};

// Función llamada por ModalCrearVerApuntes.js
window.deleteNoteFromApp = function(noteId) {
    appData.notes = appData.notes.filter(n => n.id !== noteId);
    saveData();
    renderNotes();
    renderDashboard();
    showToast('Apunte eliminado');
};

// --- UTILS & EVENT LISTENERS ---
window.showToast = function(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if(isError) toast.style.backgroundColor = 'var(--danger-color)';
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

function setupEventListeners() {
    btnBackDashboard.addEventListener('click', showDashboard);
    
    btnOpenCategoryModal.addEventListener('click', () => {
        if(window.openCategoryModal) window.openCategoryModal();
    });

    btnOpenNoteModal.addEventListener('click', () => {
        if(window.openNoteModal) window.openNoteModal(null);
    });
}

// Iniciar aplicación
initApp();
