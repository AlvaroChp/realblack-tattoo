(function () {
    const API_URL = 'http://localhost:3000/api';
    const list = document.querySelector('#artists-list');
    const error = document.querySelector('#artists-error');

    function escapeHtml(value) {
        const element = document.createElement('span');
        element.textContent = value;
        return element.innerHTML;
    }

    fetch(`${API_URL}/artists`)
        .then((response) => {
            if (!response.ok) throw new Error('No se pudieron cargar los artistas.');
            return response.json();
        })
        .then((artists) => {
            list.textContent = '';
            if (!artists.length) {
                list.innerHTML = '<p>No hay artistas publicados.</p>';
                return;
            }
            artists.forEach((artist) => {
                const article = document.createElement('article');
                article.innerHTML = `
                    <h3><a href="artista.html?nombre=${encodeURIComponent(artist.name)}">${escapeHtml(artist.name)}</a></h3>
                    <p>${escapeHtml(artist.bio || 'Conoce su perfil y sus trabajos.')}</p>
                    <p><strong>${escapeHtml(artist.specialty || '')}</strong></p>`;
                list.appendChild(article);
            });
        })
        .catch((requestError) => { error.textContent = requestError.message; });
})();
