import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '../db';

/***
 * Example Type. Data Transfer object type
 */
export type Log = Document & {
  service: string,
  user: string,
  organization: string,
  message: string,
  type: string,
  parseType: string,
  data: any,
  createdAt: Date,
  updatedAt: Date
};

const logSchema = new Schema({
  /**
   * Service Id
   */
  service: {
    type: String,
    default: '',
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
  },
  project: {
    type: Schema.Types.ObjectId,
  },
  organization: {
    type: Schema.Types.ObjectId,
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: [
      'ERROR',
      'WARN',
      'INFO',
      'AUDIT_TRAIL',
      'UNDEFINED'
    ],
    default: 'UNDEFINED'
  },
  parseType: String,
  data: {
    /*  related data to the ParseType.
    *   Push variables/objects onto this object.
    *   Parse will be different for every micro service and will have a log parser if needed.
    */
  }

}, {
    timestamps: true,
    collection: 'fedoralabs__logs'
  });

export const LogSchema = Db.connection.model<Log>('Log', logSchema);