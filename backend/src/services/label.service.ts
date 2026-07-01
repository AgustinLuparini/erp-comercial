export interface LabelData {
  barcode: string;
  name: string;
  price: number;
  code: string;
}

export class LabelService {
  /**
   * Genera datos HTML para impresión de etiquetas
   */
  generateLabelHTML(products: LabelData[]): string {
    const labels = products
      .map((product) => this.createLabelElement(product))
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etiquetas de Productos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .label-sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .label {
            width: 100%;
            background: white;
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .label-barcode { margin: 8px 0; }
          .label-barcode svg { max-width: 100%; height: 40px; }
          .label-name { font-size: 12px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
          .label-price { font-size: 14px; color: #d32f2f; font-weight: bold; margin: 5px 0; }
          .label-code { font-size: 9px; color: #666; margin-top: 5px; }
          @media print {
            body { background: white; padding: 0; }
            .label-sheet { gap: 0; }
            .label { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="label-sheet">
          ${labels}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Crea un elemento de etiqueta individual
   */
  private createLabelElement(product: LabelData): string {
    return `
      <div class="label">
        <div class="label-barcode">
          <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(product.barcode)}&code=Code128&style=137" alt="barcode" />
        </div>
        <div class="label-name">${this.truncate(product.name, 25)}</div>
        <div class="label-price">$${product.price.toFixed(2)}</div>
        <div class="label-code">Cód: ${product.code}</div>
      </div>
    `;
  }

  /**
   * Trunca texto a una longitud máxima
   */
  private truncate(str: string, length: number): string {
    return str.length > length ? str.substring(0, length - 3) + '...' : str;
  }

  /**
   * Genera un archivo CSV con datos de productos
   */
  generateCSV(products: LabelData[]): string {
    const headers = ['Código', 'Código de Barras', 'Nombre', 'Precio'];
    const rows = products.map((p) => [p.code, p.barcode, p.name, p.price]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Genera PDF base64 para etiquetas (requiere librería externa)
   */
  async generatePDF(_products: LabelData[], _format: 'A4' | 'A5' | 'LABEL' = 'A4'): Promise<Buffer> {
    // Aquí se usaría una librería como puppeteer o pdfkit para generar el PDF
    // Por ahora retornamos un error indicando que se necesita implementar
    throw new Error('PDF generation requires additional dependencies (puppeteer/pdfkit)');
  }
}

export default new LabelService();
