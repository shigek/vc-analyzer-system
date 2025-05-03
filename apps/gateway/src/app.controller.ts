import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  haldleHello(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    const jsonLd = this.appService.getHello();
    return res.send(jsonLd);
  }
}
