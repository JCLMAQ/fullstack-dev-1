import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';
import { FileResponse } from './files.controller';

export const editFileName = (req: Request, file: FileResponse , callback: (arg0: any, arg1: string) => void) => {
  // Add a random 10 number to the uploaded file name
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 10).toString(10))
    .join('');
  callback(null, `${name}${randomName}${fileExtName}`);
};

// Allow only images
export const imageFileFilter = (req: Request, file: FileResponse, callback: (arg0: HttpException, arg1: boolean) => void) => {
  // const listOfExtensions = "\.(jpg|jpeg|png|gif)$"
  // for the regex to work with the const .env var: scratch the first and the last /

  const listOfExtensions = process.env['IMAGES_EXTENSIONS_REGEX'];
  if (!file.originalname.match(`${listOfExtensions}`)) {
  // if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};

export const fileFileFilter = (req: Request, file: FileResponse, callback: (arg0: HttpException, arg1: boolean) => void) => {
  // const listOfExtensions = "\.(pdf|doc|docx|xlsx|xls|txt)$"
  // for the regex to work with the const .env var: scratch the first and the last /
  const listOfExtensions = process.env['FILES_EXTENSIONS_REGEX'];
  if (!file.originalname.match(`${listOfExtensions}`)) {
  // if (!file.originalname.match(/\.(pdf|doc|docx|xlsx|xls|txt)$/)) {
    return callback(
      new HttpException(
        'Only some types of files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};

export const destinationFilePath = (req: Request, file: any, callback: (arg0: any, arg1: string) => void) => {
  const storagePath = process.env.FILES_STORAGE_DEST;
  const valueCallBack = storagePath; //'./uploadedfiles'
  callback(null, valueCallBack);
};

export const destinationImagePath = (req: Request, file: any, callback: (arg0: any, arg1: string) => void) => {
  const storagePath = process.env.IMAGES_STORAGE_DEST;
  const valueCallBack =storagePath // './uploadedimages'
  callback(null, valueCallBack);
};

export const fileMaxSize = (req: Request, file: any, callback: (arg0: any, arg1: string) => void) => {
  const fileMaxSize = process.env.FILES_MAX_SIZE;
  const valueCallBack =fileMaxSize // './uploadedimages'
  callback(null, valueCallBack);
};

export const imageMaxSize = (callback: (arg0: string) => void) => {
  const imageMaxSize = process.env.IMAGES_MAX_SIZE;
  const valueCallBack = imageMaxSize;
  callback(valueCallBack);
};
