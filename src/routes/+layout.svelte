<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights';
	injectSpeedInsights();
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
