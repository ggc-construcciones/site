(function () {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const statusEl = document.getElementById('contact-form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(message, isError) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.classList.toggle('is-error', Boolean(isError));
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        setStatus('Enviando...', false);
        if (submitBtn) submitBtn.disabled = true;

        const payload = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.ok) {
                setStatus('Gracias, tu mensaje fue enviado. Te contactaremos pronto.', false);
                form.reset();
            } else {
                setStatus(data.error || 'No se pudo enviar el mensaje. Intenta nuevamente.', true);
            }
        } catch (err) {
            setStatus('No se pudo enviar el mensaje. Revisa tu conexión e intenta nuevamente.', true);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
})();
