import BizError from '../error/biz-error.js';
import constant from '../const/constant.js';
import jwtUtils from '../utils/jwt-utils.js';
import KvConst from '../const/kv-const.js';
import dayjs from 'dayjs';
import userService from '../service/user-service.js';
import permService from '../service/perm-service.js';
import { t } from '../i18n/i18n.js'
import app from '../hono.js';

const exclude = [
	'/api/login',
	'/api/register',
	'/api/oss',
	'/api/setting/websiteConfig',
	'/api/webhooks',
	'/api/init',
	'/api/public/genToken',
	'/api/telegram',
	'/api/oauth'
];

const requirePerms = [
	'/api/email/send',
	'/api/email/delete',
	'/api/email/permanent-delete',
	'/api/account/list',
	'/api/account/delete',
	'/api/account/add',
	'/api/my/delete',
	'/api/analysis/echarts',
	'/api/role/add',
	'/api/role/list',
	'/api/role/delete',
	'/api/role/tree',
	'/api/role/set',
	'/api/role/setDefault',
	'/api/allEmail/list',
	'/api/allEmail/delete',
	'/api/allEmail/batchDelete',
	'/api/allEmail/latest',
	'/api/setting/setBackground',
	'/api/setting/deleteBackground',
	'/api/setting/set',
	'/api/setting/query',
	'/api/setting/setBlacklist',
	'/api/user/delete',
	'/api/user/setPwd',
	'/api/user/setStatus',
	'/api/user/setType',
	'/api/user/list',
	'/api/user/restore',
	'/api/user/resetSendCount',
	'/api/user/add',
	'/api/user/deleteAccount',
	'/api/user/allAccount',
	'/api/regKey/add',
	'/api/regKey/list',
	'/api/regKey/delete',
	'/api/regKey/clearNotUse',
	'/api/regKey/history'
];

const premKey = {
	'email:delete': ['/api/email/delete', '/api/email/permanent-delete'],
	'email:send': ['/api/email/send'],
	'account:add': ['/api/account/add'],
	'account:query': ['/api/account/list'],
	'account:delete': ['/api/account/delete'],
	'my:delete': ['/api/my/delete'],
	'role:add': ['/api/role/add'],
	'role:set': ['/api/role/set','/api/role/setDefault'],
	'role:query': ['/api/role/list', '/api/role/tree'],
	'role:delete': ['/api/role/delete'],
	'user:query': ['/api/user/list','/api/user/allAccount'],
	'user:add': ['/api/user/add'],
	'user:reset-send': ['/api/user/resetSendCount'],
	'user:set-pwd': ['/api/user/setPwd'],
	'user:set-status': ['/api/user/setStatus', '/api/user/restore'],
	'user:set-type': ['/api/user/setType'],
	'user:delete': ['/api/user/delete','/api/user/deleteAccount'],
	'all-email:query': ['/api/allEmail/list','/api/allEmail/latest'],
	'all-email:delete': ['/api/allEmail/delete','/api/allEmail/batchDelete'],
	'setting:query': ['/api/setting/query'],
	'setting:set': ['/api/setting/set', '/api/setting/setBackground','/api/setting/deleteBackground','/api/setting/setBlacklist'],
	'analysis:query': ['/api/analysis/echarts'],
	'reg-key:add': ['/api/regKey/add'],
	'reg-key:query': ['/api/regKey/list','/api/regKey/history'],
	'reg-key:delete': ['/api/regKey/delete','/api/regKey/clearNotUse'],
};

app.use('*', async (c, next) => {

	const path = c.req.path;

	// Skip security for non-API routes (frontend static files, SPA, etc.)
	if (!path.startsWith('/api/')) {
		return await next();
	}

	const index = exclude.findIndex(item => {
		return path.startsWith(item);
	});

	if (index > -1) {
		return await next();
	}

	if (path.startsWith('/api/public')) {

		const userPublicToken = await c.env.kv.get(KvConst.PUBLIC_KEY);
		const publicToken = c.req.header(constant.TOKEN_HEADER);
		if (publicToken !== userPublicToken) {
			throw new BizError(t('publicTokenFail'), 401);
		}
		return await next();
	}


	const jwt = c.req.header(constant.TOKEN_HEADER);

	if (!jwt) {
		throw new BizError(t('authExpired'), 401);
	}

	const result = await jwtUtils.verifyToken(c, jwt);

	if (!result) {
		throw new BizError(t('authExpired'), 401);
	}

	const { userId, token } = result;
	const authInfo = await c.env.kv.get(KvConst.AUTH_INFO + userId, { type: 'json' });

	if (!authInfo) {
		throw new BizError(t('authExpired'), 401);
	}

	if (!authInfo.tokens.includes(token)) {
		throw new BizError(t('authExpired'), 401);
	}

	const permIndex = requirePerms.findIndex(item => {
		return path.startsWith(item);
	});

	if (permIndex > -1) {

		const permKeys = await permService.userPermKeys(c, authInfo.user.userId);

		const userPaths = permKeyToPaths(permKeys);

		const userPermIndex = userPaths.findIndex(item => {
			return path.startsWith(item);
		});

		if (userPermIndex === -1 && authInfo.user.email !== c.env.admin) {
			throw new BizError(t('unauthorized'), 403);
		}

	}

	const refreshTime = dayjs(authInfo.refreshTime).startOf('day');
	const nowTime = dayjs().startOf('day')

	if (!nowTime.isSame(refreshTime)) {
		authInfo.refreshTime = dayjs().toISOString();
		await userService.updateUserInfo(c, authInfo.user.userId);
		await c.env.kv.put(KvConst.AUTH_INFO + userId, JSON.stringify(authInfo), { expirationTtl: constant.TOKEN_EXPIRE });
	}

	c.set('user',authInfo.user)

	return await next();
});

function permKeyToPaths(permKeys) {

	const paths = [];

	for (const key of permKeys) {
		const routeList = premKey[key];
		if (routeList && Array.isArray(routeList)) {
			paths.push(...routeList);
		}
	}
	return paths;
}
