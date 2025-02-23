import { IQuickBooksTokens } from "shared";
import { Entity, ObjectIdColumn, Column } from "typeorm";
import { ObjectId } from "mongodb";

@Entity("quickbooks_tokens")
export class QuickBooksTokens implements IQuickBooksTokens {
  public static readonly SINGLETON_ID = process.env
    .QUICKBOOKS_SINGLETON_ID as string;

  @ObjectIdColumn()
  id: ObjectId = new ObjectId(QuickBooksTokens.SINGLETON_ID);

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  expiresIn: number;

  @Column({ nullable: true })
  refreshTokenExpiresIn: number;

  @Column({ nullable: true })
  expiresAt: number;

  @Column({ nullable: true })
  refreshTokenExpiresAt: number;
}
