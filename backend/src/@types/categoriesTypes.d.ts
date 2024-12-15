import { RowDataPacket } from "mysql2";

export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  img: string | null;
}