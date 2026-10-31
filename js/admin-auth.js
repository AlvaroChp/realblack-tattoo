(function () {
    const API_URL = 'http://localhost:3000/api';
    const TOKEN_KEY = 'rbt_token';
    const USER_KEY = 'rbt_user';
    const adminOnlyPages = [
        'artistas.html',
        'portfolio.html',
        'videos.html',
        'blog.html',
        'usuarios.html',
        'editar-artista.html',
        'editar-trabajo.html',
        'editar-articulo.html',
        'editar-usuario.html'
    ];

    function currentUser() {
        try {
            const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
            return user && user.role ? user : null;
        } catch {
            return null;
        }
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    }

    function protectPage() {
        const user = currentUser();
        const page = window.location.pathname.split('/').pop();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        if (user.role !== 'admin' && adminOnlyPages.includes(page)) {
            window.location.href = 'panel.html';
            return;
        }
        document.querySelectorAll('[data-admin-only]').forEach((element) => {
            if (user.role !== 'admin') {
                element.remove();
            }
        });
        document.querySelectorAll('[data-logout]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                logout();
            });
        });
    }

    function login() {
        const form = document.querySelector('#admin-login-form');
        if (!form) {
            protectPage();
            return;
        }
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submit = form.querySelector('button[type="submit"]');
            const error = document.querySelector('#login-error');
            submit.disabled = true;
            error.textContent = '';
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: form.usuario.value,
                        password: form.contrasena.value
                    })
                });
                if (!response.ok) {
                    throw new Error('Usuario o contraseña incorrectos.');
                }
                const data = await response.json();
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                window.location.href = 'panel.html';
            } catch (requestError) {
                error.textContent = requestError.message;
                submit.disabled = false;
            }
        });
    }

    login();
})();
