export enum AUTH_ERRORS {
  AERR_NO_TOKN = 'AERR_NO_TOKN',
  AERR_ACC_ORG = 'AERR_ACC_ORG',
  AERR_NO_USER = 'AERR_NO_USER',
  AERR_ACC_SER = 'AERR_ACC_SER',
  AERR_ACC_ROL = 'AERR_ACC_ROL',
  AERR_INTERNL = 'AERR_INTERNL',
  AERR_PAYMENT_REQUIRED = 'AERR_PAYMENT_REQUIRED'
}

export const AUTH_ERRORS_STATUS_CODES: { [key: string]: number } = {
  [AUTH_ERRORS.AERR_ACC_ROL]: 401,
  [AUTH_ERRORS.AERR_ACC_SER]: 401,
  [AUTH_ERRORS.AERR_NO_TOKN]: 401,
  [AUTH_ERRORS.AERR_ACC_ORG]: 401,
  [AUTH_ERRORS.AERR_NO_USER]: 401,
  [AUTH_ERRORS.AERR_INTERNL]: 401,
  [AUTH_ERRORS.AERR_PAYMENT_REQUIRED]: 402,
};

export default class ErrorService {}

export class CustomAuthError extends Error {
  code: string;

  constructor(message: string, errName: AUTH_ERRORS) {
    super(message);
    this.code = errName;
    this.name = this.constructor.name;
    this.message = message;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorNoToken extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_NO_TOKN);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorNoUser extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_NO_USER);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorAccessOrg extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_ACC_ORG);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorPaymentRequired extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_PAYMENT_REQUIRED);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorAccessService extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_ACC_SER);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorAccessRole extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_ACC_ROL);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorInternal extends CustomAuthError {
  constructor(message: string) {
    super(message, AUTH_ERRORS.AERR_INTERNL);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
