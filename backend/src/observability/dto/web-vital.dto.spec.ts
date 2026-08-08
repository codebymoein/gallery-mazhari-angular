import { validate } from 'class-validator';
import { WebVitalDto } from './web-vital.dto';

describe('WebVitalDto', () => {
  it('accepts a bounded privacy-safe metric', async () => {
    const dto = Object.assign(new WebVitalDto(), {
      name: 'LCP',
      value: 1842.5,
      route: '/catalog',
      navigationType: 'navigate',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects query strings and unsupported metric names', async () => {
    const dto = Object.assign(new WebVitalDto(), {
      name: 'USER_EMAIL',
      value: 10,
      route: '/catalog?email=test@example.com',
      navigationType: 'navigate',
    });

    const errors = await validate(dto);
    expect(errors.map(error => error.property)).toEqual(
      expect.arrayContaining(['name', 'route']),
    );
  });

  it('rejects negative or unbounded values', async () => {
    const negative = Object.assign(new WebVitalDto(), {
      name: 'CLS',
      value: -1,
      route: '/',
      navigationType: 'reload',
    });
    const excessive = Object.assign(new WebVitalDto(), {
      name: 'LCP',
      value: 999_999,
      route: '/',
      navigationType: 'reload',
    });

    expect((await validate(negative)).some(error => error.property === 'value')).toBe(true);
    expect((await validate(excessive)).some(error => error.property === 'value')).toBe(true);
  });
});
