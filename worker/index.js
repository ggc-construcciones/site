const CONTACT_TO = 'contacto@ggcconstrucciones.cl';
// Sending identity lives on a subdomain verified in Resend, kept separate from
// the apex domain's existing Google Workspace SPF record — see setup docs.
const CONTACT_FROM = 'GGC Construcciones <contacto@mail.ggcconstrucciones.cl>';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Método no permitido.' }, 405, { Allow: 'POST' });
      }
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY no está configurada como secret de Wrangler.');
    return json(
      {
        ok: false,
        error: 'El formulario no está disponible en este momento. Escríbenos directamente a contacto@ggcconstrucciones.cl.',
      },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Solicitud inválida.' }, 400);
  }

  const nombre = String(body.nombre ?? '').trim();
  const email = String(body.email ?? '').trim();
  const mensaje = String(body.mensaje ?? '').trim();
  // Honeypot: real users never see or fill this field (see contacto.html / style.css).
  const honeypot = String(body.campo_control ?? '').trim();

  if (honeypot) {
    // Pretend success so unsophisticated bots don't learn to avoid the field.
    return json({ ok: true });
  }

  if (!nombre || !email || !mensaje) {
    return json({ ok: false, error: 'Completa todos los campos requeridos.' }, 400);
  }
  if (nombre.length > 200 || mensaje.length > 5000 || email.length > 254) {
    return json({ ok: false, error: 'Uno de los campos supera el largo permitido.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Ingresa un correo electrónico válido.' }, 400);
  }

  const subject = `Nuevo mensaje de contacto — ${nombre}`;
  const text =
    `Nombre o Empresa: ${nombre}\n` +
    `Correo: ${email}\n\n` +
    `Detalles del proyecto:\n${mensaje}`;

  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!resendResp.ok) {
      const detail = await resendResp.text().catch(() => '');
      console.error('Resend API error', resendResp.status, detail);
      return json(
        { ok: false, error: 'No se pudo enviar el mensaje. Intenta nuevamente más tarde.' },
        502
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Fallo al contactar Resend', err);
    return json(
      { ok: false, error: 'No se pudo enviar el mensaje. Intenta nuevamente más tarde.' },
      502
    );
  }
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
