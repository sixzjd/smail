import app from '../hono.js';
import { dbInit } from '../init/init.js';

app.get('/api/init/:secret', (c) => {
	return dbInit.init(c);
})
