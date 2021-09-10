export interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string,
    lastName: string
  };
  /**
   * Personal services
   */
  services: Array<string>;
  roles: Array<Role>;
  sysadmin: boolean;
  updatedAt: Date;
  KYCStatus: string;

  billing: {
    status: BillingStatus,
    lowBalance: boolean
  };
  subscription?: {
    status: BillingStatus;
    warningCount: boolean
};
}

export interface Role {
  organization: Organization;
  role: string;
  services: Array<ServiceMini>;
}

export enum BillingStatus {
  PAID = 'PAID',
  SUSPENDED = 'SUSPENDED',
  WARNING = 'WARNING',
  TRIAL = 'TRIAL'
}

export interface Organization {
  _id: string;
  domain: string;
  name: string;
  createdBy: string;
  billing: {
    status: BillingStatus,
    warningCount: boolean
  };
  subscription?: {
    status: BillingStatus;
    warningCount: boolean;
};
}

export interface ServiceMini {
  service: string;
  role: string;
}

export interface Current {
  user: User;
  organization: Organization;
  token: string;
  service: string;
}