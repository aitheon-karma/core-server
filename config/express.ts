import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as healthcheck from 'healthcheck-middleware';
import * as compression from 'compression';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
const environment = require('../../../../../dist/environment').environment;
Container.set('environment', environment);
import * as auth from './auth';
import * as hbs from 'express-hbs';
import * as cookieParser from 'cookie-parser';
import * as _ from 'lodash';
import * as fs from 'fs';

export class ExpressConfig {

  app: express.Express;

  constructor(options: { bodyLimit?: string, initDefaultRoutes?: boolean} = { bodyLimit: '1mb', initDefaultRoutes: true }) {
    this.app = express();

    // setupLogging(this.app);

    this.app.use(bodyParser.json({ limit: options.bodyLimit || '1mb' }));
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(compression());

    this.app.engine('html', hbs.express4({
      extname: '.html'
    }));
    this.app.set('view engine', '.html');
    // TODO: change to dist it later
    this.app.set('views', path.resolve('./server'));
    this.app.use(cookieParser());
    this.app.use('/api/health', healthcheck());

    const initDefaultRoutes = options.initDefaultRoutes === undefined ? true : options.initDefaultRoutes;
    if (initDefaultRoutes) {
      /*
       * Angular HTML5 mode
       * Catch all other routes and return the index file
      */
      this.app.get('/', (req, res) => this.serveIndex(req, res));

      this.app.use(express.static(path.resolve('./client/dist/app')));

      // Point static path to dist
      this.app.get('/api', (req, res) => {
        const indexPath = path.resolve('./client/dist/app/index.html');
        fs.exists(indexPath, (clientExists: boolean) => {
          return this.sendServerInfo(res, clientExists);
        });
      });

      this.app.get(/^\/(?!api).*/, (req, res) => this.serveIndex(req, res));
    }

    this.setupControllers();
  }

  sendServerInfo(res: any, clientExists: boolean) {
    const serverInfo = {
      time: new Date(),
      clientExists: clientExists
    } as any;
    if (environment.project && environment.project._id) {
      serverInfo.project = { _id: environment.project._id, name: environment.project.name };
    } else {
      serverInfo.service = `${ environment.service._id } service`;
    }

    res.set('Content-type', 'application/json');
    return res.send(JSON.stringify(serverInfo, undefined, 2));
  }

  serveIndex(req: any, res: any) {
    // X-BASE-HREF
    const indexPath = path.resolve('./client/dist/app/index.html');
    fs.exists(indexPath, (clientExists: boolean) => {
      if (req.headers['X-BASE-HREF'.toLowerCase()]) {
        const xBasePath = req.headers['X-BASE-HREF'.toLowerCase()] || '/';
        if (!clientExists) {
          return this.sendServerInfo(res, clientExists);
        }
        fs.readFile(indexPath, 'utf8', (err: any, text: string) => {
          text = text.replace('<base href="/">', `<base href="${ xBasePath }">`);
          res.set('Content-Type', 'text/html');
          res.send(new Buffer(text));
        });
      } else {
        if (clientExists) {
          return res.sendFile(indexPath);
        }
        return this.sendServerInfo(res, clientExists);
      }
    });
  }


  setupControllers() {
    const rootPath = path.resolve('./dist');

    const corsConfig = {
      origin: function(origin: string, callback: any) {
        // tslint:disable-next-line:no-null-keyword
        callback(null, true);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept', 'organization-id', 'organization-domain', 'X-Service'],
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
    };

    useContainer(Container);
    useExpressServer(this.app, {
      authorizationChecker: auth.authorizationChecker,
      currentUserChecker: auth.currentUserChecker,
      middlewares: [`${ rootPath }/modules/**/*.middleware.js`],
      interceptors: [`${ rootPath }/modules/**/*.interceptor.js`],
      controllers: [`${ rootPath }/modules/**/*.controller.js`],
      defaultErrorHandler: false,
      cors: process.env.ENABLE_CORS ? corsConfig : false
    });
  }

}