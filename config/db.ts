import * as mongoose from 'mongoose';
import { Container } from 'typedi';
const environment = Container.get<any>('environment');

/**
 * Database manager
 */
class Db {

  connection: mongoose.Connection;

  constructor() {
    this.init();
  }

  /**
   * Create connection and connect to DB from environment
   */
  init() {
    const dbUri = environment.db.uri;
    const options = {
      reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
      reconnectInterval: 500, // Reconnect every 500ms
      poolSize: 10, // Maintain up to 10 socket connections
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    };

    try {
      this.connection = mongoose.createConnection(dbUri, options);
      this.connection.once('open', () => {
        console.log('[DB] MongoDB opened');
        this.connection.on('disconnected', () => {
          console.log('[DB] disconnected');
        });
        this.connection.on('reconnected', () => {
          console.log('[DB] reconnected');
        });
        this.connection.on('error', function(err) {
          console.log('[DB] event error: ' + err);
        });
      });
    } catch (err) {
      console.log('[DB] MongoDB connection error. Please make sure MongoDB is running.', err);
      process.exit(0);
    }
  }
}

const db = new Db();
Container.set('Db', db);

export default db;
