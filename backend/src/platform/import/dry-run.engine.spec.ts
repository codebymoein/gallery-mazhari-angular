import { suggestColumnMapping } from './column-mapper';
import { runExcelDryRun } from './dry-run.engine';

describe('column-mapper + dry-run', () => {
  it('suggests Persian accounting headers', () => {
    const s = suggestColumnMapping([
      'کد کالا',
      'نام کالا',
      'طبقه / زیردسته',
      'موجودی',
      'بارکد',
      'سایز',
    ]);
    expect(s.mapping.productCode).toBe('کد کالا');
    expect(s.mapping.inventory).toBe('موجودی');
    expect(s.confidence).toBeGreaterThan(0.5);
  });

  it('dry run counts new/updated/unchanged and does not mutate', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'طبقه / زیردسته', 'موجودی', 'قیمت'],
      rows: [
        {
          'کد کالا': 'GM-1',
          'نام کالا': 'تاج',
          'طبقه / زیردسته': 'تاج عروس',
          موجودی: '3',
          قیمت: '1000',
        },
        {
          'کد کالا': 'GM-2',
          'نام کالا': 'کفش',
          'طبقه / زیردسته': 'کفش',
          موجودی: '1',
          قیمت: '2000',
        },
      ],
      existing: [
        {
          code: 'GM-1',
          name: 'تاج',
          stock: 3,
          price: 1000,
          category: 'تاج عروس',
        },
      ],
    });

    expect(report.totalRows).toBe(2);
    expect(report.validRows).toBe(2);
    expect(report.newProducts).toBe(1);
    expect(report.unchangedProducts).toBe(1);
    expect(report.commitRows).toHaveLength(2);
  });

  it('detects duplicate product codes and barcodes', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'بارکد'],
      rows: [
        { 'کد کالا': 'A', 'نام کالا': '1', موجودی: '1', بارکد: 'B1' },
        { 'کد کالا': 'A', 'نام کالا': '2', موجودی: '1', بارکد: 'B1' },
      ],
      existing: [],
    });
    expect(report.duplicateProductCodes).toContain('A');
    expect(report.duplicateBarcodes).toContain('B1');
  });

  it('flags stale inventory for review', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'قیمت'],
      rows: [{ 'کد کالا': 'A', 'نام کالا': '1', موجودی: '5', قیمت: '1000' }],
      existing: [
        {
          code: 'A',
          name: '1',
          stock: 9,
          inventoryUpdatedAt: '2026-07-28T12:00:00.000Z',
        },
      ],
      sourceTimestamp: '2026-07-01T00:00:00.000Z',
    });
    expect(report.conflictingInventory.length).toBe(1);
  });

  it('counts missing product codes', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی'],
      rows: [{ 'کد کالا': '', 'نام کالا': 'x', موجودی: '1' }],
      existing: [],
    });
    expect(report.missingProductCodes).toBe(1);
    expect(report.invalidRows).toBe(1);
  });

  it('sets canCommit false when duplicates block import', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'بارکد'],
      rows: [
        { 'کد کالا': 'A', 'نام کالا': '1', موجودی: '1', بارکد: 'B1' },
        { 'کد کالا': 'A', 'نام کالا': '2', موجودی: '1', بارکد: 'B1' },
      ],
      existing: [],
    });
    expect(report.canCommit).toBe(false);
    expect(report.blockingErrorCount).toBeGreaterThan(0);
  });

  it('sets canCommit true for clean file', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'قیمت'],
      rows: [{ 'کد کالا': 'Z9', 'نام کالا': 'تور', موجودی: '2', قیمت: '1000' }],
      existing: [],
      confirmUncertainMapping: true,
    });
    expect(report.validRows).toBe(1);
    expect(report.blockingErrorCount).toBe(0);
    expect(report.canCommit).toBe(true);
  });

  it('blocks an in-stock row without an authoritative rial price', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'قیمت'],
      rows: [
        { 'کد کالا': 'NO-PRICE', 'نام کالا': 'تاج', موجودی: '2', قیمت: '' },
      ],
      existing: [],
      confirmUncertainMapping: true,
    });
    expect(report.validRows).toBe(0);
    expect(report.canCommit).toBe(false);
    expect(
      report.issues.some((issue) => issue.codeKey === 'invalid_price'),
    ).toBe(true);
  });

  it('supports the warehouse snapshot format and excludes out-of-stock rows', () => {
    const report = runExcelDryRun({
      headers: [
        'شناسه کالا',
        'نام کالا',
        'طبقه کالا',
        'رنگ',
        'سايز',
        'بارکد کالا',
        'موجودي',
        'قيمت فروش',
      ],
      rows: [
        {
          'شناسه کالا': '10367',
          'نام کالا': 'کفش سوفیا',
          'طبقه کالا': 'زنانه/کفش /10 سانت',
          رنگ: 'سفید',
          سايز: '36',
          'بارکد کالا': '10367001036',
          موجودي: '2',
          'قيمت فروش': '11750000',
        },
        {
          'شناسه کالا': '10367',
          'نام کالا': 'کفش سوفیا',
          'طبقه کالا': 'زنانه/کفش /10 سانت',
          رنگ: 'سفید',
          سايز: '37',
          'بارکد کالا': '10367001037',
          موجودي: '1',
          'قيمت فروش': '11750000',
        },
        {
          'شناسه کالا': '99999',
          'نام کالا': 'ناموجود',
          'طبقه کالا': 'متفرقه',
          'بارکد کالا': '99999000000',
          موجودي: '0',
        },
      ],
      existing: [],
      confirmUncertainMapping: true,
    });

    expect(report.excludedOutOfStockRows).toBe(1);
    expect(report.validRows).toBe(2);
    expect(report.invalidRows).toBe(0);
    expect(report.duplicateProductCodes).toEqual([]);
    expect(report.parentProducts).toBe(1);
    expect(report.variations).toBe(2);
    expect(report.commitRows.every((row) => row.parentCode === '10367')).toBe(
      true,
    );
    expect(report.commitRows.map((row) => row.code)).toEqual([
      '10367001036',
      '10367001037',
    ]);
  });

  it('marks products new only relative to the immediately previous file', () => {
    const base = {
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'قیمت'],
      existing: [],
      confirmUncertainMapping: true,
    };
    const report = runExcelDryRun({
      ...base,
      rows: [
        {
          'کد کالا': 'OLD',
          'نام کالا': 'کفش قدیمی',
          موجودی: '2',
          قیمت: '1000',
        },
        { 'کد کالا': 'NEW', 'نام کالا': 'تاج جدید', موجودی: '1', قیمت: '2000' },
      ],
      previousInStockProductCodes: ['OLD'],
    });

    expect(report.newProducts).toBe(1);
    expect(
      report.commitRows.find((row) => row.code === 'NEW')?.changeType,
    ).toBe('new');
    expect(
      report.commitRows.find((row) => row.code === 'OLD')?.changeType,
    ).not.toBe('new');
  });

  it('reports trashed products as suppressed instead of new', () => {
    const report = runExcelDryRun({
      headers: ['کد کالا', 'نام کالا', 'موجودی', 'قیمت'],
      rows: [
        {
          'کد کالا': 'TRASH-1',
          'نام کالا': 'کالای ردشده',
          موجودی: '8',
          قیمت: '3000',
        },
      ],
      existing: [
        {
          code: 'TRASH-1',
          name: 'کالای ردشده',
          stock: 0,
          status: 'rejected',
        },
      ],
      previousInStockProductCodes: [],
      confirmUncertainMapping: true,
    });

    expect(report.suppressedProductCodes).toEqual(['TRASH-1']);
    expect(report.newProducts).toBe(0);
  });
});
