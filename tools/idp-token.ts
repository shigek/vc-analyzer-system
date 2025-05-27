import { BaseClient, Issuer } from 'openid-client';
import axios from 'axios';

const IDP_ISSUER = 'https://scramberry-suite-sandbox.nttdata-fintech.io/auth/realms/Scramberry-Suite-Sandbox';


const username = process.env.username;
const password = process.env.password;
const scope = process.env.scope;
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;;

(async () => {
  try {
    const config: Issuer<BaseClient> = await Issuer.discover(IDP_ISSUER);
    config.token
    console.log(config.metadata.token_endpoint);
  } catch (e) {
    console.error("error", e);
  }
})();

