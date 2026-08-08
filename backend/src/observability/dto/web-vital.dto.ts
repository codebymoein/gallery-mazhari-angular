import {
  IsIn,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const WEB_VITAL_NAMES = ['CLS', 'INP', 'LCP', 'TTFB'] as const;
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

export class WebVitalDto {
  @IsIn(WEB_VITAL_NAMES)
  name!: WebVitalName;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(120_000)
  value!: number;

  @IsString()
  @MaxLength(160)
  @Matches(new RegExp("^/(?:[A-Za-z0-9._~!$&'()*+,;=:@%/-]*|)$"))
  route!: string;

  @IsString()
  @IsIn(['navigate', 'reload', 'back_forward', 'prerender', 'unknown'])
  navigationType!: string;
}
