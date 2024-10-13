import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsISO8601, IsNumber } from 'class-validator';

@Entity()
export class TaxPaymentEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsISO8601()
  date!: string;

  @Column()
  @IsNumber()
  amount!: number;
}
