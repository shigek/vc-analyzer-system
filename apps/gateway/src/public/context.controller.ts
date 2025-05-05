import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const CONTEXT_FILE_PATH = path.join(
  __dirname,
  '../../..',
  'contexts',
  'trusted-list-v1.local.jsonld',
);
@Controller('contexts')
export class ContextController {
  constructor() {}
  @Get('trusted-list/v1')
  async handleContextLoader(@Res() res: Response): Promise<any> {
    fs.readFile(CONTEXT_FILE_PATH, 'utf8')
      .then((data) => {
        console.log(
          `Successfully read context file. Serving with Content-Type: application/ld+json`,
        );
        res.setHeader('Content-Type', 'application/ld+json');
        res.status(200).send(data);
      })
      .catch((err) => {
        console.error(
          `Error reading context file "${CONTEXT_FILE_PATH}":`,
          err,
        );
        res.status(404).send('JSON-LD Context not found.');
        return;
      });
  }
}
