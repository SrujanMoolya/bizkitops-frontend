import { apiClient } from "./api-client";

export type ExportFormat = "xlsx" | "csv" | "json" | "pdf";

export interface ExportSection {
  key: string;
  label: string;
  rows: Record<string, unknown>[];
}

export interface BusinessExport {
  exported_at: string;
  business: Record<string, unknown>;
  sections: ExportSection[];
  skipped: string[];
}

export const getBusinessExport = async (): Promise<BusinessExport> => {
  return apiClient.get("/export");
};

/** Download the whole business in the chosen format. Returns the number of records exported. */
export async function downloadBusinessData(format: ExportFormat): Promise<number> {
  const data = await getBusinessExport();
  const name = `${slug(String(data.business.name ?? "business"))}-data-${data.exported_at.slice(0, 10)}`;
  const total = data.sections.reduce((n, s) => n + s.rows.length, 0);

  if (format === "json") {
    saveBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `${name}.json`,
    );
  } else if (format === "csv") {
    const files = [
      { name: "business.csv", data: utf8(BOM + toCsv(profileRows(data.business))) },
      ...data.sections.map((s) => ({ name: `${s.key}.csv`, data: utf8(BOM + toCsv(s.rows)) })),
    ];
    saveBlob(new Blob([zip(files)], { type: "application/zip" }), `${name}-csv.zip`);
  } else if (format === "xlsx") {
    saveBlob(
      new Blob([toXlsx(data)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${name}.xlsx`,
    );
  } else {
    printHtml(toPrintHtml(data));
  }
  return total;
}

// ---------------------------------------------------------------- helpers

const BOM = "﻿"; // lets Excel open the CSV as UTF-8 (₹, regional names)

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "business"
  );
}

function utf8(s: string) {
  return new TextEncoder().encode(s);
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function profileRows(business: Record<string, unknown>) {
  return Object.entries(business).map(([field, value]) => ({ field, value }));
}

/** Column order = first appearance across all rows. */
function columns(rows: Record<string, unknown>[]) {
  const cols = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) cols.add(k);
  return [...cols];
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function headerText(col: string) {
  return col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------- CSV

function toCsv(rows: Record<string, unknown>[]) {
  const cols = columns(rows);
  const esc = (v: unknown) => {
    let s = cellText(v);
    // stop spreadsheet apps from running text such as "=HYPERLINK(...)" as a formula
    if (typeof v === "string" && /^[=+@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map(headerText).map(esc), ...rows.map((r) => cols.map((c) => esc(r[c])))]
    .map((line) => line.join(","))
    .join("\r\n");
}

// ---------------------------------------------------------------- XLSX

// eslint-disable-next-line no-control-regex -- characters XML 1.0 forbids
const XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function xml(s: string) {
  return s
    .replace(XML_INVALID, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colRef(i: number) {
  let s = "";
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

function sheetXml(header: string[], body: unknown[][]) {
  const cell = (v: unknown, ref: string, style = "") => {
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
    if (typeof v === "boolean") return `<c r="${ref}" t="b"${style}><v>${v ? 1 : 0}</v></c>`;
    const s = cellText(v);
    return s
      ? `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(s)}</t></is></c>`
      : "";
  };
  const rows = [header, ...body].map(
    (r, ri) =>
      `<row r="${ri + 1}">${r.map((v, ci) => cell(v, `${colRef(ci)}${ri + 1}`, ri === 0 ? ' s="1"' : "")).join("")}</row>`,
  );
  const widths = header
    .map((h, ci) => {
      const longest = Math.max(h.length, ...body.slice(0, 200).map((r) => cellText(r[ci]).length));
      return `<col min="${ci + 1}" max="${ci + 1}" width="${Math.min(Math.max(longest + 2, 8), 50)}" customWidth="1"/>`;
    })
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    (widths ? `<cols>${widths}</cols>` : "") +
    `<sheetData>${rows.join("")}</sheetData></worksheet>`
  );
}

function toXlsx(data: BusinessExport) {
  // Excel sheet names: at most 31 characters, none of []:*?/\ and unique ignoring case
  const used = new Set(["summary", "business"]);
  const sheetName = (label: string) => {
    const base = label.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 30 - String(i).length)} ${i}`;
    used.add(name.toLowerCase());
    return name;
  };
  const sheets: { name: string; xml: string }[] = [
    {
      name: "Summary",
      xml: sheetXml(
        ["Section", "Records"],
        [
          ["Business", String(data.business.name ?? "")],
          ["Exported at", new Date(data.exported_at).toLocaleString()],
          ...data.sections.map((s) => [s.label, s.rows.length]),
        ],
      ),
    },
    {
      name: "Business",
      xml: sheetXml(
        ["Field", "Value"],
        Object.entries(data.business).map(([k, v]) => [headerText(k), v]),
      ),
    },
    ...data.sections.map((s) => {
      const cols = columns(s.rows);
      return {
        name: sheetName(s.label),
        xml: cols.length
          ? sheetXml(
              cols.map(headerText),
              s.rows.map((r) => cols.map((c) => r[c])),
            )
          : sheetXml(["No records"], []),
      };
    }),
  ];

  const files = [
    {
      name: "[Content_Types].xml",
      data: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          sheets
            .map(
              (_, i) =>
                `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
            )
            .join("") +
          "</Types>",
      ),
    },
    {
      name: "_rels/.rels",
      data: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          "</Relationships>",
      ),
    },
    {
      name: "xl/workbook.xml",
      data: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
          sheets
            .map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
            .join("") +
          "</sheets></workbook>",
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          sheets
            .map(
              (_, i) =>
                `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
            )
            .join("") +
          `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
          "</Relationships>",
      ),
    },
    {
      // style 1 = bold header with a light grey fill
      name: "xl/styles.xml",
      data: utf8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
          '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
          '<fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill></fills>' +
          '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
          '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
          '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
          '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
          "</styleSheet>",
      ),
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: utf8(s.xml) })),
  ];
  return zip(files);
}

// ---------------------------------------------------------------- ZIP (stored, no compression)

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(d: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; data: Uint8Array }[]) {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const name = utf8(f.name);
    const crc = crc32(f.data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(6, 0x0800, true); // UTF-8 file names
    head.setUint16(8, 0, true); // stored
    head.setUint16(10, time, true);
    head.setUint16(12, date, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, f.data.length, true);
    head.setUint32(22, f.data.length, true);
    head.setUint16(26, name.length, true);
    local.push(new Uint8Array(head.buffer), name, f.data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, time, true);
    dir.setUint16(14, date, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, f.data.length, true);
    dir.setUint32(24, f.data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true);
    central.push(new Uint8Array(dir.buffer), name);

    offset += 30 + name.length + f.data.length;
  }

  const dirSize = central.reduce((n, b) => n + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, dirSize, true);
  end.setUint32(16, offset, true);

  const parts = [...local, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
  let p = 0;
  for (const b of parts) {
    out.set(b, p);
    p += b.length;
  }
  return out;
}

// ---------------------------------------------------------------- PDF (via the browser's print dialog)

function htmlEsc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlTable(rows: Record<string, unknown>[]) {
  if (!rows.length) return '<p class="empty">No records</p>';
  const cols = columns(rows);
  return (
    `<table><thead><tr>${cols.map((c) => `<th>${htmlEsc(headerText(c))}</th>`).join("")}</tr></thead><tbody>` +
    rows
      .map((r) => `<tr>${cols.map((c) => `<td>${htmlEsc(cellText(r[c]))}</td>`).join("")}</tr>`)
      .join("") +
    "</tbody></table>"
  );
}

function toPrintHtml(data: BusinessExport) {
  const title = `${String(data.business.name ?? "Business")} — Data Export`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEsc(title)}</title><style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font: 9px/1.35 system-ui, sans-serif; color: #111; }
    h1 { font-size: 16px; margin: 0 0 2px; } h2 { font-size: 12px; margin: 18px 0 6px; break-after: avoid; }
    .meta, .empty { color: #666; }
    table { border-collapse: collapse; width: 100%; table-layout: auto; }
    th, td { border: 1px solid #ccc; padding: 2px 4px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #eee; } thead { display: table-header-group; } tr { break-inside: avoid; }
  </style></head><body>
    <h1>${htmlEsc(title)}</h1>
    <div class="meta">Exported ${htmlEsc(new Date(data.exported_at).toLocaleString())}</div>
    <h2>Business profile</h2>${htmlTable(profileRows(data.business).map((r) => ({ ...r, field: headerText(r.field) })))}
    ${data.sections.map((s) => `<h2>${htmlEsc(s.label)} (${s.rows.length})</h2>${htmlTable(s.rows)}`).join("")}
  </body></html>`;
}

/** Print from a hidden iframe, so it still works after the async fetch (no popup blocker). */
function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow!.focus();
  setTimeout(() => {
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  }, 250);
}
