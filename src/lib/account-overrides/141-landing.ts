// Landing de anuncios (ChatGPT) de Grupo Marín, servida en /anuncios.
// Es el HTML que mandó Marta el 31-oct-2026 tal cual, con cuatro retoques de
// Vesta: aviso de cookies + píxel de OpenAI solo tras «Aceptar», el evento
// lead_created al enviar, y el enlace de privacidad a /proteccion-de-datos.
// __OPENAI_PIXEL_ID__ y __FORM_ENDPOINT__ los rellena src/app/anuncios/route.ts.
export const ACCOUNT_141_LANDING_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contacto | Grupo Marín</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">
<script>
  /* CONFIGURACIÓN — FORM_ENDPOINT: URL que recibe los leads en JSON (CRM, Make, Zapier, Formspree...).
     Vacío = el lead se envía por WhatsApp. THANK_YOU_URL opcional. */
  window.GM_CONFIG = { FORM_ENDPOINT: "__FORM_ENDPOINT__", WHATSAPP: "34663946837", THANK_YOU_URL: "" };
</script>
<!-- Pega aquí el píxel de Meta y/o la etiqueta de Google Ads / GTM -->
<style>
  :root{--black:#111;--ink:#1d1d1d;--grey:#6b6b6b;--line:#e6e3de;--soft:#f6f4f0;--white:#fff;--accent:#b08d57;--accent-l:#e4cfa6;--radius:14px}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--white);line-height:1.55;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  h1,h2,h3{font-family:'Playfair Display',Georgia,serif;font-weight:600;line-height:1.15;color:var(--black)}
  .wrap{max-width:1200px;margin:0 auto;padding:0 24px}

  /* Cabecera de página: "Contáctanos / Estamos aquí para ayudarte" */
  .page-head{color:var(--white);text-align:center;padding:56px 0 64px;
    background:linear-gradient(rgba(10,10,10,.78),rgba(10,10,10,.78)),
    url('https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/hero/background_0kJ2YZvW.jpg') center/cover,#161616}
  .brand{display:inline-block;margin-bottom:34px}
  .brand img{height:56px;width:auto;filter:invert(1);display:block;margin:0 auto}
  .wordmark{display:none;font-family:'Playfair Display',Georgia,serif;font-size:1.9rem;letter-spacing:.14em;color:var(--white);line-height:1}
  .wordmark small{display:block;font-family:'Inter',sans-serif;font-size:.68rem;letter-spacing:.22em;text-transform:uppercase;color:var(--accent-l);margin-top:10px}
  .page-head h1{color:var(--white);font-size:clamp(2.4rem,5vw,3.6rem);margin-bottom:10px}
  .page-head p{opacity:.85;font-size:1.1rem}

  /* Dos columnas: formulario + información */
  .main{display:grid;grid-template-columns:1.25fr 1fr;gap:40px;padding-top:64px;padding-bottom:80px;align-items:start}
  .box{border:1px solid var(--line);border-radius:18px;padding:38px}
  .box h2{font-size:1.8rem;margin-bottom:6px}
  .box .intro{color:var(--grey);font-size:.95rem;margin-bottom:26px}
  .eyebrow{font-size:.76rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);font-weight:600;display:block;margin-bottom:10px}

  form{display:grid;gap:16px}
  label{font-size:.82rem;font-weight:600;display:block;margin-bottom:6px}
  input,textarea{width:100%;padding:14px 16px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:.95rem;background:var(--soft);outline:none;transition:.2s;color:var(--ink)}
  input:focus,textarea:focus{border-color:var(--black);background:var(--white)}
  textarea{min-height:110px;resize:vertical}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
  .chips{display:grid;gap:8px}
  .chips-2{grid-template-columns:1fr 1fr}
  .chips-3{grid-template-columns:1fr 1fr 1.4fr}
  .chips input{display:none}
  .chips label{margin:0;text-align:center;padding:12px 4px;border:1px solid var(--line);border-radius:10px;cursor:pointer;font-weight:500;font-size:.88rem;background:var(--soft);transition:.2s}
  .chips input:checked+label{background:var(--black);color:var(--white);border-color:var(--black)}
  .eur{position:relative}
  .eur input{padding-right:40px}
  .eur span{position:absolute;right:16px;top:50%;transform:translateY(-50%);color:var(--grey);font-weight:600}
  .consent{display:flex;gap:10px;align-items:flex-start;font-size:.8rem;color:var(--grey);font-weight:400;margin:0}
  .consent input{width:auto;margin-top:3px;accent-color:var(--black)}
  .consent a{text-decoration:underline}
  .err{color:#b3261e;font-size:.84rem;display:none}
  button{width:100%;padding:17px;border:0;border-radius:999px;background:var(--black);color:var(--white);font:inherit;font-weight:600;font-size:1rem;cursor:pointer;transition:.25s}
  button:hover{background:var(--accent)}
  button:disabled{opacity:.6;cursor:default}
  .thanks{display:none;text-align:center;padding:40px 10px}
  .ok{width:66px;height:66px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:1.8rem;margin:0 auto 18px}
  .thanks p{color:var(--grey);margin-top:10px}

  /* Información de contacto */
  .info{background:var(--soft);border-color:transparent}
  .info .intro{margin-bottom:22px}
  .item{display:flex;gap:14px;padding:16px 0;border-top:1px solid var(--line)}
  .item .ic{flex:none;width:42px;height:42px;border-radius:12px;background:var(--white);display:grid;place-items:center}
  .item small{display:block;font-size:.75rem;color:var(--grey);text-transform:uppercase;letter-spacing:.08em}
  .item a,.item span{font-weight:600}
  .item a:hover{color:var(--accent)}
  .hours div{display:flex;justify-content:space-between;font-size:.9rem;gap:16px}
  .hours div span{font-weight:500}
  .offices{display:grid;gap:10px;margin-bottom:8px}
  .office{display:flex;gap:14px;background:var(--white);border-radius:12px;padding:16px}
  .office .ic{flex:none;width:40px;height:40px;border-radius:10px;background:var(--soft);display:grid;place-items:center}
  .office h3{font-family:'Inter',sans-serif;font-size:.98rem;font-weight:700;margin-bottom:2px}
  .office a{font-size:.88rem}
  .office p{font-size:.85rem;color:var(--grey);margin-top:2px;word-break:break-word}
  .office p a{font-weight:500;font-size:.85rem}
  .office a:hover{color:var(--accent)}
  .map{margin-top:22px;border-radius:var(--radius);overflow:hidden;height:250px;background:#ddd}
  .map iframe{width:100%;height:100%;border:0;display:block}

  @media (max-width:900px){ .main{grid-template-columns:1fr;padding-top:32px;padding-bottom:60px} }
  @media (max-width:560px){
    .wrap{padding:0 14px}
    .box{padding:26px 18px}
    .row2{grid-template-columns:1fr}
    .chips-3{grid-template-columns:1fr 1fr}
    .chips-3 label:last-child{grid-column:1/-1}
    .page-head{padding:40px 0 46px}
  }
</style>
<!-- Vesta: píxel de OpenAI solo tras aceptar cookies (LSSI 22.2). Misma cookie que el resto de la web. -->
<style>#gm-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.12);font:14px/1.45 Inter,system-ui,sans-serif;color:#333;display:none}#gm-cookies p{margin:0}#gm-cookies a{color:inherit}#gm-cookies .b{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}#gm-cookies button{font:inherit;width:auto!important;flex:0 0 auto;margin:0!important;padding:7px 16px!important;border-radius:8px;cursor:pointer;border:1px solid #222;box-shadow:none}#gm-cookies .ok{background:#222;color:#fff}#gm-cookies .no{background:#fff;color:#222}</style>
<script>
(function(){
  var C = "cookieConsent";
  function load(){
    !function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
    oaiq("init", {pixelId: "__OPENAI_PIXEL_ID__"});
  }
  function save(v){ document.cookie = C + "=" + v + "; Max-Age=31536000; Path=/; SameSite=Lax; Secure"; }
  var m = document.cookie.match(/(?:^|; )cookieConsent=(granted|denied)/);
  if (m && m[1] === "granted") { load(); return; }
  if (m) return;
  document.addEventListener("DOMContentLoaded", function(){
    var b = document.getElementById("gm-cookies"); if (!b) return;
    b.style.display = "block";
    b.querySelector(".ok").onclick = function(){ save("granted"); b.remove(); load(); };
    b.querySelector(".no").onclick = function(){ save("denied"); b.remove(); };
  });
})();
</script>
</head>
<body>

<header class="page-head">
  <div class="wrap">
    <a class="brand" href="https://www.grupomarinccm.com" target="_blank" rel="noopener" aria-label="Grupo Marín">
      <img src="https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/branding/logo_black_1792054048598.png" alt="Grupo Marín" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="wordmark">GRUPO MARÍN<small>Construcción · Reformas · Inmobiliaria</small></span>
    </a>
    <h1>Contáctanos</h1>
    <p>Estamos aquí para ayudarte</p>
  </div>
</header>

<main class="wrap main">

  <!-- ===== FORMULARIO ===== -->
  <section class="box" id="formulario">
    <div class="thanks" id="thanks">
      <div class="ok">✓</div>
      <h2>¡Gracias!</h2>
      <p>Hemos recibido tu solicitud. Un asesor de Grupo Marín te llamará en menos de 24 horas laborables.</p>
    </div>

    <div id="formWrap">
      <h2>Envíanos un mensaje</h2>
      <p class="intro">Completa el formulario y te responderemos lo antes posible.</p>

      <form id="leadForm" novalidate>
        <!-- Campo trampa anti-spam (oculto) -->
        <div class="hp" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>

        <div><label for="nombre">Nombre completo *</label><input id="nombre" name="nombre" autocomplete="name"></div>
        <div class="row2">
          <div><label for="tel">Número de teléfono *</label><input id="tel" name="telefono" type="tel" inputmode="tel" autocomplete="tel"></div>
          <div><label for="email">Correo electrónico (opcional)</label><input id="email" name="email" type="email" autocomplete="email"></div>
        </div>

        <div><label for="ubi">¿Dónde se encuentra la propiedad? *</label><input id="ubi" name="ubicacion" placeholder="Población, calle o zona"></div>

        <div>
          <label>¿Has publicado la propiedad? *</label>
          <div class="chips chips-2">
            <input type="radio" name="publicado" id="p1" value="Sí"><label for="p1">Sí</label>
            <input type="radio" name="publicado" id="p2" value="No"><label for="p2">No</label>
          </div>
        </div>

        <div><label for="precio">¿Cuánto crees que pagaría un comprador por tu propiedad? *</label>
          <div class="eur"><input id="precio" name="precio" inputmode="numeric" placeholder="Ej. 350.000"><span>€</span></div></div>

        <div>
          <label>¿Estarías dispuesto a ser asesorado exclusivamente por nosotros en caso de que cumplamos tus expectativas? *</label>
          <div class="chips chips-3">
            <input type="radio" name="exclusiva" id="e1" value="Sí"><label for="e1">Sí</label>
            <input type="radio" name="exclusiva" id="e2" value="No"><label for="e2">No</label>
            <input type="radio" name="exclusiva" id="e3" value="Lo valoraría"><label for="e3">Lo valoraría</label>
          </div>
        </div>

        <div><label for="msg">Mensaje</label><textarea id="msg" name="mensaje" placeholder="Cuéntanos lo que quieras sobre tu propiedad (opcional)"></textarea></div>

        <input type="hidden" name="utm_source"><input type="hidden" name="utm_medium"><input type="hidden" name="utm_campaign">
        <input type="hidden" name="utm_content"><input type="hidden" name="utm_term"><input type="hidden" name="gclid"><input type="hidden" name="fbclid">

        <label class="consent"><input type="checkbox" name="rgpd"> <span>Utilizamos tus datos únicamente para responder a tu consulta. Puedes acceder, rectificar o solicitar la eliminación de tus datos en cualquier momento. Acepto la <a href="/proteccion-de-datos" target="_blank" rel="noopener">Protección de datos</a>. *</span></label>
        <p class="err" id="err">Completa todos los campos marcados con * y la casilla de privacidad.</p>
        <button type="submit" id="send">Enviar mensaje →</button>
      </form>
    </div>
  </section>

  <!-- ===== INFORMACIÓN DE CONTACTO ===== -->
  <aside class="box info">
    <span class="eyebrow">Nuestras oficinas</span>
    <h2>Información de contacto</h2>
    <p class="intro">Llámanos, escríbenos o visítanos en cualquiera de nuestras oficinas.</p>

    <div class="offices">
      <div class="office">
        <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>
        <div><h3>Grupo Marín Premià</h3>
          <a href="https://www.google.com/maps/search/?api=1&query=Carrer+Geranis+25+Premià+de+Dalt" target="_blank" rel="noopener">Carrer Geranis, 25, Premià de Dalt</a>
          <p><a href="tel:+34695611457">695 611 457</a> · <a href="mailto:info@grupomarinccm.com">info@grupomarinccm.com</a></p>
        </div>
      </div>
      <div class="office">
        <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>
        <div><h3>Grupo Marín Vilassar de Mar</h3>
          <a href="https://www.google.com/maps/search/?api=1&query=Av.+Montevideo+150+Vilassar+de+Mar" target="_blank" rel="noopener">Av. Montevideo, 150, Vilassar de Mar</a>
          <p><a href="tel:+34936178921">936 178 921</a> · <a href="mailto:grupomarinvdm@gmail.com">grupomarinvdm@gmail.com</a></p>
        </div>
      </div>
      <div class="office">
        <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>
        <div><h3>Grupo Marín Barcelona</h3>
          <a href="https://www.google.com/maps/search/?api=1&query=Carrer+Sardenya+206+Barcelona" target="_blank" rel="noopener">Carrer Sardenya, 206, Barcelona</a>
          <p><a href="tel:+34937024607">937 024 607</a> · <a href="mailto:grupomarinbcn@gmail.com">grupomarinbcn@gmail.com</a></p>
        </div>
      </div>
      <div class="office">
        <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></div>
        <div><h3>Grupo Marín Blanes</h3>
          <a href="https://www.google.com/maps/search/?api=1&query=Carrer+Cristòfol+Colom+28+Blanes+(Girona)" target="_blank" rel="noopener">Carrer Cristòfol Colom, 28, Blanes (Girona)</a>
          <p><a href="tel:+34663946837">663 946 837</a> · <a href="mailto:grupomarinbcn@gmail.com">grupomarinbcn@gmail.com</a></p>
        </div>
      </div>
    </div>

    <div class="item">
      <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
      <div class="hours" style="flex:1"><small>Horario</small>
        <div><span>Lunes a viernes</span><span>9:00 – 19:00</span></div>
        <div><span>Sábado</span><span>10:00 – 14:00</span></div>
        <div><span>Domingo</span><span>Cerrado</span></div>
      </div>
    </div>
    <div class="item">
      <div class="ic"><svg width="20" height="20" fill="none" stroke="#111" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#111"/></svg></div>
      <div><small>Instagram</small><a href="https://www.instagram.com/grupomarinccm/" target="_blank" rel="noopener">@grupomarinccm</a></div>
    </div>

    <div class="map">
      <iframe title="Mapa Grupo Marín Barcelona" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=Carrer+de+Sardenya+206,+08013+Barcelona&output=embed"></iframe>
    </div>
  </aside>

</main>

<script>
(function(){
  const cfg = window.GM_CONFIG || {};
  const form = document.getElementById('leadForm');
  const params = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);

  // UTMs / gclid / fbclid del anuncio
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'].forEach(k => {
    if (params.get(k)) form.elements[k].value = params.get(k);
  });

  // Precio con puntos de miles
  $('precio').addEventListener('input', e => {
    const n = e.target.value.replace(/\\D/g,''); e.target.value = n ? Number(n).toLocaleString('es-ES') : '';
  });

  function track(name, data){
    try{ if (window.fbq) fbq('track', name, data||{}); }catch(e){}
    try{ if (window.gtag) gtag('event', 'generate_lead', data||{}); }catch(e){}
    try{ if (window.oaiq) oaiq('measure', 'lead_created', {type: 'customer_action'}); }catch(e){}
    try{ (window.dataLayer = window.dataLayer || []).push(Object.assign({event:name}, data||{})); }catch(e){}
  }

  function done(){
    if (cfg.THANK_YOU_URL) { location.href = cfg.THANK_YOU_URL; return; }
    $('formWrap').style.display = 'none'; $('thanks').style.display = 'block';
    $('formulario').scrollIntoView({behavior:'smooth', block:'start'});
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (d.website) { done(); return; }   // bot
    const ok = (d.nombre||'').trim() && (d.telefono||'').replace(/\\D/g,'').length >= 9 && (d.ubicacion||'').trim()
      && d.publicado && (d.precio||'').replace(/\\D/g,'') && d.exclusiva && form.elements.rgpd.checked;
    if (!ok) { $('err').style.display = 'block'; return; }
    $('err').style.display = 'none';
    delete d.website; delete d.rgpd; d.privacidad = 'Aceptada'; d.pagina = location.href; d.fecha = new Date().toISOString();

    const btn = $('send'); btn.disabled = true; btn.textContent = 'Enviando...';
    if (cfg.FORM_ENDPOINT) {
      try {
        const r = await fetch(cfg.FORM_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify(d)});
        if (!r.ok) throw new Error(r.status);
      } catch (ex) {
        btn.disabled = false; btn.textContent = 'Enviar mensaje →';
        $('err').textContent = 'No se ha podido enviar. Inténtalo de nuevo en unos segundos.'; $('err').style.display = 'block';
        return;
      }
    } else {
      const txt = \`Hola Grupo Marín, soy \${d.nombre} (tel. \${d.telefono}\${d.email ? ', ' + d.email : ''}).\\nUbicación de la propiedad: \${d.ubicacion}.\\n¿Propiedad publicada?: \${d.publicado}.\\nPrecio que cree que pagaría un comprador: \${d.precio} €.\\n¿Asesoramiento en exclusiva?: \${d.exclusiva}.\${d.mensaje ? '\\n\\n' + d.mensaje : ''}\`;
      window.open('https://wa.me/' + cfg.WHATSAPP + '?text=' + encodeURIComponent(txt), '_blank');
    }
    track('Lead', {ubicacion: d.ubicacion, exclusiva: d.exclusiva});
    done();
  });
})();
</script>
<div id="gm-cookies" role="dialog" aria-label="Cookies"><p>Usamos cookies de análisis y de publicidad para medir nuestros anuncios. Solo se activan si las aceptas. <a href="/cookies">Más información</a></p><div class="b"><button class="no" type="button">Rechazar</button><button class="ok" type="button">Aceptar</button></div></div>
</body>
</html>
`;
