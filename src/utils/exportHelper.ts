export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string | number;
}

export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[]
): boolean {
  try {
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado disponível para exportação');
    }

    const header = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(';');
    
    const rows = data.map((row) =>
      columns
        .map((col) => {
          let val: unknown = row[col.key as keyof T];
          if (col.format) {
            val = col.format(val, row);
          }
          if (val === null || val === undefined) {
            val = '';
          }
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    );

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Falha na exportação CSV:', err);
    return false;
  }
}

export function exportToPdf(options: {
  title: string;
  subtitle?: string;
  dataSummary?: Record<string, string | number>;
  tableHeaders?: string[];
  tableRows?: Array<Array<string | number>>;
}): boolean {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return true;
    }

    const summaryHtml = options.dataSummary
      ? `
        <div style="display: flex; gap: 24px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          ${Object.entries(options.dataSummary)
            .map(
              ([label, val]) => `
              <div>
                <span style="display: block; font-size: 11px; color: #64748b; text-transform: uppercase;">${label}</span>
                <strong style="font-size: 16px; color: #0f172a;">${val}</strong>
              </div>
            `
            )
            .join('')}
        </div>
      `
      : '';

    const tableHtml =
      options.tableHeaders && options.tableRows
        ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              ${options.tableHeaders.map((h) => `<th style="padding: 8px 12px; border: 1px solid #cbd5e1;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${options.tableRows
              .map(
                (row) => `
              <tr>
                ${row.map((cell) => `<td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${cell}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
        : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${options.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; }
            h1 { font-size: 22px; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 13px; color: #64748b; margin: 0 0 20px 0; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${options.title}</h1>
          ${options.subtitle ? `<p>${options.subtitle} — Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>` : ''}
          ${summaryHtml}
          ${tableHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);

    return true;
  } catch (err) {
    console.error('Falha na geração do PDF:', err);
    return false;
  }
}
