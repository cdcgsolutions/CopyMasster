// ModalCreacionEdicionCategorias.js

window.initCategoryModal = function() {
    const modal = document.getElementById('modal-category');
    const btnClose = document.getElementById('btn-close-category-modal');
    const btnSave = document.getElementById('btn-save-category');
    const inputTitle = document.getElementById('category-title-input');

    // Funciones públicas expuestas al window (o a home.js)
    window.openCategoryModal = function() {
        inputTitle.value = '';
        modal.classList.add('active');
    };

    window.closeCategoryModal = function() {
        modal.classList.remove('active');
    };

    btnClose.addEventListener('click', window.closeCategoryModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeCategoryModal();
        }
    });

    btnSave.addEventListener('click', () => {
        const title = inputTitle.value.trim();
        if (title) {
            const newCat = {
                id: 'cat-' + Date.now(),
                title: title,
                icon: 'fa-folder' // Icono por defecto
            };
            
            // Accedemos a la función addCategory de home.js
            if(window.addCategoryToApp) {
                window.addCategoryToApp(newCat);
            }
            
            window.closeCategoryModal();
        } else {
            if(window.showToast) window.showToast('El nombre no puede estar vacío');
        }
    });
};
