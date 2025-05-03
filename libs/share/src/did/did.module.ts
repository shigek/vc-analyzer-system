import { Module } from '@nestjs/common';
import { systemDocumentLoader, systemDidResolver } from './document-loader';

const systemDidResolverProvider = {
  provide: 'DID_RESOLVER',
  useFactory: () => {
    return systemDidResolver;
  },
};

const systemDocumentLoaderProvider = {
  provide: 'DOCUMENT_LOADER',
  useFactory: () => {
    return systemDocumentLoader;
  },
  inject: ['DID_RESOLVER'],
};

@Module({
  providers: [systemDidResolverProvider, systemDocumentLoaderProvider],
  exports: [
    systemDidResolverProvider,
    systemDocumentLoaderProvider,
    'DOCUMENT_LOADER',
  ],
})
export class DidModule {}
