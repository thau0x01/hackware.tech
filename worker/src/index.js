const ALLOWED_ORIGINS = [
  'https://hackware.tech',
  'https://www.hackware.tech',
];

const SERVICE_LABELS = {
  web: 'Pentest em Aplicações Web',
  infraestrutura: 'Pentest em Infraestrutura',
  mobile: 'Pentest em Aplicações Móveis (Android / iOS)',
  redteam: 'Operações de Red Team',
  forense: 'Perícia Forense Computacional',
  outros: 'Serviços Especializados / Outro',
  naosei: 'Ainda não sei — preciso de orientação',
};

const MAX_LEN = {
  name: 200,
  company: 200,
  role: 200,
  email: 200,
  service: 50,
  message: 5000,
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { ...cors, Allow: 'POST, OPTIONS' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON inválido.' }, 400, cors);
    }

    const fields = {
      name: str(body.name),
      company: str(body.company),
      role: str(body.role),
      email: str(body.email),
      service: str(body.service),
      message: str(body.message),
    };

    for (const [key, val] of Object.entries(fields)) {
      if (val.length > MAX_LEN[key]) {
        return json({ error: `Campo "${key}" excede o tamanho permitido.` }, 400, cors);
      }
    }

    if (!fields.name || !fields.company || !fields.role || !isValidEmail(fields.email)) {
      return json({ error: 'Campos obrigatórios faltando ou inválidos.' }, 400, cors);
    }

    const turnstileToken = str(body['cf-turnstile-response']);
    if (!turnstileToken) {
      return json({ error: 'Verificação anti-bot ausente.' }, 400, cors);
    }

    if (!env.TURNSTILE_SECRET_KEY || !env.MAILERSEND_API_KEY) {
      console.error('Secrets não configurados.');
      return json({ error: 'Serviço indisponível.' }, 500, cors);
    }

    const verifyForm = new FormData();
    verifyForm.append('secret', env.TURNSTILE_SECRET_KEY);
    verifyForm.append('response', turnstileToken);
    const remoteIp = request.headers.get('CF-Connecting-IP');
    if (remoteIp) verifyForm.append('remoteip', remoteIp);

    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: verifyForm,
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyData.success) {
      console.error('Turnstile verification failed', verifyData);
      return json({ error: 'Verificação anti-bot falhou.' }, 403, cors);
    }

    const serviceLabel = SERVICE_LABELS[fields.service]
      || (fields.service ? `${fields.service} (não mapeado)` : 'Não informado');

    const payload = {
      from: { email: '***@***.***', name: 'Site Hackware' },
      to: [{ email: '***@***.***', name: 'Contatos do Site' }],
      reply_to: { email: fields.email, name: fields.name },
      subject: `Novo contato do site — ${fields.name} (${fields.company})`,
      html: buildHtml(fields, serviceLabel),
      text: buildText(fields, serviceLabel),
    };

    const upstream = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('MailerSend error', upstream.status, errText);
      return json({ error: 'Falha ao enviar a mensagem.' }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(f, serviceLabel) {
  const row = (label, value) => `
      <tr>
        <td style="font-weight:600;vertical-align:top;padding:6px 12px 6px 0;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;">${value}</td>
      </tr>`;

  const messageHtml = f.message
    ? `<span style="white-space:pre-wrap;">${escapeHtml(f.message)}</span>`
    : '<em style="color:#666;">(não informada)</em>';

  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6;">
    <h2 style="margin:0 0 16px;">Novo contato pelo site Hackware</h2>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      ${row('Nome', escapeHtml(f.name))}
      ${row('Empresa/Órgão', escapeHtml(f.company))}
      ${row('Cargo', escapeHtml(f.role))}
      ${row('E-mail', `<a href="mailto:${escapeHtml(f.email)}">${escapeHtml(f.email)}</a>`)}
      ${row('Serviço', escapeHtml(serviceLabel))}
      ${row('Mensagem', messageHtml)}
    </table>
  </body>
</html>`;
}

function buildText(f, serviceLabel) {
  return [
    'Novo contato pelo site Hackware',
    '',
    `Nome: ${f.name}`,
    `Empresa/Órgão: ${f.company}`,
    `Cargo: ${f.role}`,
    `E-mail: ${f.email}`,
    `Serviço: ${serviceLabel}`,
    '',
    'Mensagem:',
    f.message || '(não informada)',
  ].join('\n');
}
