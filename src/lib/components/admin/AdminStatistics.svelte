<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Users, Activity, Calendar } from '@lucide/svelte';
	import type { AdminStats } from '$lib/api/adminClient';

	interface Props {
		stats: AdminStats;
		loading?: boolean;
	}

	let { stats, loading = false }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="flex items-center text-sm font-medium text-gray-600">
				<Calendar class="mr-2 h-4 w-4" />
				Total Sessions
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="flex items-center text-sm font-medium text-gray-600">
				<Activity class="mr-2 h-4 w-4" />
				Active Sessions
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="flex items-center text-sm font-medium text-gray-600">
				<Users class="mr-2 h-4 w-4" />
				Total Participants
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
			{:else}
				<p class="text-3xl font-bold text-blue-600">{stats.totalParticipants}</p>
			{/if}
		</CardContent>
	</Card>
</div>
