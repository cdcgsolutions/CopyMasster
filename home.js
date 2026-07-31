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
        const [catRes, noteRes, verApunteRes, delRes] = await Promise.all([
            fetch('ModalCreacionEdicionCategorias.html'),
            fetch('ModalCrearVerApuntes.html'),
            fetch('VerContenidoApunte.html'),
            fetch('ModalEliminar.html')
        ]);

        document.getElementById('modal-category-container').innerHTML = await catRes.text();
        document.getElementById('modal-note-container').innerHTML = await noteRes.text();
        viewApunte.innerHTML = await verApunteRes.text();
        document.getElementById('modal-delete-container').innerHTML = await delRes.text();

        if (window.initCategoryModal) window.initCategoryModal();
        if (window.initNoteModal) window.initNoteModal();
        if (window.initVerApunteView) window.initVerApunteView();
        if (window.initDeleteModal) window.initDeleteModal();
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
    if (viewApunte) viewApunte.style.display = 'none';
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
    if (viewApunte) viewApunte.style.display = 'none';
    categoryView.style.display = 'block';

    categoryView.classList.remove('fade-in');
    void categoryView.offsetWidth;
    categoryView.classList.add('fade-in');

    renderNotes();
}

window.showCategory = showCategory; // Exponer al window para llamarlo desde VerContenidoApunte.js
window.getCurrentCategoryId = () => currentCategoryId;
window.getCategoryData = (id) => appData.categories.find(c => c.id === id);

// --- RENDERING ---
function renderDashboard() {
    categoriesGrid.innerHTML = '';
    appData.categories.forEach(cat => {
        const count = appData.notes.filter(n => n.categoryId === cat.id).length;

        // Soporte para iconos antiguos vs nuevos (con fa-solid o fa-brands ya incluido)
        const iconClass = cat.icon.includes(' ') ? cat.icon : `fa-solid ${cat.icon}`;

        const card = document.createElement('div');
        card.className = 'glass-card category-card';
        card.innerHTML = `
            <div class="card-options-wrapper">
                <button class="options-cat-btn" data-id="${cat.id}" title="Opciones"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <div class="card-dropdown" id="dropdown-${cat.id}" style="display: none;">
                    <div class="dropdown-item edit-option"><i class="fa-solid fa-pencil"></i> Editar</div>
                    <div class="dropdown-item delete-option text-danger"><i class="fa-solid fa-trash"></i> Eliminar</div>
                </div>
            </div>
            <i class="${iconClass} category-icon"></i>
            <div class="category-title">${cat.title}</div>
            <div class="category-count">${count} apunte(s)</div>
        `;

        card.addEventListener('click', (e) => {
            // Manejar menú de opciones
            if (e.target.closest('.options-cat-btn')) {
                e.stopPropagation();
                const dropdown = card.querySelector('.card-dropdown');
                const isVisible = dropdown.style.display === 'block';
                // Cerrar todos los demás primero
                document.querySelectorAll('.card-dropdown').forEach(d => d.style.display = 'none');
                dropdown.style.display = isVisible ? 'none' : 'block';
                return;
            }
            if (e.target.closest('.edit-option')) {
                e.stopPropagation();
                card.querySelector('.card-dropdown').style.display = 'none';
                if (window.openCategoryModal) window.openCategoryModal(cat.id);
                return;
            }
            if (e.target.closest('.delete-option')) {
                e.stopPropagation();
                card.querySelector('.card-dropdown').style.display = 'none';

                // Validación: No permitir eliminar si tiene apuntes
                const hasNotes = appData.notes.some(n => n.categoryId === cat.id);
                if (hasNotes) {
                    if (window.showToast) window.showToast('No se puede eliminar una categoría que contiene apuntes', true);
                    return;
                }

                if (window.openDeleteModal) {
                    window.openDeleteModal(
                        'Eliminar Categoría',
                        '¿Estás seguro de eliminar esta categoría?',
                        () => {
                            if (window.deleteCategoryFromApp) window.deleteCategoryFromApp(cat.id);
                        }
                    );
                }
                return;
            }

            showCategory(cat.id);
        });
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

    catNotes.sort((a, b) => b.date - a.date).forEach(note => {
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
            if (window.showVerApunte) window.showVerApunte(note);
        });
        notesGrid.appendChild(card);
    });
}

// Nueva función de navegación hacia Ver Apunte
window.showVerApunte = function (note) {
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
window.saveCategoryToApp = function (catData) {
    if (catData.id) {
        // Update
        const index = appData.categories.findIndex(c => c.id === catData.id);
        if (index > -1) {
            appData.categories[index].title = catData.title;
            appData.categories[index].icon = catData.icon;
        }
        showToast('Categoría actualizada');
    } else {
        // Create
        catData.id = 'cat-' + Date.now();
        appData.categories.push(catData);
        showToast('Categoría creada');
    }

    saveData();
    renderDashboard();

    if (currentCategoryId === catData.id) {
        currentCategoryTitle.textContent = catData.title;
    }
};

window.deleteCategoryFromApp = function (catId) {
    appData.categories = appData.categories.filter(c => c.id !== catId);
    appData.notes = appData.notes.filter(n => n.categoryId !== catId);
    saveData();
    renderDashboard();
    showDashboard();
    showToast('Categoría eliminada');
};

// Función llamada por ModalCrearVerApuntes.js
window.saveNoteToApp = function (noteData) {
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
window.deleteNoteFromApp = function (noteId) {
    appData.notes = appData.notes.filter(n => n.id !== noteId);
    saveData();
    renderNotes();
    renderDashboard();
    showToast('Apunte eliminado');
};

// --- UTILS & EVENT LISTENERS ---
window.showToast = function (message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.style.backgroundColor = 'var(--danger-color)';
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
        if (window.openCategoryModal) window.openCategoryModal(null);
    });

    btnOpenNoteModal.addEventListener('click', () => {
        if (window.openNoteModal) window.openNoteModal(null);
    });

    // Cerrar dropdowns si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-options-wrapper')) {
            document.querySelectorAll('.card-dropdown').forEach(d => d.style.display = 'none');
        }
    });
}

// Iniciar aplicación
initApp();
