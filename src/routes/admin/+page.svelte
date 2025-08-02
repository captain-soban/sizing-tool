<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Home } from '@lucide/svelte';
	import { AdminClient, type AdminSessionData } from '$lib/api/adminClient';
	import AdminStatistics from '$lib/components/admin/AdminStatistics.svelte';
	import SessionTable from '$lib/components/admin/SessionTable.svelte';
	import SessionDetailsModal from '$lib/components/admin/SessionDetailsModal.svelte';

	let sessions = $state<AdminSessionData[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchTerm = $state('');
	let selectedSession = $state<AdminSessionData | null>(null);
	let showDetailsModal = $state(false);
	let stats = $state({ totalSessions: 0, activeSessions: 0, totalParticipants: 0 });

	const adminClient = new AdminClient();

	onMount(async () => {
		await loadSessions();
	});

	async function loadSessions() {
		loading = true;
		error = '';

		try {
			const response = await adminClient.getSessions();
			sessions = response.sessions;
			stats = response.stats;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sessions';
		} finally {
			loading = false;
		}
	}

	async function deleteSession(sessionCode: string) {
		if (
			!confirm(
				`Are you sure you want to delete session ${sessionCode}? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			await adminClient.deleteSession(sessionCode);
			await loadSessions(); // Refresh the list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete session';
		}
	}

	async function terminateSession(sessionCode: string) {
		if (!confirm(`Are you sure you want to terminate session ${sessionCode}?`)) {
			return;
		}

		try {
			await adminClient.terminateSession(sessionCode);
			await loadSessions(); // Refresh the list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to terminate session';
		}
	}

	function viewSessionDetails(session: AdminSessionData) {
		selectedSession = session;
		showDetailsModal = true;
	}

	function closeDetailsModal() {
		showDetailsModal = false;
		selectedSession = null;
	}

	function handleSearchChange(value: string) {
		searchTerm = value;
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Planning Poker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
					<p class="mt-2 text-gray-600">Manage Planning Poker sessions and users</p>
				</div>
				<Button onclick={() => (window.location.href = '/')} variant="outline">
					<Home class="mr-2 h-4 w-4" />
					Back to Home
				</Button>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-md bg-red-100 p-4 text-sm text-red-800">
				{error}
			</div>
		{/if}

		<div class="mb-8">
			<AdminStatistics {stats} {loading} />
		</div>

		<SessionTable
			{sessions}
			{loading}
			{searchTerm}
			onSearchChange={handleSearchChange}
			onRefresh={loadSessions}
			onViewDetails={viewSessionDetails}
			onTerminate={terminateSession}
			onDelete={deleteSession}
		/>
	</div>
</div>

<SessionDetailsModal
	session={selectedSession}
	show={showDetailsModal}
	onClose={closeDetailsModal}
/>
