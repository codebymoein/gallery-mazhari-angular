import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_appearance')
export class SiteAppearanceEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bridalHeroImage: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  accessoryHeroImage: string | null;

  @Column({ type: 'simple-json', nullable: true })
  categoryImages: Record<string, string> | null;

  @Column({ type: 'simple-json', nullable: true })
  subcategoryImages: Record<string, string> | null;

  @Column({ type: 'simple-json', nullable: true })
  categoryOrder: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  subcategoryOrder: Record<string, string[]> | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  consultationImage: string | null;

  @Column({ type: 'simple-json', nullable: true })
  memories: Array<{
    id: string;
    name: string;
    quote: string;
    venue: string;
    image: string;
    span: 'tall' | 'wide' | 'square';
    active: boolean;
  }> | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
