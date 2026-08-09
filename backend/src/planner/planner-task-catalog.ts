export enum CeremonyType {
  WEDDING = 'wedding',
  AGHD = 'aghd',
  ENGAGEMENT = 'engagement',
  BALE_BOROON = 'bale-boroon',
  FORMALITY = 'formality',
}

export type PlannerTaskGroup = 'foundation' | 'style' | 'final';
export type PlannerAction =
  | { kind: 'catalog'; target: 'bridal' | 'accessories' }
  | { kind: 'consultation' };

export interface PlannerTaskDefinition {
  id: string;
  title: string;
  description: string;
  group: PlannerTaskGroup;
  daysBefore: number;
  ceremonyTypes?: CeremonyType[];
  action?: PlannerAction;
}

export const PLANNER_TASK_CATALOG: readonly PlannerTaskDefinition[] = [
  {
    id: 'define-style-direction',
    title: 'استایل کلی مراسم را مشخص کنید',
    description:
      'فرم لباس، حس مراسم و اولویت‌های اصلی را قبل از خریدهای بزرگ مشخص کنید.',
    group: 'foundation',
    daysBefore: 180,
  },
  {
    id: 'book-bridal-consultation',
    title: 'مشاوره انتخاب لباس را رزرو کنید',
    description:
      'برای بررسی فرم، زمان‌بندی پرو و انتخاب مدل مناسب یک جلسه تخصصی رزرو کنید.',
    group: 'foundation',
    daysBefore: 150,
    action: { kind: 'consultation' },
  },
  {
    id: 'choose-bridal-look',
    title: 'لباس اصلی را انتخاب کنید',
    description:
      'مدل‌های مناسب را مقایسه و انتخاب اصلی را برای ادامه پروها نهایی کنید.',
    group: 'style',
    daysBefore: 120,
    ceremonyTypes: [
      CeremonyType.WEDDING,
      CeremonyType.AGHD,
      CeremonyType.FORMALITY,
    ],
    action: { kind: 'catalog', target: 'bridal' },
  },
  {
    id: 'choose-engagement-look',
    title: 'استایل نامزدی را انتخاب کنید',
    description:
      'لباس و جزئیات هماهنگ با فضای مراسم نامزدی را نهایی کنید.',
    group: 'style',
    daysBefore: 90,
    ceremonyTypes: [CeremonyType.ENGAGEMENT],
    action: { kind: 'catalog', target: 'bridal' },
  },
  {
    id: 'choose-veil-hair-accessories',
    title: 'تور و اکسسوری مو را هماهنگ کنید',
    description:
      'تور، تاج یا ریسه را با فرم لباس و مدل مو هماهنگ کنید.',
    group: 'style',
    daysBefore: 75,
    action: { kind: 'catalog', target: 'accessories' },
  },
  {
    id: 'choose-shoes-jewelry',
    title: 'کفش و زیورآلات را نهایی کنید',
    description:
      'راحتی، ارتفاع کفش و هماهنگی زیورآلات با لباس را هم‌زمان بررسی کنید.',
    group: 'style',
    daysBefore: 60,
    action: { kind: 'catalog', target: 'accessories' },
  },
  {
    id: 'review-bale-boroon-details',
    title: 'جزئیات بله‌برون را کامل کنید',
    description:
      'اقلام و جزئیات مربوط به بله‌برون را یک‌جا مرور و تکمیل کنید.',
    group: 'style',
    daysBefore: 45,
    ceremonyTypes: [CeremonyType.BALE_BOROON],
    action: { kind: 'catalog', target: 'accessories' },
  },
  {
    id: 'final-fitting',
    title: 'پرو نهایی را انجام دهید',
    description:
      'فیت لباس، قد، کفش و جزئیات نهایی را با هم بررسی کنید.',
    group: 'final',
    daysBefore: 21,
    action: { kind: 'consultation' },
  },
  {
    id: 'complete-emergency-kit',
    title: 'کیت روز مراسم را آماده کنید',
    description:
      'اقلام ضروری کوچک برای لباس، آرایش و اکسسوری را از قبل کنار بگذارید.',
    group: 'final',
    daysBefore: 7,
  },
  {
    id: 'final-look-check',
    title: 'استایل کامل را یک‌بار مرور کنید',
    description:
      'لباس، تور، کفش، اکسسوری و زمان تحویل را در یک مرور نهایی چک کنید.',
    group: 'final',
    daysBefore: 3,
  },
];

export function taskAppliesToCeremonies(
  task: PlannerTaskDefinition,
  ceremonyTypes: readonly CeremonyType[],
): boolean {
  if (!task.ceremonyTypes?.length) return true;
  return task.ceremonyTypes.some((type) => ceremonyTypes.includes(type));
}
