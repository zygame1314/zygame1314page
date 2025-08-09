document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '登录失败');
            }

            if (result.success && result.token) {
                localStorage.setItem('authToken', result.token);
                window.location.href = 'index.html';
            } else {
                throw new Error('无效的响应');
            }

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });
});