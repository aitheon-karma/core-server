import * as request from 'request-promise-native';
import { promises as fs, readFileSync, existsSync } from 'fs';
import { join } from 'path';


class SocketsList {
  language: string;
  groupId: string;
  groupName: string;
  version: number;
  filesList: string[];
}

class SocketGroupInfo {
  groupName: string;
  version: number;
  useLatest: boolean;
}

export class SocketsLoader {

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.socketGroupsList = JSON.parse(readFileSync(join(rootDir, SocketsLoader.SOCKETS_FILE_NAME), 'utf8'));
    const jwtFile = join(rootDir, SocketsLoader.JWT_FILE_NAME);
    if (existsSync(jwtFile)) {
      this._token = readFileSync(jwtFile, 'utf8');
    }
  }

  async downloadSockets() {
    for (let i = 0; i < this.socketGroupsList.length; i++) {
      try {
        const resultVersion = await this.getSocketGroupFiles(this.socketGroupsList[i]);
        this.socketGroupsList[i].version = resultVersion;
      } catch (err) {
        console.log(`[Downloading ${SocketsLoader.LANGUAGE} files for socket '${this.socketGroupsList[i].groupName}' error]`, err.message || err);
      }
    }

    await fs.writeFile(join(this.rootDir, SocketsLoader.SOCKETS_FILE_NAME), JSON.stringify(this.socketGroupsList));
  }

  async getSocketGroupFiles(groupInfo: SocketGroupInfo): Promise<number> {
    const uri = `/api/sockets/groups/by/${groupInfo.groupName}/languages/${SocketsLoader.LANGUAGE}`;
    const socketsList: SocketsList = await this.get(uri);

    if ((groupInfo.version < socketsList.version && groupInfo.useLatest) ||
      (groupInfo.version === socketsList.version && !existsSync(join(this.rootDir, groupInfo.groupName)))) {

      console.log(`Downloading ${SocketsLoader.LANGUAGE} files for socket group '${socketsList.groupId}'-'${socketsList.groupName}'-'v${socketsList.version}'`);
      await fs.mkdir(join(this.rootDir, groupInfo.groupName), { recursive: true });
      for (const fileName of socketsList.filesList) {
        this.downloadSocketFile(socketsList.groupId, socketsList.groupName, fileName)
          .catch(err => console.log(`[Downloading file ${fileName} failed]`, err.message || err));
      }
      return socketsList.version;

    } else if (groupInfo.version < socketsList.version && !groupInfo.useLatest) {
      console.log(`Socket group '${groupInfo.groupName}'-'v${groupInfo.version}' is not available anymore. \
Set useLatest=true or version=${socketsList.version} to update.`);
    } else if (groupInfo.version > socketsList.version) {
      console.log(`Socket group '${groupInfo.groupName}'-'v${groupInfo.version}' is not available yet. \
To use the latest version set useLatest=true and the version >= 0 and <= ${socketsList.version}.`);
    } else {
      console.log(`Socket group '${groupInfo.groupName}'-'v${groupInfo.version} is up to date.`);
    }

    return groupInfo.version;
  }

  async downloadSocketFile(groupId: string, groupName: string, fileName: string) {
    console.log(`Downloading and writing file ${fileName}...`);
    const uri = `/api/sockets/groups/${groupId}/languages/${SocketsLoader.LANGUAGE}/${fileName}`;
    let file = await this.get(uri);
    if (typeof file === 'object') {
        file = JSON.stringify(file, null, 2);
    }
    await fs.writeFile(join(this.rootDir, groupName, fileName), file);
  }

  isTokenAvailable(): boolean {
    return this._token !== undefined && this._token !== null && this._token !== '';
  }

  get token() {
    return this._token;
  }

  set token(token: string) {
    if (this._token === token) {
      return;
    }
    this._token = token;
    fs.writeFile(join(this.rootDir, SocketsLoader.JWT_FILE_NAME), token).catch(err => console.log('[Save token error]', err.message || err));
  }

  private async get(uri: string) {
    const options = {
      headers: {
        'Content-type': 'application/json',
        'Authorization': `JWT ${this.token}`
      },
      json: true,
      uri: `${this.baseUri}${uri}`,
    };
    return await request.get(options);
  }

  private _token: string;
  private rootDir: string;
  private socketGroupsList: SocketGroupInfo[];
  private baseUri = `https://${process.env.DOMAIN || 'dev.aitheon.com'}/system-graph`;

  private static LANGUAGE = 'TYPESCRIPT';
  private static JWT_FILE_NAME = 'jwt.token';
  private static SOCKETS_FILE_NAME = 'sockets.json';
}