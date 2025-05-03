import { Module } from '@nestjs/common';
import { systemDocumentLoader } from './document-loader';

const systemDocumentLoaderProvider = {
  provide: 'DOCUMENT_LOADER',
  useFactory: () => {
    return systemDocumentLoader;
  },
};

@Module({
  providers: [systemDocumentLoaderProvider],
  exports: [systemDocumentLoaderProvider, 'DOCUMENT_LOADER'],
})
export class DidModule {}
