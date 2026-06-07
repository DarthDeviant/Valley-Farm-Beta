(async () => {
  // Add any patch filenames here — all will be fetched and applied in order
  const PATCH_FILES = [
    'patch.json', 'falltownpatch.json'
  ];

  const ts = Date.now();

  async function tryFetch(file) {
    try {
      const res = await fetch(`${file}?v=${ts}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  const patches = (await Promise.all(PATCH_FILES.map(tryFetch))).filter(Boolean);
  if (!patches.length) return; // No patch files found = do nothing

  for (const patch of patches) {

    const { version, css, html, js } = patch;
    console.log(`[Patcher] Applying patch v${version}`);

    // 1. Inject CSS overrides
    if (css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }

    // 2. Apply HTML patches (insert / replace / remove elements)
    if (html) {
      html.forEach(({ action, selector, content, position = 'afterend' }) => {
        const el = document.querySelector(selector);
        if (!el) return console.warn('[Patcher] Not found:', selector);
        if (action === 'replace') el.outerHTML = content;
        else if (action === 'innerHTML') el.innerHTML = content;
        else if (action === 'insert') el.insertAdjacentHTML(position, content);
        else if (action === 'remove') el.remove();
        else if (action === 'attr') {
          const [attr, val] = content.split('=');
          el.setAttribute(attr.trim(), val.trim());
        }
      });
    }

    // 3. Inject or override JS (runs after script.js is loaded)
    if (js) {
      const script = document.createElement('script');
      script.textContent = js;
      document.body.appendChild(script);
    }
  }

})();
