import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";

/** Elements marked print:hidden (upload buttons, delete icons) never appear on paper or in the PDF. */
function isPrintHidden(node: Node) {
  return (
    node instanceof HTMLElement &&
    (node.classList.contains("print:hidden") || node.classList.contains("print-hidden"))
  );
}

/** Run `fn` with the light theme, so printed/exported documents are never dark. */
async function withLightTheme<T>(fn: () => Promise<T>) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  if (wasDark) {
    root.classList.remove("dark");
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }
  try {
    return await fn();
  } finally {
    if (wasDark) root.classList.add("dark");
  }
}

/**
 * Save an element as an A4 PDF.
 * The browser renders the element itself (SVG foreignObject), so every CSS feature
 * the page uses - including Tailwind v4 oklch() colours - comes out exactly as on screen.
 */
export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  await document.fonts.ready;
  const canvas = await withLightTheme(() =>
    toCanvas(el, { pixelRatio: 2, backgroundColor: "#ffffff", filter: (n) => !isPrintHidden(n) }),
  );

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 10;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2;
  let imgW = pageW;
  let imgH = (canvas.height * imgW) / canvas.width;

  // slightly too tall for one page: shrink to fit rather than spill a few lines onto page 2
  if (imgH > pageH && imgH <= pageH * 1.25) {
    imgH = pageH;
    imgW = (canvas.width * imgH) / canvas.height;
  }

  if (imgH <= pageH) {
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      margin + (pageW - imgW) / 2,
      margin,
      imgW,
      imgH,
    );
  } else {
    // long document: cut the canvas into page-height slices
    const slicePx = Math.floor((pageH * canvas.width) / pageW);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    for (let y = 0, page = 0; y < canvas.height; y += slicePx, page++) {
      const h = Math.min(slicePx, canvas.height - y);
      slice.height = h;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, h);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (page > 0) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.95),
        "JPEG",
        margin,
        margin,
        pageW,
        (h * pageW) / canvas.width,
      );
    }
  }
  pdf.save(filename);
}

/**
 * Print only `el` - not the sidebar, top bar or tabs around it.
 * The element is copied into a hidden iframe together with the page's stylesheets.
 * @page margin 0 also removes the browser's date/title/URL header and footer lines.
 */
export async function printElement(el: HTMLElement, title: string) {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("*").forEach((n) => isPrintHidden(n) && n.remove());

  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n) => n.outerHTML)
    .join("\n");

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title>
    ${styles}
    <style>
      @page { size: A4; margin: 0; }
      html, body { background: #fff !important; margin: 0; }
      body { padding: 12mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body>${clone.outerHTML}</body></html>`);
  doc.close();

  const sheetsLoaded = Promise.all(
    [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) =>
      l.sheet ? null : new Promise((r) => ((l.onload = r), (l.onerror = r))),
    ),
  );
  await Promise.race([sheetsLoaded, new Promise((r) => setTimeout(r, 3000))]); // never hang on a slow stylesheet
  await doc.fonts.ready;
  await Promise.all(
    [...doc.images].map((img) =>
      img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))),
    ),
  );

  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 1000);
}
