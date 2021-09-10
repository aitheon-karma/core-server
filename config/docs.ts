import { getMetadataArgsStorage } from 'routing-controllers';
const environment = require('../../../../../dist/environment').environment;
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { defaultMetadataStorage } from 'class-transformer/storage';
import { MetadataStorage, getFromContainer } from 'class-validator'; // tslint:disable-line
import * as _ from 'lodash';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as fs from 'fs';
import * as swaggerUi from 'swagger-ui-express';
import * as express from 'express';
import * as path from 'path';
import * as async from 'async';
import { hasDeveloperAccess } from './auth';
import { Container } from 'typedi';

Container.set('environment', environment);

export const init = (app: express.Express, done: Function) => {

  const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas;
  const schemas = validationMetadatasToSchemas(metadatas, {
    refPointerPrefix: '#/components/schemas/',
    classTransformerMetadataStorage: defaultMetadataStorage
  });
  const storage = getMetadataArgsStorage();
  const docsName = `${ environment.project && environment.project.name ? environment.project.name : environment.service.name }`;
  const swaggerDocument = routingControllersToSpec(storage, {}, {
    components: { schemas },
    info: {
      title: `${ docsName } API Documentation`,
      version: '1.0.0'
    }
  });
  const schemasJson = swaggerDocument.components.schemas as any;
  for (const schema in swaggerDocument.components.schemas) {
    for (const property in schemasJson[schema].properties) {
      if (schemasJson[schema].properties[property].enum) {
        schemasJson[schema].properties[property]['x-enum-varnames'] = schemasJson[schema].properties[property].enum;
      }
    }
  }


  saveFile(swaggerDocument, done);

  const options = {
    schemas: schemas,
    customfavIcon: '/users/assets/img/favicon/favicon-32x32.png',
    customSiteTitle: `Aitheon - ${ docsName } - Docs`,
    customCss: `
      .topbar-wrapper img[alt="Swagger UI"], .topbar-wrapper span {
        visibility: collapse;
      }
      .topbar-wrapper .link:after {
        content: ' ';
        background-image: url(/users/assets/img/logo-aitheon-gold.svg);
        background-size: contain;
        height: 40px;
        width: 180px;
        position: absolute;
        background-repeat: no-repeat;
        top: 19px;
      }
      `
  };

  if (app) {
    console.log('Documentation served "/api/docs"');
    app.get('/api/docs', (req, res, next) => {
      if (req.path.substr(-1) !== '/') {
        return res.redirect(301, req.url + '/');
      }
      return next();
    });
    app.use('/api/docs/', swaggerUi.serveWithOptions({ redirect: false }), swaggerUi.setup(swaggerDocument, options));

    app.get('/api/client-docs', express.static(path.resolve('./client/docs')));
    app.use('/api/client-docs', express.static(path.resolve('./client/docs')));
  }

};

const saveFile = async (swaggerDocument: any, done: Function) => {
  const docsPath = 'server/docs';

  async.waterfall([
    (next: any) => { fs.exists(docsPath, (exists: boolean) => next(undefined, exists)); },
    (exists: boolean, next: any) => {
      if (!exists) {
        return fs.mkdir(docsPath, next);
      }
      next();
    },
    (next: any) => {
      fs.writeFile(`${docsPath}/swagger.json`, JSON.stringify(swaggerDocument), next);
    }
  ], (err) => {
    if (err) {
      return console.log('[Docs] save file', err);
    }
    if (done) {
      done();
    }
  });
};