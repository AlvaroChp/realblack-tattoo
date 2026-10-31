(function () {
    const API_URL = 'http://localhost:3000/api';
    const TOKEN_KEY = 'rbt_token';
    const list = document.querySelector('#artists-list');
    const error = document.querySelector('#artists-error');

    async function request(url, options) {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                ...(options && options.headers),
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
            }
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `Error HTTP ${response.status}`);
        }
        return response.status === 204 ? null : response.json();
    }

    function render(artists) {
        list.textContent = '';
        if (!artists.length) {
            list.innerHTML = '<tr><td colspan="4">No hay artistas publicados.</td></tr>';
            return;
        }
        artists.forEach((artist) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(artist.name)}</td>
                <td>${escapeHtml(artist.bio || '')}</td>
                <td>${escapeHtml(artist.specialty || '')}</td>
                <td>
                    <a href="editar-artista.html?id=${artist.id}">Editar</a>
                    <button type="button" data-delete="${artist.id}">Eliminar</button>
                </td>`;
            list.appendChild(row);
        });
        list.querySelectorAll('[data-delete]').forEach((button) => {
            button.addEventListener('click', () => remove(Number(button.dataset.delete)));
        });
    }

    function escapeHtml(value) {
        const element = document.createElement('span');
        element.textContent = value;
        return element.innerHTML;
    }

    async function load() {
        try {
            render(await request('/artists'));
        } catch (requestError) {
            error.textContent = requestError.message;
        }
    }

    async function remove(id) {
        if (!confirm('¿Eliminar este perfil de artista?')) return;
        error.textContent = '';
        try {
            await request(`/artists/${id}`, { method: 'DELETE' });
            await load();
        } catch (requestError) {
            error.textContent = requestError.message;
        }
    }

    load();
})();
