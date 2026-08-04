// localCache.js — Capa de caché localStorage para CopyMaster
// Todas las operaciones son síncronas e instantáneas.

const CACHE_PREFIX = 'copymaster_data_';

/**
 * Genera la clave de localStorage única por usuario.
 */
function _key(userId) {
    return CACHE_PREFIX + userId;
}

/**
 * Lee el objeto completo del caché para un usuario.
 * @returns {{ categories: Array, notes: Array } | null}
 */
function _readAll(userId) {
    try {
        const raw = localStorage.getItem(_key(userId));
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('[Cache] Error leyendo caché local:', e);
        return null;
    }
}

/**
 * Escribe el objeto completo al caché.
 */
function _writeAll(userId, data) {
    try {
        localStorage.setItem(_key(userId), JSON.stringify(data));
    } catch (e) {
        console.warn('[Cache] Error escribiendo caché local:', e);
    }
}

// ============================
// API PÚBLICA
// ============================

/**
 * Guarda los arrays completos de categorías y notas en localStorage.
 */
function saveToCache(userId, categories, notes) {
    _writeAll(userId, { categories, notes, lastSync: Date.now() });
}

/**
 * Carga los datos cacheados de un usuario.
 * @returns {{ categories: Array, notes: Array, lastSync: number } | null}
 */
function loadFromCache(userId) {
    return _readAll(userId);
}

/**
 * Limpia completamente el caché de un usuario (útil al cerrar sesión).
 */
function clearCache(userId) {
    try {
        localStorage.removeItem(_key(userId));
    } catch (e) {
        console.warn('[Cache] Error limpiando caché:', e);
    }
}

/**
 * Actualiza o agrega una categoría individual en el caché.
 * Si la categoría ya existe (mismo id), la reemplaza. Si no, la agrega.
 */
function updateCategoryInCache(userId, category) {
    const data = _readAll(userId);
    if (!data) return;

    const idx = data.categories.findIndex(c => c.id === category.id);
    if (idx > -1) {
        data.categories[idx] = { ...data.categories[idx], ...category };
    } else {
        data.categories.push(category);
    }
    _writeAll(userId, data);
}

/**
 * Elimina una categoría (y sus notas asociadas) del caché.
 */
function removeCategoryFromCache(userId, catId) {
    const data = _readAll(userId);
    if (!data) return;

    data.categories = data.categories.filter(c => c.id !== catId);
    data.notes = data.notes.filter(n => n.categoryId !== catId);
    _writeAll(userId, data);
}

/**
 * Actualiza o agrega una nota individual en el caché.
 */
function updateNoteInCache(userId, note) {
    const data = _readAll(userId);
    if (!data) return;

    const idx = data.notes.findIndex(n => n.id === note.id);
    if (idx > -1) {
        data.notes[idx] = { ...data.notes[idx], ...note };
    } else {
        data.notes.push(note);
    }
    _writeAll(userId, data);
}

/**
 * Elimina una nota del caché.
 */
function removeNoteFromCache(userId, noteId) {
    const data = _readAll(userId);
    if (!data) return;

    data.notes = data.notes.filter(n => n.id !== noteId);
    _writeAll(userId, data);
}

/**
 * Reemplaza un ID temporal por el ID real de Firestore en el caché.
 * Útil para notas/categorías nuevas cuyo ID temporal fue generado localmente.
 */
function replaceTempId(userId, collectionName, tempId, realId) {
    const data = _readAll(userId);
    if (!data) return;

    const arr = collectionName === 'categories' ? data.categories : data.notes;
    const item = arr.find(x => x.id === tempId);
    if (item) {
        item.id = realId;
    }
    _writeAll(userId, data);
}

// Exportar al ámbito global (este archivo se carga con <script src>, no como module)
window.LocalCache = {
    saveToCache,
    loadFromCache,
    clearCache,
    updateCategoryInCache,
    removeCategoryFromCache,
    updateNoteInCache,
    removeNoteFromCache,
    replaceTempId
};
