import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { IsUUID, IsISO8601, IsNumber } from 'class-validator'

@Entity()
export class Amendment {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  @IsISO8601()
  date!: string

  @Column()
  @IsUUID()
  invoiceId!: string

  @Column()
  @IsUUID()
  itemId!: string

  @Column()
  @IsNumber()
  cost!: number

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  @IsNumber()
  taxRate!: number
}
