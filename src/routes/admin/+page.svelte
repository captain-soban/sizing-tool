<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { AdminClient, type AdminSessionData } from '$lib/api/adminClient';

	let sessions = $state<AdminSessionData[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchTerm = $state('');
	let selectedSession = $state<AdminSessionData | null>(null);
	let showDetailsModal = $state(false);

	// Statistics
	let totalSessions = $state(0);
	let activeSessions = $state(0);
	let totalParticipants = $state(0);

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
			totalSessions = response.stats.totalSessions;
			activeSessions = response.stats.activeSessions;
			totalParticipants = response.stats.totalParticipants;
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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	function formatRelativeTime(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	function viewSessionDetails(session: AdminSessionData) {
		selectedSession = session;
		showDetailsModal = true;
	}

	function closeDetailsModal() {
		showDetailsModal = false;
		selectedSession = null;
	}

	let filteredSessions = $derived(
		sessions.filter(
			(session) =>
				session.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
				session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				session.hostName.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);
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
				<Button onclick={() => (window.location.href = '/')} variant="outline">Back to Home</Button>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-md bg-red-100 p-4 text-sm text-red-800">
				{error}
			</div>
		{/if}

		<!-- Statistics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-3xl font-bold text-gray-900">{totalSessions}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-3xl font-bold text-green-600">{activeSessions}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-gray-600">Total Participants</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-3xl font-bold text-blue-600">{totalParticipants}</p>
				</CardContent>
			</Card>
		</div>

		<!-- Session Management -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Session Management</CardTitle>
					<div class="flex items-center space-x-4">
						<Input
							type="text"
							placeholder="Search sessions..."
							bind:value={searchTerm}
							class="w-64"
						/>
						<Button onclick={loadSessions} disabled={loading}>
							{loading ? 'Loading...' : 'Refresh'}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<div class="text-gray-500">Loading sessions...</div>
					</div>
				{:else if filteredSessions.length === 0}
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<p class="text-gray-500">No sessions found</p>
							{#if searchTerm}
								<p class="mt-2 text-sm text-gray-400">Try adjusting your search criteria</p>
							{/if}
						</div>
					</div>
				{:else}
					<div class="overflow-hidden">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Session
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Host
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Participants
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Status
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Last Activity
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#each filteredSessions as session (session.sessionCode)}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4">
											<div>
												<div class="text-sm font-medium text-gray-900">{session.title}</div>
												<div class="text-sm text-gray-500">Code: {session.sessionCode}</div>
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="text-sm text-gray-900">{session.hostName}</div>
										</td>
										<td class="px-6 py-4">
											<div class="text-sm text-gray-900">{session.participantCount}</div>
										</td>
										<td class="px-6 py-4">
											<span
												class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {session.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'}"
											>
												{session.isActive ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td class="px-6 py-4">
											<div class="text-sm text-gray-900">
												{formatRelativeTime(session.lastActivity)}
											</div>
											<div class="text-xs text-gray-500">{formatDate(session.lastActivity)}</div>
										</td>
										<td class="px-6 py-4">
											<div class="flex items-center space-x-2">
												<Button
													size="sm"
													variant="outline"
													onclick={() => viewSessionDetails(session)}
												>
													View Details
												</Button>
												{#if session.isActive}
													<Button
														size="sm"
														variant="outline"
														onclick={() => terminateSession(session.sessionCode)}
													>
														Terminate
													</Button>
												{/if}
												<Button
													size="sm"
													variant="destructive"
													onclick={() => deleteSession(session.sessionCode)}
												>
													Delete
												</Button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- Session Details Modal -->
{#if showDetailsModal && selectedSession}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<button
				type="button"
				class="bg-opacity-50 fixed inset-0 bg-black"
				onclick={closeDetailsModal}
				aria-label="Close modal"
			></button>
			<div class="relative w-full max-w-2xl">
				<Card class="bg-white">
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Session Details - {selectedSession.sessionCode}</CardTitle>
							<Button variant="outline" size="sm" onclick={closeDetailsModal}>Close</Button>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Session Info -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h4 class="font-medium text-gray-900">Session Title</h4>
								<p class="text-sm text-gray-600">{selectedSession.title}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Session Code</h4>
								<p class="font-mono text-sm text-gray-600">{selectedSession.sessionCode}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Host</h4>
								<p class="text-sm text-gray-600">{selectedSession.hostName}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Status</h4>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {selectedSession.isActive
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'}"
								>
									{selectedSession.isActive ? 'Active' : 'Inactive'}
								</span>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Created</h4>
								<p class="text-sm text-gray-600">{formatDate(selectedSession.createdAt)}</p>
							</div>
							<div>
								<h4 class="font-medium text-gray-900">Last Activity</h4>
								<p class="text-sm text-gray-600">
									{formatRelativeTime(selectedSession.lastActivity)}
								</p>
							</div>
						</div>

						<!-- Participants -->
						<div>
							<h4 class="mb-3 font-medium text-gray-900">
								Participants ({selectedSession.participantCount})
							</h4>
							{#if selectedSession.participants && selectedSession.participants.length > 0}
								<div class="overflow-hidden rounded-lg border">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Name
												</th>
												<th
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Role
												</th>
												<th
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Status
												</th>
												<th
													class="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
												>
													Last Seen
												</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200 bg-white">
											{#each selectedSession.participants as participant (participant.name)}
												<tr>
													<td class="px-4 py-2">
														<div class="text-sm font-medium text-gray-900">{participant.name}</div>
													</td>
													<td class="px-4 py-2">
														<div class="text-sm text-gray-900">
															{participant.isHost ? 'Host' : 'Participant'}
															{#if participant.isObserver}
																<span class="ml-1 text-xs text-gray-500">(Observer)</span>
															{/if}
														</div>
													</td>
													<td class="px-4 py-2">
														{#if participant.lastSeen && Date.now() - participant.lastSeen < 5 * 60 * 1000}
															<span
																class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
															>
																Online
															</span>
														{:else}
															<span
																class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
															>
																Offline
															</span>
														{/if}
													</td>
													<td class="px-4 py-2">
														<div class="text-sm text-gray-500">
															{#if participant.lastSeen}
																{formatRelativeTime(new Date(participant.lastSeen).toISOString())}
															{:else}
																Never
															{/if}
														</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<div class="rounded-lg border border-gray-200 p-6 text-center">
									<p class="text-gray-500">No participants found</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{/if}
