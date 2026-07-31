// ModalCreacionEdicionCategorias.js

window.initCategoryModal = function() {
    const modal = document.getElementById('modal-category');
    const btnClose = document.getElementById('btn-close-category-modal');
    const btnSave = document.getElementById('btn-save-category');
    const inputTitle = document.getElementById('category-title-input');
    const modalTitleElem = document.querySelector('#modal-category h3');
    
    // Elementos del icono
    const inputIcon = document.getElementById('category-icon-input');
    const iconPreview = document.getElementById('icon-preview');
    const iconDropdown = document.getElementById('icon-dropdown');

    // Lista dinámica de iconos
    let dynamicIcons = [];
    let isIconsLoaded = false;
    let isLoadingIcons = false;

    let currentSelectedIcon = 'fa-solid fa-folder';
    let currentEditingCategoryId = null;

    // Función para cargar los iconos dinámicamente desde el repositorio oficial vía CDN (jsDelivr)
    async function fetchAllIcons() {
        if (isIconsLoaded || isLoadingIcons) return;
        isLoadingIcons = true;
        
        try {
            iconDropdown.innerHTML = '<span style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando miles de iconos...</span>';
            
            // Usamos jsDelivr para consultar el metadata oficial de FontAwesome 6.4.0
            const response = await fetch('https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.4.0/metadata/icons.json');
            const data = await response.json();
            
            // Transformar el JSON en nuestra lista de clases (ej. "fa-solid fa-user")
            dynamicIcons = Object.keys(data).map(iconName => {
                const styles = data[iconName].styles;
                // FontAwesome tiene solid, regular, brands, etc. Usamos solid por defecto, o brands si es marca.
                let prefix = 'fa-solid';
                if (styles.includes('brands')) {
                    prefix = 'fa-brands';
                } else if (styles.includes('regular') && !styles.includes('solid')) {
                    prefix = 'fa-regular';
                }
                
                return `${prefix} fa-${iconName}`;
            });
            
            isIconsLoaded = true;
            isLoadingIcons = false;
            
            // Re-renderizar si el usuario ya había escrito algo
            renderIconGrid(inputIcon.value);
            
        } catch (error) {
            console.error("Error al obtener iconos de FontAwesome:", error);
            iconDropdown.innerHTML = '<span style="grid-column: 1/-1; text-align: center; color: var(--danger-color);">Error cargando catálogo. Escribe la clase manualmente.</span>';
            isLoadingIcons = false;
        }
    }

    // Funciones públicas expuestas al window
    window.openCategoryModal = function(categoryId = null) {
        currentEditingCategoryId = categoryId;
        
        if (categoryId && window.getCategoryData) {
            const cat = window.getCategoryData(categoryId);
            inputTitle.value = cat.title;
            inputIcon.value = cat.icon;
            currentSelectedIcon = cat.icon;
            modalTitleElem.textContent = 'Editar Categoría';
        } else {
            inputTitle.value = '';
            inputIcon.value = '';
            currentSelectedIcon = 'fa-solid fa-folder';
            modalTitleElem.textContent = 'Nueva Categoría';
        }
        
        iconPreview.className = currentSelectedIcon;
        iconDropdown.style.display = 'none';
        modal.classList.add('active');
        
        // Empezar a precargar la lista pesada silenciosamente de fondo
        if(!isIconsLoaded) fetchAllIcons();
    };

    window.closeCategoryModal = function() {
        modal.classList.remove('active');
        iconDropdown.style.display = 'none';
    };

    // Renderizar iconos en el dropdown
    function renderIconGrid(filterText = '') {
        if (!isIconsLoaded) return; // Si no han cargado, no hacemos nada (el loading ya está en pantalla)

        iconDropdown.innerHTML = '';
        const search = filterText.toLowerCase().trim();
        
        // Filtrar y limitar a 40 para no congelar el navegador (hay más de 2000 iconos)
        const filteredIcons = dynamicIcons.filter(icon => icon.includes(search)).slice(0, 40);
        
        if (filteredIcons.length === 0) {
            iconDropdown.innerHTML = '<span style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No se encontraron iconos</span>';
            return;
        }

        filteredIcons.forEach(iconClass => {
            const item = document.createElement('div');
            item.className = 'icon-item';
            
            // Extraer solo el nombre para mostrarlo amigable
            const shortName = iconClass.replace('fa-solid fa-', '').replace('fa-brands fa-', '').replace('fa-regular fa-', '');
            
            item.innerHTML = `
                <i class="${iconClass}"></i>
                <span>${shortName}</span>
            `;
            
            item.addEventListener('click', () => {
                selectIcon(iconClass);
            });
            
            iconDropdown.appendChild(item);
        });
    }

    function selectIcon(iconClass) {
        currentSelectedIcon = iconClass;
        inputIcon.value = iconClass;
        iconPreview.className = iconClass;
        iconDropdown.style.display = 'none';
    }

    // Eventos del Autocomplete
    inputIcon.addEventListener('input', (e) => {
        const text = e.target.value;
        currentSelectedIcon = text; 
        iconPreview.className = text;
        
        iconDropdown.style.display = 'grid';
        if (isIconsLoaded) {
            renderIconGrid(text);
        } else {
            fetchAllIcons(); // Si escribió rápido antes de cargar
        }
    });

    inputIcon.addEventListener('focus', () => {
        iconDropdown.style.display = 'grid';
        if (isIconsLoaded) {
            renderIconGrid(inputIcon.value);
        } else {
            fetchAllIcons();
        }
    });

    // Cerrar dropdown al hacer clic fuera de él o del input
    document.addEventListener('click', (e) => {
        if (!inputIcon.contains(e.target) && !iconDropdown.contains(e.target)) {
            iconDropdown.style.display = 'none';
        }
    });

    // Eventos del modal
    btnClose.addEventListener('click', window.closeCategoryModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeCategoryModal();
        }
    });

    btnSave.addEventListener('click', () => {
        const title = inputTitle.value.trim();
        const finalIcon = inputIcon.value.trim() !== '' ? inputIcon.value.trim() : 'fa-solid fa-folder';
        
        if (title) {
            const catData = {
                id: currentEditingCategoryId, // Si es nulo, home.js creará uno nuevo
                title: title,
                icon: finalIcon
            };
            
            if(window.saveCategoryToApp) {
                window.saveCategoryToApp(catData);
            }
            
            window.closeCategoryModal();
        } else {
            if(window.showToast) window.showToast('El nombre no puede estar vacío', true);
        }
    });
};
