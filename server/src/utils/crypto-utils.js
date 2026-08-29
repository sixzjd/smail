const encoder = new TextEncoder();

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_PREFIX = 'pbkdf2$';

const saltHashUtils = {

	generateSalt(length = 16) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return btoa(String.fromCharCode(...array));
	},


	async hashPassword(password) {
		const salt = this.generateSalt();
		const hash = await this.genHashPassword(password, salt);
		return { salt, hash };
	},

	async genHashPassword(password, salt) {
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			'PBKDF2',
			false,
			['deriveBits']
		);
		const hashBuffer = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: encoder.encode(salt),
				iterations: PBKDF2_ITERATIONS,
				hash: 'SHA-256'
			},
			keyMaterial,
			256
		);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return PBKDF2_PREFIX + PBKDF2_ITERATIONS + '$' + btoa(String.fromCharCode(...hashArray));
	},

	isLegacyHash(hash) {
		return !hash.startsWith(PBKDF2_PREFIX);
	},

	async verifyPassword(inputPassword, salt, storedHash) {
		if (this.isLegacyHash(storedHash)) {
			const data = encoder.encode(salt + inputPassword);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return btoa(String.fromCharCode(...hashArray)) === storedHash;
		}
		const hash = await this.genHashPassword(inputPassword, salt);
		return hash === storedHash;
	},

	genRandomPwd(length = 8) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(array[i] % chars.length);
		}
		return result;
	}
};

export default saltHashUtils;
