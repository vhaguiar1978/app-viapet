function escapeExcelCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeExcelFilename(filename) {
  const safeName = String(filename || "exportacao").trim() || "exportacao";
  return safeName.toLowerCase().endsWith(".xls") ? safeName : `${safeName}.xls`;
}

function normalizeSheetName(sheetName) {
  return String(sheetName || "Planilha")
    .replace(/[\\\/:*?[\]]/g, " ")
    .trim()
    .slice(0, 31) || "Planilha";
}

export function downloadRowsAsExcel(filename, sheetName, headers, rows) {
  const workbookName = normalizeSheetName(sheetName);
  const exportFilename = normalizeExcelFilename(filename);
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  const headMarkup = safeHeaders.map((header) => `<th>${escapeExcelCell(header)}</th>`).join("");
  const bodyMarkup = safeRows.length
    ? safeRows
        .map(
          (row) =>
            `<tr>${(Array.isArray(row) ? row : []).map((cell) => `<td>${escapeExcelCell(cell)}</td>`).join("")}</tr>`,
        )
        .join("")
    : `<tr><td colspan="${Math.max(safeHeaders.length, 1)}">Nenhum dado encontrado.</td></tr>`;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${escapeExcelCell(workbookName)}</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d9d9d9; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f0ff; font-weight: 700; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${headMarkup}</tr>
          </thead>
          <tbody>
            ${bodyMarkup}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
