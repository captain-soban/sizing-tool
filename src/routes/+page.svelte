<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { SessionClient } from '$lib/api/sessionClient';
	import {
		addRecentSession,
		getRecentSessions,
		migrateOldSessionData,
		type RecentSession
	} from '$lib/stores/session';

	let sessionCode = $state('');
	let playerName = $state('');
	let isCreating = $state(false);
	let isJoining = $state(false);
	let error = $state('');
	let recentSessions = $state<RecentSession[]>([]);

	const sessionClient = new SessionClient();

	onMount(() => {
		// Migrate old localStorage data if it exists
		migrateOldSessionData();
		// Load recent sessions
		recentSessions = getRecentSessions();
	});

	async function createSession() {
		if (!playerName.trim()) return;

		isCreating = true;
		error = '';

		try {
			const session = await sessionClient.createSession(playerName.trim());

			// Add to recent sessions
			addRecentSession({
				sessionCode: session.sessionCode,
				playerName: playerName.trim(),
				isHost: true,
				sessionTitle: undefined
			});

			goto(`/session/${session.sessionCode}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create session';
			console.error('[Landing] Error creating session:', err);
		} finally {
			isCreating = false;
		}
	}

	async function joinSession() {
		if (sessionCode.length !== 8 || !playerName.trim()) return;

		isJoining = true;
		error = '';

		try {
			const upperSessionCode = sessionCode.toUpperCase();
			await sessionClient.joinSession(upperSessionCode, playerName.trim());

			// Add to recent sessions
			addRecentSession({
				sessionCode: upperSessionCode,
				playerName: playerName.trim(),
				isHost: false,
				sessionTitle: undefined
			});

			goto(`/session/${upperSessionCode}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join session';
			console.error('[Landing] Error joining session:', err);
		} finally {
			isJoining = false;
		}
	}

	function handleSessionCodeInput(event: Event) {
		const target = event.target as HTMLInputElement;
		sessionCode = target.value.toUpperCase();
	}

	async function joinRecentSession(recentSession: RecentSession) {
		isJoining = true;
		error = '';

		try {
			const upperSessionCode = recentSession.sessionCode.toUpperCase();
			await sessionClient.joinSession(upperSessionCode, recentSession.playerName);

			// Update recent session with preserved host status
			addRecentSession({
				sessionCode: upperSessionCode,
				playerName: recentSession.playerName,
				isHost: recentSession.isHost, // Preserve original host status
				sessionTitle: recentSession.sessionTitle
			});

			goto(`/session/${upperSessionCode}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join session';
			console.error('[Landing] Error joining recent session:', err);
		} finally {
			isJoining = false;
		}
	}

	function formatLastAccessed(timestamp: number): string {
		const now = Date.now();
		const diffMs = now - timestamp;
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		const date = new Date(timestamp);
		return date.toLocaleDateString();
	}
</script>

<div class="relative flex min-h-screen items-center justify-center p-4">
	<!-- Admin Dashboard Button - Upper Right -->
	<div class="absolute top-4 right-4 z-10">
		<Button
			onclick={() => (window.location.href = '/admin')}
			variant="outline"
			size="sm"
			class="text-xs text-gray-500 hover:text-gray-700"
		>
			Admin Dashboard
		</Button>
	</div>

	<Card class="work-area w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-poker-blue text-center text-3xl font-bold">Planning Poker</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Error Message -->
			{#if error}
				<div class="rounded-md bg-red-100 p-3 text-sm text-red-800">
					{error}
				</div>
			{/if}

			<!-- Recent Sessions -->
			{#if recentSessions.length > 0}
				<div class="space-y-3">
					<h3 class="text-sm font-medium text-gray-700">Recent Sessions</h3>
					<div class="max-h-48 space-y-2 overflow-y-auto">
						{#each recentSessions as recentSession (recentSession.sessionCode + recentSession.playerName)}
							<button
								type="button"
								onclick={() => joinRecentSession(recentSession)}
								disabled={isCreating || isJoining}
								class="w-full text-left"
							>
								<Card
									class="cursor-pointer border-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<CardContent class="flex items-center justify-between p-3">
										<div class="flex items-center space-x-3">
											<div class="min-w-0 flex-1">
												<div class="flex items-center space-x-2">
													<p class="truncate text-sm font-medium text-gray-900">
														{recentSession.sessionTitle || `Session ${recentSession.sessionCode}`}
													</p>
													{#if recentSession.isHost}
														<span
															class="bg-poker-blue rounded px-1.5 py-0.5 text-xs font-medium text-white"
														>
															HOST
														</span>
													{/if}
												</div>
												<div class="flex items-center space-x-2 text-xs text-gray-500">
													<span>Code: {recentSession.sessionCode}</span>
													<span>•</span>
													<span>as {recentSession.playerName}</span>
													<span>•</span>
													<span>{formatLastAccessed(recentSession.lastAccessed)}</span>
												</div>
											</div>
											<div class="text-gray-400">
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</div>
										</div>
									</CardContent>
								</Card>
							</button>
						{/each}
					</div>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="text-muted-foreground bg-white px-2">or create/join a new session</span>
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<label for="playerName" class="text-sm font-medium"> Your Name </label>
				<Input id="playerName" type="text" bind:value={playerName} placeholder="Enter your name" />
			</div>

			<div class="space-y-4">
				<Button
					onclick={createSession}
					disabled={!playerName.trim() || isCreating || isJoining}
					class="bg-poker-blue hover:bg-poker-blue/90 w-full"
				>
					{#if isCreating}
						Creating...
					{:else}
						Create New Session
					{/if}
				</Button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="text-muted-foreground bg-white px-2">or</span>
					</div>
				</div>

				<div class="space-y-2">
					<label for="sessionCode" class="text-sm font-medium"> Session Code </label>
					<Input
						id="sessionCode"
						type="text"
						bind:value={sessionCode}
						placeholder="Enter 8-digit code"
						maxlength={8}
						class="uppercase"
						oninput={handleSessionCodeInput}
					/>
				</div>

				<Button
					onclick={joinSession}
					disabled={!playerName.trim() || sessionCode.length !== 8 || isCreating || isJoining}
					class="btn-poker-gray w-full"
				>
					{#if isJoining}
						Joining...
					{:else}
						Join Session
					{/if}
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
