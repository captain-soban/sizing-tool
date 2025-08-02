import { getPool } from '$lib/server/database.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pool = getPool();
	const response = await pool.query('SELECT version()');
	const { version } = response.rows[0];

	return {
		version
	};
};
