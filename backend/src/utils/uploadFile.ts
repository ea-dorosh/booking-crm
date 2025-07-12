import multer, { StorageEngine } from 'multer';
import path from 'path';
import {
  CustomRequestType,
} from '@/@types/expressTypes.js';

const storage: StorageEngine = multer.diskStorage({
  destination: (req: CustomRequestType, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'public/images');
  },
  filename: (req: CustomRequestType, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

export { upload };