// VerContenidoApunte.js

window.initVerApunteView = function() {
    const inputTitle = document.getElementById('ver-apunte-title-input');
    const inputContent = document.getElementById('ver-apunte-content-input');
    
    const btnBack = document.getElementById('btn-back-category');
    const btnCopy = document.getElementById('btn-copy-ver-apunte');
    const btnDelete = document.getElementById('btn-delete-ver-apunte');
    const btnSave = document.getElementById('btn-save-ver-apunte');

    let currentApunteId = null;

    window.openVerApunteView = function(note) {
        currentApunteId = note.id;
        inputTitle.value = note.title;
        inputContent.value = note.content;
        // Ajustar altura inicial basada en el contenido
        setTimeout(autoResize, 50);
    };

    // Función para auto-redimensionar el textarea y evitar el scroll doble
    function autoResize() {
        inputContent.style.height = 'auto';
        inputContent.style.height = (inputContent.scrollHeight) + 'px';
    }
    inputContent.addEventListener('input', autoResize);

    btnBack.addEventListener('click', () => {
        if(window.showCategory && window.getCurrentCategoryId) {
            // Regresar a la categoría actual
            window.showCategory(window.getCurrentCategoryId());
        }
    });

    btnCopy.addEventListener('click', () => {
        const content = inputContent.value;
        navigator.clipboard.writeText(content).then(() => {
            if(window.showToast) window.showToast('¡Copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar', err);
            if(window.showToast) window.showToast('Error al copiar');
        });
    });

    btnDelete.addEventListener('click', () => {
        if (window.openDeleteModal) {
            window.openDeleteModal(
                'Eliminar Apunte',
                '¿Estás seguro de eliminar este apunte? Esta acción no se puede deshacer.',
                () => {
                    if(window.deleteNoteFromApp) {
                        window.deleteNoteFromApp(currentApunteId);
                    }
                    if(window.showCategory && window.getCurrentCategoryId) {
                        window.showCategory(window.getCurrentCategoryId());
                    }
                }
            );
        } else {
            if(confirm('¿Estás seguro de eliminar este apunte?')) {
                if(window.deleteNoteFromApp) {
                    window.deleteNoteFromApp(currentApunteId);
                }
                if(window.showCategory && window.getCurrentCategoryId) {
                    window.showCategory(window.getCurrentCategoryId());
                }
            }
        }
    });

    btnSave.addEventListener('click', () => {
        const title = inputTitle.value.trim();
        const content = inputContent.value.trim();
        
        if (!content) {
            if(window.showToast) window.showToast('El contenido no puede estar vacío');
            return;
        }
        
        const noteData = {
            id: currentApunteId,
            title: title || 'Sin título',
            content: content
        };

        if(window.saveNoteToApp) {
            window.saveNoteToApp(noteData);
        }
        
        if(window.showToast) window.showToast('Apunte actualizado');
    });
};
