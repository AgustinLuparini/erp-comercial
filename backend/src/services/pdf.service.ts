export class PdfService {
  buildSuppliersPdfPlaceholder(): Buffer {
    return Buffer.from('PDF export requires a PDF generator dependency to be enabled.');
  }
}

export default new PdfService();