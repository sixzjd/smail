import orm from '../entity/orm.js';
import { star } from '../entity/star.js';
import emailService from './email-service.js';
import BizError from '../error/biz-error.js';
import { and, desc, eq, lt, sql, inArray } from 'drizzle-orm';
import email from '../entity/email.js';
import { isDel } from '../const/entity-const.js';
import attService from "./att-service.js";
import { t } from '../i18n/i18n.js'
const starService = {

	async add(c, params, userId) {
		const { emailId } = params;
		const email = await emailService.selectById(c, emailId);
		if (!email) {
			throw new BizError(t('starNotExistEmail'));
		}
		if (email.userId !== userId) {
			throw new BizError(t('starNotExistEmail'));
		}
		const exist = await orm(c).select().from(star).where(
			and(
				eq(star.userId, userId),
				eq(star.emailId, emailId)))
			.get()

		if (exist) {
			return
		}

		await orm(c).insert(star).values({ userId, emailId }).run();
	},

	async cancel(c, params, userId) {
		const { emailId } = params;
		await orm(c).delete(star).where(
			and(
				eq(star.userId, userId),
				eq(star.emailId, emailId)))
			.run();
	},

	async list(c, params, userId) {
		let { emailId, size } = params;
		emailId = Number(emailId);
		size = Number(size);

		if (!emailId) {
			emailId = 9999999999;
		}

		const list = await orm(c).select({
			isStar: sql`1`.as('isStar'),
			starId: star.starId
			, ...email
		}).from(star)
			.leftJoin(email, eq(email.emailId, star.emailId))
			.where(
				and(
					eq(star.userId, userId),
					eq(email.isDel, isDel.NORMAL),
					lt(star.emailId, emailId)))
			.orderBy(desc(star.emailId))
			.limit(size)
			.all();

		const emailIds = list.map(item => item.emailId);

		const attsList = await attService.selectByEmailIds(c, emailIds);

		list.forEach(emailRow => {
			const atts = attsList.filter(attsRow => attsRow.emailId === emailRow.emailId);
			emailRow.attList = atts;
		});

		return { list };
	},
	async removeByEmailIds(c, emailIds) {
		if (!emailIds || emailIds.length === 0) return;
		await orm(c).delete(star).where(inArray(star.emailId, emailIds)).run();
	},

	// 按账号清理星标：star 表没有 account_id，需借 email 表反查。
	// 必须在删除 email 行之前调用（子查询在删除时才求值）。
	async removeByAccountId(c, accountId) {
		await c.env.db.prepare(
			`DELETE FROM star WHERE email_id IN (SELECT email_id FROM email WHERE account_id = ?)`
		).bind(accountId).run();
	},

	async removeByUserIds(c, userIds) {
		if (!userIds || userIds.length === 0) return;
		await orm(c).delete(star).where(inArray(star.userId, userIds)).run();
	}
};

export default starService;
