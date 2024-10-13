import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesEvent } from './SalesEvent';
import { IsUUID, IsNumber } from 'class-validator';

@Entity()
export class SalesItem {
  @PrimaryColumn()
  @IsUUID()
  itemId!: string;

  @Column()
  @IsNumber()
  cost!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  @IsNumber()
  taxRate!: number;

  @ManyToOne(() => SalesEvent, (salesEvent) => salesEvent.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId', referencedColumnName: 'invoiceId' })
  salesEvent!: SalesEvent;
}
