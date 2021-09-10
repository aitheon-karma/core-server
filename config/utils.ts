import { Request } from 'express';
import { Current } from './auth/user';
import * as request from 'request-promise-native';
import { getTokenFromRequest } from './auth';
import { logger } from './logger';


interface AclBody {
    user?: string;
    organization?: string;
    service?: {
        _id?: string;
        key?: string;
    };
    public?: boolean;
    level?: string;
}

/**
 * Process current user with call to auth uri with token.
 * @param current current object of user
 * @param req request object
 * @param body body for acl request
 */
export const aclRequest = async (current: Current, req: any, body: { service: string, key: string, public: boolean, level: string }) => {

    try {
        const token = await getTokenFromRequest(req);
        const aclBody: AclBody = {
            user: current.user._id,
            public: body.public,
            service: {
                _id: body.service,
                key: body.key ? body.key : current.organization ? current.organization._id : current.user._id
            },
            level: body.level.toUpperCase()
        };
        const options = {
            url: `https://${process.env.DOMAIN}/drive/api/acl`,
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `JWT ${token}`
            },
            json: true,
            body: {}
        };

        if (current.organization && current.organization._id) {
            aclBody.organization = current.organization._id;
            (options.headers as any)['organization-id'] = current.organization._id;
        }
        options.body = aclBody;
        const result = await request(options);

        return result;

    } catch (err) {
        logger.error('ACL Request failed', err);
    }
};