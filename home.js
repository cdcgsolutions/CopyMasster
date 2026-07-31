// home.js

import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// --- STATE & DATA ---
let appData = {
    theme: 'dark', // Tema local
    categories: [],
    notes: []
};

let currentUser = null;
let currentCategoryId = null;
let currentCatPage = 1;
let currentNotePage = 1;
const pageSize = 9;

// --- DOM ELEMENTS ---
const themeToggle = document.getElementById('theme-toggle');
const dashboardView = document.getElementById('dashboard-view');
const categoryView = document.getElementById('category-view');
const viewApunte = document.getElementById('view-apunte');
const categoriesGrid = document.getElementById('categories-grid');
const notesGrid = document.getElementById('notes-grid');
const categoriesPagination = document.getElementById('categories-pagination');
const notesPagination = document.getElementById('notes-pagination');
const currentCategoryTitle = document.getElementById('current-category-title');

const btnBackDashboard = document.getElementById('btn-back-dashboard');
const btnOpenCategoryModal = document.getElementById('btn-open-category-modal');
const btnOpenNoteModal = document.getElementById('btn-open-note-modal');
const btnLogout = document.getElementById('btn-logout');
const searchCategoryInput = document.getElementById('search-category-input');
const searchNoteInput = document.getElementById('search-note-input');

// --- INITIALIZATION ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Redirigir a login si no hay sesión
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Actualizar Header con datos de Google
    const profileImg = document.getElementById('user-profile-img');
    const profileName = document.getElementById('user-profile-name');
    const profileEmail = document.getElementById('user-profile-email');
    
    if (profileImg && profileName && profileEmail) {
        if (user.photoURL) {
            profileImg.src = user.photoURL;
            profileImg.style.display = 'block';
        }
        profileName.textContent = user.displayName || 'Usuario de CopyMaster';
        profileEmail.textContent = user.email || '';
    }

    // Si es la primera vez que carga, inicia la app
    if(appData.categories.length === 0 && appData.notes.length === 0) {
        await initApp();
    }
});

async function initApp() {
    // 1. Cargar Modales HTML separados dinámicamente
    await loadModals();

    // 2. Cargar datos de Firestore
    await loadDataFromFirestore();

    // 3. Aplicar Tema (Por ahora guardado en localStorage o por defecto dark)
    const savedTheme = localStorage.getItem('copymaster_theme');
    if (savedTheme) {
        appData.theme = savedTheme;
    }
    applyTheme(appData.theme);

    // 4. Renderizar Vistas
    renderDashboard();
    setupEventListeners();
}

async function loadDataFromFirestore() {
    try {
        categoriesGrid.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> <span>Cargando tus apuntes desde la nube...</span></div>';
        
        appData.categories = [];
        appData.notes = [];

        // Fetch Categorías
        const qCat = query(collection(db, "categories"), where("userId", "==", currentUser.uid));
        const catSnap = await getDocs(qCat);
        catSnap.forEach((docSnap) => {
            appData.categories.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Fetch Notas
        const qNotes = query(collection(db, "notes"), where("userId", "==", currentUser.uid));
        const noteSnap = await getDocs(qNotes);
        noteSnap.forEach((docSnap) => {
            appData.notes.push({ id: docSnap.id, ...docSnap.data() });
        });
    } catch (e) {
        console.error("Error cargando datos de Firestore", e);
        if(window.showToast) window.showToast("Error conectando a la base de datos", true);
    }
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
        console.error("Error cargando los modales.", e);
        showToast("Error de CORS: Usa Live Server para cargar los modales.", true);
    }
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
    localStorage.setItem('copymaster_theme', appData.theme); // Tema se mantiene local
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
    currentCatPage = 1;
    if (searchCategoryInput) searchCategoryInput.value = '';
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

    currentNotePage = 1;
    if (searchNoteInput) searchNoteInput.value = '';
    renderNotes();
}

window.showCategory = showCategory;
window.getCurrentCategoryId = () => currentCategoryId;
window.getCategoryData = (id) => appData.categories.find(c => c.id === id);

// --- LÓGICA DE PAGinACIÓN ESTILO MUDBLAZOR ---
function renderMudPagination(container, totalItems, currentPage, pageSize, onPageChange) {
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) {
        return; // No requerida si todo cabe en la primera página
    }

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'mud-pagination';

    // Botón Primera Página (<<)
    const btnFirst = document.createElement('button');
    btnFirst.className = 'mud-page-btn';
    btnFirst.innerHTML = '<i class="fa-solid fa-angles-left"></i>';
    btnFirst.title = 'Primera página';
    btnFirst.disabled = currentPage === 1;
    btnFirst.onclick = () => onPageChange(1);
    paginationDiv.appendChild(btnFirst);

    // Botón Anterior (<)
    const btnPrev = document.createElement('button');
    btnPrev.className = 'mud-page-btn';
    btnPrev.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
    btnPrev.title = 'Página anterior';
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => onPageChange(currentPage - 1);
    paginationDiv.appendChild(btnPrev);

    // Números de página (máximo 5 botones)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btnPage = document.createElement('button');
        btnPage.className = `mud-page-btn ${i === currentPage ? 'active' : ''}`;
        btnPage.textContent = i;
        btnPage.onclick = () => {
            if (i !== currentPage) onPageChange(i);
        };
        paginationDiv.appendChild(btnPage);
    }

    // Botón Siguiente (>)
    const btnNext = document.createElement('button');
    btnNext.className = 'mud-page-btn';
    btnNext.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
    btnNext.title = 'Página siguiente';
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => onPageChange(currentPage + 1);
    paginationDiv.appendChild(btnNext);

    // Botón Última Página (>>)
    const btnLast = document.createElement('button');
    btnLast.className = 'mud-page-btn';
    btnLast.innerHTML = '<i class="fa-solid fa-angles-right"></i>';
    btnLast.title = 'Última página';
    btnLast.disabled = currentPage === totalPages;
    btnLast.onclick = () => onPageChange(totalPages);
    paginationDiv.appendChild(btnLast);

    container.appendChild(paginationDiv);

    // Info descriptiva
    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(totalItems, currentPage * pageSize);
    const infoDiv = document.createElement('div');
    infoDiv.className = 'mud-pagination-info';
    infoDiv.textContent = `Mostrando ${startIdx} - ${endIdx} de ${totalItems} registros (Pág. ${currentPage} de ${totalPages})`;
    container.appendChild(infoDiv);
}

// --- RENDERING ---
function renderDashboard(filterText = '', resetPage = false) {
    if (resetPage) currentCatPage = 1;
    categoriesGrid.innerHTML = '';
    if (categoriesPagination) categoriesPagination.innerHTML = '';

    const filteredCats = appData.categories.filter(cat => 
        cat.title.toLowerCase().includes(filterText.toLowerCase().trim())
    );

    if (filteredCats.length === 0 && appData.categories.length > 0) {
        categoriesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No se encontraron categorías con ese título.</p>';
        return;
    }

    // Calcular Paginación
    const totalItems = filteredCats.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentCatPage > totalPages) currentCatPage = totalPages;

    const startIdx = (currentCatPage - 1) * pageSize;
    const paginatedCats = filteredCats.slice(startIdx, startIdx + pageSize);

    paginatedCats.forEach(cat => {
        const count = appData.notes.filter(n => n.categoryId === cat.id).length;
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
            if (e.target.closest('.options-cat-btn')) {
                e.stopPropagation();
                const dropdown = card.querySelector('.card-dropdown');
                const isVisible = dropdown.style.display === 'block';
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

                const hasNotes = appData.notes.some(n => n.categoryId === cat.id);
                if (hasNotes) {
                    if (window.showToast) window.showToast('No se puede eliminar una categoría que contiene apuntes', true);
                    return;
                }

                if (window.openDeleteModal) {
                    window.openDeleteModal(
                        'Eliminar Categoría',
                        '¿Estás seguro de eliminar esta categoría?',
                        async () => {
                            if (window.deleteCategoryFromApp) await window.deleteCategoryFromApp(cat.id);
                        }
                    );
                }
                return;
            }

            showCategory(cat.id);
        });
        categoriesGrid.appendChild(card);
    });

    if (categoriesPagination) {
        renderMudPagination(categoriesPagination, totalItems, currentCatPage, pageSize, (newPage) => {
            currentCatPage = newPage;
            renderDashboard(searchCategoryInput ? searchCategoryInput.value : '');
            dashboardView.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

function renderNotes(filterText = '', resetPage = false) {
    if (resetPage) currentNotePage = 1;
    notesGrid.innerHTML = '';
    if (notesPagination) notesPagination.innerHTML = '';

    const catNotes = appData.notes.filter(n => 
        n.categoryId === currentCategoryId && 
        ((n.title && n.title.toLowerCase().includes(filterText.toLowerCase().trim())) || filterText.trim() === '')
    );

    if (catNotes.length === 0) {
        if (filterText.trim() !== '') {
            notesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No se encontraron apuntes con ese título.</p>';
        } else {
            notesGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No hay apuntes aquí. ¡Crea uno nuevo!</p>';
        }
        return;
    }

    const sortedNotes = catNotes.sort((a, b) => b.date - a.date);
    const totalItems = sortedNotes.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentNotePage > totalPages) currentNotePage = totalPages;

    const startIdx = (currentNotePage - 1) * pageSize;
    const paginatedNotes = sortedNotes.slice(startIdx, startIdx + pageSize);

    paginatedNotes.forEach(note => {
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
            if (window.showVerApunte) window.showVerApunte(note);
        });
        notesGrid.appendChild(card);
    });

    if (notesPagination) {
        renderMudPagination(notesPagination, totalItems, currentNotePage, pageSize, (newPage) => {
            currentNotePage = newPage;
            renderNotes(searchNoteInput ? searchNoteInput.value : '');
            categoryView.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

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

// --- FIREBASE CRUD API PARA LOS MODALES SEPARADOS ---

window.isGlobalLoading = false;

window.showGlobalSpinner = function(message = 'Guardando cambios...', iconClass = 'fa-solid fa-cloud-arrow-up') {
    window.isGlobalLoading = true;
    const overlay = document.getElementById('global-spinner-overlay');
    const textEl = document.getElementById('global-spinner-text');
    const iconEl = document.getElementById('global-spinner-icon');
    if (textEl) textEl.textContent = message;
    if (iconEl) iconEl.className = iconClass;
    if (overlay) overlay.classList.add('active');
};

window.hideGlobalSpinner = function() {
    window.isGlobalLoading = false;
    const overlay = document.getElementById('global-spinner-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.saveCategoryToApp = async function (catData) {
    try {
        if (window.showGlobalSpinner) {
            window.showGlobalSpinner(catData.id ? 'Actualizando categoría...' : 'Creando categoría...', 'fa-solid fa-folder-open');
        }
        if (catData.id) {
            // Update
            const catRef = doc(db, "categories", catData.id);
            await updateDoc(catRef, {
                title: catData.title,
                icon: catData.icon
            });
            const index = appData.categories.findIndex(c => c.id === catData.id);
            if (index > -1) {
                appData.categories[index].title = catData.title;
                appData.categories[index].icon = catData.icon;
            }
            showToast('Categoría actualizada');
        } else {
            // Create
            const newCat = {
                title: catData.title,
                icon: catData.icon,
                userId: currentUser.uid,
                createdAt: Date.now()
            };
            const docRef = await addDoc(collection(db, "categories"), newCat);
            newCat.id = docRef.id;
            appData.categories.push(newCat);
            showToast('Categoría creada');
        }

        renderDashboard();

        if (currentCategoryId === (catData.id || appData.categories[appData.categories.length-1].id)) {
            currentCategoryTitle.textContent = catData.title;
        }
        return true;
    } catch (error) {
        console.error("Error guardando categoría:", error);
        showToast("Error guardando categoría", true);
        return false;
    } finally {
        if (window.hideGlobalSpinner) window.hideGlobalSpinner();
    }
};

window.deleteCategoryFromApp = async function (catId) {
    try {
        if (window.showGlobalSpinner) window.showGlobalSpinner('Eliminando categoría...', 'fa-solid fa-trash-can');
        await deleteDoc(doc(db, "categories", catId));
        
        appData.categories = appData.categories.filter(c => c.id !== catId);
        appData.notes = appData.notes.filter(n => n.categoryId !== catId);
        
        renderDashboard();
        showDashboard();
        showToast('Categoría eliminada');
        return true;
    } catch (error) {
        console.error("Error eliminando categoría:", error);
        showToast("Error eliminando categoría", true);
        return false;
    } finally {
        if (window.hideGlobalSpinner) window.hideGlobalSpinner();
    }
};

window.saveNoteToApp = async function (noteData) {
    try {
        if (window.showGlobalSpinner) {
            window.showGlobalSpinner(noteData.id ? 'Actualizando apunte...' : 'Guardando apunte...', 'fa-solid fa-file-pen');
        }
        if (noteData.id) {
            // Actualizar
            const noteRef = doc(db, "notes", noteData.id);
            await updateDoc(noteRef, {
                title: noteData.title,
                content: noteData.content,
                date: Date.now()
            });
            const index = appData.notes.findIndex(n => n.id === noteData.id);
            if (index > -1) {
                appData.notes[index].title = noteData.title;
                appData.notes[index].content = noteData.content;
                appData.notes[index].date = Date.now();
            }
            showToast('Apunte actualizado');
        } else {
            // Crear
            const newNote = {
                categoryId: currentCategoryId,
                userId: currentUser.uid,
                title: noteData.title,
                content: noteData.content,
                date: Date.now()
            };
            const docRef = await addDoc(collection(db, "notes"), newNote);
            newNote.id = docRef.id;
            appData.notes.push(newNote);
            showToast('¡Apunte guardado!');
        }
        renderNotes();
        renderDashboard();
        return true;
    } catch (error) {
        console.error("Error guardando apunte:", error);
        showToast("Error guardando apunte", true);
        return false;
    } finally {
        if (window.hideGlobalSpinner) window.hideGlobalSpinner();
    }
};

window.deleteNoteFromApp = async function (noteId) {
    try {
        if (window.showGlobalSpinner) window.showGlobalSpinner('Eliminando apunte...', 'fa-solid fa-trash-can');
        await deleteDoc(doc(db, "notes", noteId));
        appData.notes = appData.notes.filter(n => n.id !== noteId);
        renderNotes();
        renderDashboard();
        showToast('Apunte eliminado');
        return true;
    } catch (error) {
        console.error("Error eliminando apunte:", error);
        showToast("Error eliminando apunte", true);
        return false;
    } finally {
        if (window.hideGlobalSpinner) window.hideGlobalSpinner();
    }
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

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // La redirección ocurrirá automáticamente por onAuthStateChanged
            } catch (error) {
                console.error("Error al cerrar sesión", error);
            }
        });
    }

    if (searchCategoryInput) {
        searchCategoryInput.addEventListener('input', (e) => {
            renderDashboard(e.target.value, true);
        });
    }
    if (searchNoteInput) {
        searchNoteInput.addEventListener('input', (e) => {
            renderNotes(e.target.value, true);
        });
    }
}
