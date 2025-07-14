import { RowDataPacket } from "mysql2";

export interface SubCategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
}