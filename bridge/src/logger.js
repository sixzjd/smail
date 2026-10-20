// 极简分级日志：bridge 部署在 VPS 上，日志会被 systemd 收走，
// 所以只输出结构化的单行文本，避免占满 journal。
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

let currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function format(level, scope, args) {
	const time = new Date().toISOString();
	const parts = args.map(arg => {
		if (arg instanceof Error) {
			return arg.stack || arg.message;
		}
		if (typeof arg === 'object' && arg !== null) {
			try {
				return JSON.stringify(arg);
			} catch {
				return String(arg);
			}
		}
		return String(arg);
	});
	return `[${time}] ${level.toUpperCase().padEnd(5)} [${scope}] ${parts.join(' ')}`;
}

export function createLogger(scope) {
	return {
		debug: (...args) => currentLevel <= LEVELS.debug && console.log(format('debug', scope, args)),
		info: (...args) => currentLevel <= LEVELS.info && console.log(format('info', scope, args)),
		warn: (...args) => currentLevel <= LEVELS.warn && console.warn(format('warn', scope, args)),
		error: (...args) => currentLevel <= LEVELS.error && console.error(format('error', scope, args)),
		setLevel(level) {
			if (LEVELS[level]) currentLevel = LEVELS[level];
		},
	};
}

export default createLogger;
