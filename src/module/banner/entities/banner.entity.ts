import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('banners')
export class Banner {

  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'image_path',
    nullable: true,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => {
        const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://yourbaseurl.com';
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
        }
        return `${baseUrl}${value}`;
      },
    },
  })
  imagePath: string;

  @Column({ nullable: true })
  link: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}