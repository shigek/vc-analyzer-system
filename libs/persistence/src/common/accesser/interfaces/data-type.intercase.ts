export interface DataAccesser {
  contains(options: any): Promise<boolean>;
  getCache(): Promise<any>;
  getValue(options: any): Promise<any>;
  putValue(options: any): Promise<any>;
  updateValue(options: any): Promise<any>;
  removeValue(options: any): Promise<void>;
  loadToCache(options: any): Promise<void>;
  saveFromCache(options: any): Promise<void>;
}
