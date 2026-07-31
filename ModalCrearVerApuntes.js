// ModalCrearVerApuntes.js

window.initNoteModal = function() {
    const modal = document.getElementById('modal-note');
    const modalTitle = document.getElementById('note-modal-title');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    
    const btnClose = document.getElementById('btn-close-note-modal');
    const btnSave = document.getElementById('btn-save-note');
    const btnDelete = document.getElementById('btn-delete-note');
    const btnCopy = document.getElementById('btn-copy-note');

    let currentEditingNoteId = null;

    // Funciones públicas
    window.openNoteModal = function(note = null) {
        if (note) {
            // Modo Edición
            currentEditingNoteId = note.id;
            modalTitle.textContent = 'Editar Apunte';
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            btnDelete.style.display = 'block';
            btnCopy.style.display = 'block';
        } else {
            // Modo Creación
            currentEditingNoteId = null;
            modalTitle.textContent = 'Nuevo Apunte';
            noteTitleInput.value = '';
            noteContentInput.value = '';
            btnDelete.style.display = 'none';
            btnCopy.style.display = 'none';
        }
        modal.classList.add('active');
    };

    window.closeNoteModal = function(force = false) {
        if (window.isGlobalLoading && force !== true) return;
        modal.classList.remove('active');
        currentEditingNoteId = null;
    };

    // Eventos
    btnClose.addEventListener('click', window.closeNoteModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeNoteModal();
        }
    });

    btnSave.addEventListener('click', async () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        
        if (!content) {
            if(window.showToast) window.showToast('El contenido no puede estar vacío');
            return;
        }
        
        const noteData = {
            id: currentEditingNoteId,
            title: title || 'Sin título',
            content: content
        };

        if(window.saveNoteToApp) {
            const originalHtml = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
            
            const success = await window.saveNoteToApp(noteData);
            
            btnSave.disabled = false;
            btnSave.innerHTML = originalHtml;
            if (success === false) return;
        }
        
        window.closeNoteModal(true);
    });

    btnDelete.addEventListener('click', () => {
        if (window.openDeleteModal) {
            window.openDeleteModal(
                'Eliminar Apunte',
                '¿Estás seguro de eliminar este apunte? Esta acción no se puede deshacer.',
                async () => {
                    if (window.deleteNoteFromApp && currentEditingNoteId) {
                        const success = await window.deleteNoteFromApp(currentEditingNoteId);
                        if (success === false) return;
                    }
                    window.closeNoteModal(true);
                }
            );
        } else {
            if (confirm('¿Estás seguro de eliminar este apunte?')) {
                if (window.deleteNoteFromApp && currentEditingNoteId) {
                    window.deleteNoteFromApp(currentEditingNoteId);
                }
                window.closeNoteModal(true);
            }
        }
    });

    btnCopy.addEventListener('click', () => {
        const content = noteContentInput.value;
        navigator.clipboard.writeText(content).then(() => {
            if(window.showToast) window.showToast('¡Copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar', err);
            if(window.showToast) window.showToast('Error al copiar');
        });
    });
};
