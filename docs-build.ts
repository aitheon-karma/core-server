'use strict';

import 'ts-helpers';
// import 'source-map-support/register';
import 'reflect-metadata';
import * as docs from './config/docs';
import { ExpressConfig } from './config/express';
const express = new ExpressConfig();
import Db from './config/db';
Db.init();

docs.init(undefined, () => {
  console.log('Swagger documentation generated');
  process.exit(0);
});