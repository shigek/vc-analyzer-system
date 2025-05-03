import { Injectable } from '@nestjs/common';
import { context } from './context/trusted-list-v1.jsonld';

@Injectable()
export class AppService {
  getHello(): any {
    return context;
  }
}
