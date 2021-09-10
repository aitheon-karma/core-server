import 'ts-helpers';
import { Container } from "typedi";
const environment = require('../../../../../dist/environment').environment;
Container.set('environment', environment);
import { PasswordAuthenticator } from '../config/auth/password-authenticator';
import { SocketsLoader } from './sockets-loader';

function getSockets() {
  try {
    let socketsFolder = './server/sockets';
    if (process.argv.length > 2) {
      socketsFolder = process.argv[2];
    }

    const authenticator = new PasswordAuthenticator();
    const loader = new SocketsLoader(socketsFolder);
    authenticator.authenticate(loader.isTokenAvailable() ? loader.token : undefined)
      .then((token) => {
        loader.token = token;
        loader.downloadSockets();
      })
      .catch(err => console.log('[sockets-loader error]', err.message || err));

  } catch (err) {
    console.log('[Sockets generation failure]', err.message || err);
  }
}

getSockets();