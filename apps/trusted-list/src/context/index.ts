import { context } from './context';
import { constants } from './constants';
const { CONTEXT_URL, TRUSTED_LIST_CONTEXT_URL } = constants;
const CONTEXT_URL_V1 = CONTEXT_URL;
const CONTEXT = context;
const contexts = new Map();
contexts.set(CONTEXT_URL, context);

export {
  constants,
  contexts,
  TRUSTED_LIST_CONTEXT_URL,
  CONTEXT_URL,
  CONTEXT_URL_V1,
  CONTEXT,
};
