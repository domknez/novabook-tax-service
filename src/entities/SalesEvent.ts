import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { SalesItem } from './SalesItem';
import { IsUUID, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@Entity()
export class SalesEvent {
  @PrimaryColumn()
  @IsUUID()
  invoiceId!: string;

  @Column()
  @IsISO8601()
  date!: string;

  @OneToMany(() => SalesItem, (item) => item.salesEvent, {
    cascade: true,
  })
  @ValidateNested({ each: true })
  @Type(() => SalesItem)
  items!: SalesItem[];
}
