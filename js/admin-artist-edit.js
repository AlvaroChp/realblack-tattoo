(function () {
    const API_URL = 'http://localhost:3000/api';
    const TOKEN_KEY = 'rbt_token';
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const form = document.querySelector('#artist-form');
    const error = document.querySelector('#artist-error');

    async function request(url, options) {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
            }
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `Error HTTP ${response.status}`);
        }
        return response.status === 204 ? null : response.json();
    }

    function field(id) {
        return document.querySelector(`#${id}`);
    }

    async function load() {
        if (!id) return;
        try {
            const artist = await request(`/artists/${id}`);
            field('nombre').value = artist.name || '';
            field('descripcion').value = artist.bio || '';
            field('especialidad').value = artist.specialty || '';
            field('foto').value = artist.image || '';
        } catch (requestError) {
            error.textContent = requestError.message;
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        error.textContent = '';
        const artist = {
            name: field('nombre').value.trim(),
            bio: field('descripcion').value.trim(),
            specialty: field('especialidad').value.trim(),
            image: field('foto').value.trim()
        };
        try {
            await request(id ? `/artists/${id}` : '/artists', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(artist)
            });
            window.location.href = 'artistas.html';
        } catch (requestError) {
            error.textContent = requestError.message;
        }
    });

    load();
})();
