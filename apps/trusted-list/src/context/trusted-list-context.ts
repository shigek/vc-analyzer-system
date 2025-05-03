import { context } from './context';
import { constants } from './constants';

const { CONTEXT_URL, DID_CONTEXT_URL } = constants;

const contexts = new Map();
contexts.set(CONTEXT_URL, context);
export const trastedListContext = contexts;
