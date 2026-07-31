// ModalEliminar.js

window.initDeleteModal = function() {
    const modal = document.getElementById('modal-eliminar');
    const btnCancel = document.getElementById('btn-cancel-delete');
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const titleEl = document.getElementById('delete-modal-title');
    const messageEl = document.getElementById('delete-modal-message');

    let confirmCallback = null;

    // Función global para pedir confirmación antes de eliminar
    window.openDeleteModal = function(title, message, onConfirm) {
        titleEl.textContent = title || '¿Estás seguro?';
        messageEl.textContent = message || 'Esta acción no se puede deshacer.';
        confirmCallback = onConfirm;
        modal.classList.add('active');
    };

    window.closeDeleteModal = function(force = false) {
        if (window.isGlobalLoading && force !== true) return;
        modal.classList.remove('active');
        confirmCallback = null;
    };

    // Eventos
    btnCancel.addEventListener('click', window.closeDeleteModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeDeleteModal();
        }
    });

    btnConfirm.addEventListener('click', async () => {
        if (confirmCallback) {
            const originalHtml = btnConfirm.innerHTML;
            btnConfirm.disabled = true;
            btnConfirm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando...';
            
            await confirmCallback();
            
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = originalHtml;
        }
        window.closeDeleteModal(true);
    });
};
