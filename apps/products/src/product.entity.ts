import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_products_name')
  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ default: true })
  active!: boolean;
}
