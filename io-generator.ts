'use strict';

import 'ts-helpers';
// import 'source-map-support/register';
import 'reflect-metadata';
import * as path from 'path';
import { Container, Inject } from 'typedi';
const environment = require('../../../../dist/environment').environment;
Container.set('environment', environment);
const transporterLib = require('@aitheon/transporter');
const mongoose = require('mongoose');
import Db from './config/db';

Db.init();

const transportInit = async () => {
  try {
    /**
     * Inner microservices communication via transporter
     */
    const transporter = new transporterLib.TransporterBroker({
        transporterServiceId: `IO_GENERATOR`,
        transporterOptions: environment.rabbitmq,
        validator: null
    });
    transporter.start();

    const serviceIO = transporterLib.MetadataStorage.generateIO();
    const buildId = process.env.BUILD_ID;
    const BuildsSchema = Db.connection.collection('build_server__builds');
    if (buildId) {
      const result = await BuildsSchema.updateOne({ _id: mongoose.Types.ObjectId(buildId) }, { $set: { transporter: serviceIO } });
    } else {
      console.warn('IO generation not saved, no BUILD_ID in env');
    }

    console.log('IO saved');
    process.exit(0);
  } catch (err) {
    console.error('[IO Error]', err);
    process.exit(1);
  }

};

transportInit();
