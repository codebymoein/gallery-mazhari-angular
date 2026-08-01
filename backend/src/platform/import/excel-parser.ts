import * as XLSX from 'xlsx';
import { fingerprintHeaders } from './column-mapper';

export interface ParsedWorkbook {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  headerFingerprint: string;
}

/**
 * Safely read first sheet of an Excel/CSV buffer.
 */
export function parseExcelBuffer(buffer: Buffer): ParsedWorkbook {
  if (!buffer?.length) {
    throw new Error('empty_file');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: false,
      raw: false,
    });
  } catch {
    throw new Error('corrupt_excel');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('no_sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (!matrix.length) {
    throw new Error('empty_sheet');
  }

  const headerRow = matrix[0].map((c) => String(c ?? '').trim());
  const headers = headerRow.filter(
    (h, i) => h || headerRow.some((x, j) => j > i && x),
  );
  // Keep positional headers even if some empty — use col_N
  const finalHeaders = headerRow.map((h, i) => h || `__col_${i}`);

  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r] || [];
    const obj: Record<string, unknown> = {};
    let empty = true;
    for (let c = 0; c < finalHeaders.length; c++) {
      const val = String(cells[c] ?? '').trim();
      if (val) empty = false;
      obj[finalHeaders[c]] = val;
    }
    if (!empty) rows.push(obj);
  }

  return {
    sheetName,
    headers: finalHeaders,
    rows,
    headerFingerprint: fingerprintHeaders(finalHeaders),
  };
}

export { fingerprintHeaders };
