import * as request from 'request-promise-native';
import * as PromptSync from 'prompt-sync';
import { Container } from 'typedi';
const environment = Container.get<any>('environment');

export const getCurrentByToken = async (token: string, organizationId?: string): Promise<any> => {

  const url = `${environment.authURI}/api/access-token`;
  const options = {
    url: url,
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${token}`,
      'X-Service': environment.service._id,
    },
    json: true
  } as any;

  if (organizationId) {
    options.headers['organization-id'] = organizationId;
  }
  return await request.post(options);
};

export class PasswordAuthenticator {

  constructor() {
    this.origin = `https://${process.env.DOMAIN || 'dev.aitheon.com'}`;
  }

  async authenticate(token?: string): Promise<string> {
    try {

      if (token) {
        try {
          await getCurrentByToken(token);
          return token;
        } catch (err) {
          if (err.statusCode && err.statusCode === 401) {
            console.log('[User authentication]', 'The token is invalid or expired, proceeding to the authentication...');
          } else {
            throw err;
          }
        }
      }

      const credentials = this.requestUserAndPassword();
      console.log(`Authenticating user ${credentials.email}...`);

      const options = {
        headers: {
          'Content-type': 'application/json',
          'Origin': this.origin
        },
        json: true,
        uri: `${environment.authURI}/api/login`,
        body: { email: credentials.email, password: credentials.password }
      };

      const result = await request.post(options);
      if (!result.token) {
        throw new Error(`Token is empty`);
      }
      return result.token;
    } catch (err) {
      console.log(`[User authentication error]`, err.message || err);
      throw err;
    }
  }

  requestUserAndPassword() {
    const prompt = PromptSync({ sigint: true });
    const email = prompt(`Enter Aitheon ${this.origin} user email with developer access: `);
    const password = prompt(`Enter ${email} password: `, { echo: '*' });
    return { email, password };
  }


  private origin: string;
}