<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { defaultStoryPointScales, type Participant } from '$lib/stores/session';
	import { SessionClient, type SessionData } from '$lib/api/sessionClient';

	const sessionCode = $page.params.sessionCode!;

	let sessionTitle = $state('Sprint Planning Session');
	let playerName = $state('');
	let isHost = $state(false);
	let isObserver = $state(false);
	let participants = $state<Participant[]>([]);
	let votingInProgress = $state(false);
	let votesRevealed = $state(false);
	let selectedVote = $state<string | null>(null);
	let voteAverage = $state<string>('');
	let finalEstimate = $state<string>('');
	let editingTitle = $state(false);
	let tempTitle = $state('');
	let sessionClient: SessionClient;
	let heartbeatInterval: number | null = null;

	let storyPointOptions = $state<string[]>(['0', '1', '2', '3', '5', '8', '?']);

	onMount(async () => {
		const storedPlayerName = localStorage.getItem('playerName');
		const storedIsHost = localStorage.getItem('isHost') === 'true';
		const storedSessionCode = localStorage.getItem('sessionCode');

		if (!storedPlayerName || storedSessionCode !== sessionCode) {
			goto('/');
			return;
		}

		playerName = storedPlayerName;
		isHost = storedIsHost;

		// Load observer status from localStorage (user preference)
		const storedIsObserver =
			localStorage.getItem(`session_${sessionCode}_observer_${playerName}`) === 'true';
		isObserver = storedIsObserver;

		// Initialize session client
		sessionClient = new SessionClient();

		// Set up real-time updates
		sessionClient.onUpdate((sessionData: SessionData) => {
			updateFromSessionData(sessionData);
		});

		try {
			// Join or rejoin the session
			const sessionData = await sessionClient.joinSession(sessionCode, playerName, isObserver);
			updateFromSessionData(sessionData);

			// Connect to real-time updates
			sessionClient.connectToRealtime(sessionCode);

			// Load local session settings
			const storedScale = localStorage.getItem(`session_${sessionCode}_scale`);
			if (storedScale) {
				if (storedScale === 'custom') {
					const customScaleData = localStorage.getItem(`session_${sessionCode}_custom_scale`);
					if (customScaleData) {
						storyPointOptions = JSON.parse(customScaleData);
					}
				} else {
					storyPointOptions =
						defaultStoryPointScales[storedScale as keyof typeof defaultStoryPointScales] ||
						storyPointOptions;
				}
			}

			// Start heartbeat to show this participant is active
			heartbeatInterval = window.setInterval(() => {
				if (sessionClient) {
					sessionClient.sendHeartbeat(sessionCode, playerName);
				}
			}, 5000); // Send heartbeat every 5 seconds
		} catch (error) {
			console.error('[Session] Error joining session:', error);
			goto('/');
		}
	});

	onDestroy(() => {
		if (sessionClient) {
			sessionClient.disconnect();
		}
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
		}
	});

	function updateFromSessionData(sessionData: SessionData) {
		sessionTitle = sessionData.title;
		participants = sessionData.participants;
		votingInProgress = sessionData.votingState.votingInProgress;
		votesRevealed = sessionData.votingState.votesRevealed;
		voteAverage = sessionData.votingState.voteAverage;
		finalEstimate = sessionData.votingState.finalEstimate;

		// Update story point options if different
		if (JSON.stringify(sessionData.storyPointScale) !== JSON.stringify(storyPointOptions)) {
			storyPointOptions = sessionData.storyPointScale;
		}
	}

	function saveSessionState() {
		// Save individual session settings (not shared)
		localStorage.setItem(`session_${sessionCode}_observer_${playerName}`, isObserver.toString());
	}

	async function toggleObserverMode() {
		isObserver = !isObserver;

		// Update server state
		if (sessionClient) {
			try {
				const updates: Partial<Participant> = { isObserver };
				// Clear vote if becoming observer
				if (isObserver) {
					updates.voted = false;
					updates.vote = undefined;
					selectedVote = null;
				}
				await sessionClient.updateParticipant(sessionCode, playerName, updates);
			} catch (error) {
				console.error('[Session] Error toggling observer mode:', error);
				// Revert the change if API call failed
				isObserver = !isObserver;
			}
		}

		saveSessionState();
	}

	function exitSession() {
		localStorage.removeItem('sessionCode');
		localStorage.removeItem('playerName');
		localStorage.removeItem('isHost');
		goto('/');
	}

	function goToSettings() {
		goto(`/session/${sessionCode}/settings`);
	}

	async function selectVote(vote: string) {
		if (isObserver) return; // Observers cannot vote

		selectedVote = vote;

		// Update server state
		if (sessionClient) {
			try {
				await sessionClient.updateParticipant(sessionCode, playerName, {
					voted: true,
					vote: vote
				});
			} catch (error) {
				console.error('[Session] Error selecting vote:', error);
			}
		}
	}

	async function startNewVoting() {
		if (!isHost) return;

		// Clear local UI state
		selectedVote = null;

		// Reset votes on server
		if (sessionClient) {
			try {
				await sessionClient.resetVotes(sessionCode);
			} catch (error) {
				console.error('[Session] Error starting new voting:', error);
			}
		}
	}

	async function revealVotes() {
		if (!isHost) return;

		// Calculate average from current participants
		const votes = participants
			.filter((p) => !p.isObserver && p.vote && p.vote !== '?' && !isNaN(parseFloat(p.vote)))
			.map((p) => parseFloat(p.vote!));

		let calculatedAverage = '';
		if (votes.length > 0) {
			const average = votes.reduce((sum, vote) => sum + vote, 0) / votes.length;
			calculatedAverage = average.toFixed(1);
		}

		// Update server state
		if (sessionClient) {
			try {
				await sessionClient.updateVotingState(sessionCode, {
					votesRevealed: true,
					voteAverage: calculatedAverage
				});
			} catch (error) {
				console.error('[Session] Error revealing votes:', error);
			}
		}
	}

	async function acceptEstimate() {
		if (!isHost) return;

		if (sessionClient) {
			try {
				await sessionClient.updateVotingState(sessionCode, {
					finalEstimate: voteAverage,
					votingInProgress: false
				});
			} catch (error) {
				console.error('[Session] Error accepting estimate:', error);
			}
		}
	}

	function startEditingTitle() {
		if (!isHost) return;
		editingTitle = true;
		tempTitle = sessionTitle;
	}

	async function saveTitle() {
		if (tempTitle.trim()) {
			if (sessionClient) {
				try {
					await sessionClient.updateSessionTitle(sessionCode, tempTitle.trim());
				} catch (error) {
					console.error('[Session] Error saving title:', error);
				}
			}
		}
		editingTitle = false;
		tempTitle = '';
	}

	function cancelEditTitle() {
		editingTitle = false;
		tempTitle = '';
	}

	function getParticipantPosition(index: number, total: number) {
		const angle = (index * 360) / total - 90; // Start from top (12 o'clock position)
		const radiusX = 47; // Horizontal radius for elliptical positioning
		const radiusY = 45; // Vertical radius for elliptical positioning
		const x = 50 + radiusX * Math.cos((angle * Math.PI) / 180);
		const y = 50 + radiusY * Math.sin((angle * Math.PI) / 180);
		return { x: `${x}%`, y: `${y}%` };
	}
</script>

<div class="min-h-screen p-4">
	<!-- Session Title - Upper Left -->
	<div class="fixed top-4 left-4 z-10">
		<div class="rounded-lg border bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
			<h1 class="text-poker-blue text-sm font-bold sm:text-base lg:text-lg">{sessionTitle}</h1>
			<p class="text-xs text-gray-600">Session: {sessionCode}</p>
		</div>
	</div>

	<!-- Top Controls -->
	<div class="fixed top-4 right-4 z-10 flex gap-2">
		<Button
			variant="outline"
			onclick={toggleObserverMode}
			class={isObserver
				? 'border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200'
				: 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200'}
		>
			{isObserver ? '👁️ Observer' : '🗳️ Participant'}
		</Button>
		<Button variant="outline" size="icon" onclick={goToSettings} class="btn-poker-gray">⚙️</Button>
		<Button variant="outline" onclick={exitSession} class="btn-poker-gray">Exit</Button>
	</div>

	<!-- Main Poker Table -->
	<div class="flex min-h-screen items-center justify-center p-2">
		<div class="relative w-full max-w-5xl">
			<!-- Poker Table Container with participants positioned around it -->
			<div class="relative aspect-[4/3] max-h-[700px] min-h-[500px] w-full">
				<!-- Poker Table (Oval) -->
				<div
					class="absolute top-[12%] right-[12%] bottom-[12%] left-[12%] rounded-full border-4 border-amber-900 bg-green-800 shadow-2xl sm:border-6 lg:border-8"
				>
					<!-- Table Center Area -->
					<div class="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-4">
						<Card class="work-area w-full max-w-xs text-center sm:max-w-sm">
							<CardContent class="p-3 sm:p-4 lg:p-6">
								<!-- Session Title -->
								{#if editingTitle}
									<div class="mb-3 space-y-2 sm:mb-4">
										<input
											type="text"
											bind:value={tempTitle}
											class="w-full rounded border p-2 text-center text-sm font-bold sm:text-lg"
											placeholder="Enter session title"
											autofocus
											onkeydown={(e) => {
												if (e.key === 'Enter') saveTitle();
												if (e.key === 'Escape') cancelEditTitle();
											}}
										/>
										<div class="flex justify-center gap-2">
											<Button
												onclick={saveTitle}
												size="sm"
												class="bg-green-500 text-xs text-white hover:bg-green-600 sm:text-sm"
											>
												Save
											</Button>
											<Button
												onclick={cancelEditTitle}
												variant="outline"
												size="sm"
												class="btn-poker-gray text-xs sm:text-sm"
											>
												Cancel
											</Button>
										</div>
									</div>
								{:else}
									<div class="group mb-3 sm:mb-4">
										<h2
											class="text-poker-blue hover:text-poker-blue/80 cursor-pointer text-lg leading-tight font-bold transition-colors sm:text-xl lg:text-2xl"
											onclick={startEditingTitle}
											title={isHost ? 'Click to edit title' : 'Session title'}
										>
											{sessionTitle}
											{#if isHost}
												<span
													class="ml-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 sm:ml-2 sm:text-sm"
													>✏️</span
												>
											{/if}
										</h2>
									</div>
								{/if}

								<!-- Voting Status and Results -->
								{#if votesRevealed && voteAverage}
									<div class="space-y-2 sm:space-y-3">
										<p class="text-muted-foreground text-xs sm:text-sm">Team Average:</p>
										<p class="text-poker-red bounce-in text-2xl font-bold sm:text-3xl lg:text-4xl">
											{voteAverage}
										</p>

										{#if isHost && !finalEstimate}
											<div class="mt-3 space-y-2 sm:mt-4">
												<div class="flex justify-center gap-2">
													<Button
														onclick={acceptEstimate}
														class="bg-green-500 px-3 text-xs text-white hover:bg-green-600 sm:px-4 sm:text-sm"
														size="sm"
													>
														✓ Accept {voteAverage}
													</Button>
												</div>
												<div class="flex flex-wrap justify-center gap-1 sm:gap-2">
													<Button
														onclick={startNewVoting}
														variant="outline"
														size="sm"
														class="btn-poker-gray text-xs sm:text-sm"
													>
														🔄 Re-vote
													</Button>
													<Button
														onclick={() => {
															const customValue = prompt('Enter custom estimate:', voteAverage);
															if (customValue && customValue.trim()) {
																finalEstimate = customValue.trim();
																votingInProgress = false;
																saveSessionState();
															}
														}}
														variant="outline"
														size="sm"
														class="btn-poker-gray text-xs sm:text-sm"
													>
														✏️ Custom
													</Button>
												</div>
											</div>
										{/if}

										{#if finalEstimate}
											<div class="mt-4 rounded-md border-2 border-green-300 bg-green-100 p-3">
												<p class="font-medium text-green-800">
													Final Estimate: <span class="text-2xl font-bold">{finalEstimate}</span>
												</p>
												{#if isHost}
													<Button
														onclick={() => {
															finalEstimate = '';
															saveSessionState();
														}}
														variant="outline"
														size="sm"
														class="mt-2 text-xs"
													>
														Reset
													</Button>
												{/if}
											</div>
										{/if}
									</div>
								{:else if votingInProgress}
									<div class="space-y-3">
										<p class="text-muted-foreground">🗳️ Voting in progress...</p>
										<div class="text-sm text-gray-600">
											{participants.filter((p) => !p.isObserver && p.voted).length} / {participants.filter(
												(p) => !p.isObserver
											).length} votes cast
										</div>
										{#if isHost}
											<Button onclick={revealVotes} class="bg-poker-red hover:bg-poker-red/90">
												🎭 Reveal Votes
											</Button>
										{/if}
									</div>
								{:else}
									<div class="space-y-3">
										<p class="text-muted-foreground">Ready to start voting</p>
										{#if isHost}
											<Button onclick={startNewVoting} class="bg-poker-blue hover:bg-poker-blue/90">
												🚀 Start Voting
											</Button>
										{:else}
											<p class="text-sm text-gray-500">Waiting for host to start...</p>
										{/if}
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				</div>

				<!-- Participants Around Table (Outside the table) -->
				{#each participants as participant, index (participant.name)}
					{@const position = getParticipantPosition(index, participants.length)}
					<div
						class="absolute -translate-x-1/2 -translate-y-1/2 transform"
						style="left: {position.x}; top: {position.y};"
					>
						<div class="flex flex-col items-center space-y-1 sm:space-y-2">
							<!-- Participant Card -->
							<Card class="work-area max-w-[140px] min-w-[100px] sm:min-w-[120px]">
								<CardContent class="p-2 text-center sm:p-3">
									<div class="mb-1 flex flex-wrap items-center justify-center space-x-1">
										<span class="text-xs font-medium break-words sm:text-sm"
											>{participant.name}</span
										>
										{#if participant.isHost}
											<span class="bg-poker-blue rounded px-1 text-[10px] text-white sm:text-xs"
												>HOST</span
											>
										{/if}
										{#if participant.isObserver}
											<span
												class="rounded bg-orange-200 px-1 text-[10px] text-orange-800 sm:text-xs"
												>👁️</span
											>
										{/if}
									</div>

									<!-- Vote Status Indicator -->
									<div class="flex justify-center">
										{#if participant.isObserver}
											<div
												class="rounded-md bg-orange-100 px-2 py-1 text-[10px] text-orange-600 sm:px-3 sm:text-xs"
											>
												👁️ Observer
											</div>
										{:else if votesRevealed && participant.vote}
											<div
												class="bounce-in bg-poker-blue rounded-md px-2 py-1 text-xs font-bold text-white sm:px-3 sm:text-sm"
											>
												{participant.vote}
											</div>
										{:else if participant.voted}
											<div
												class="bounce-in rounded-md bg-green-500 px-2 py-1 text-[10px] font-medium text-white sm:px-3 sm:text-xs"
											>
												✓ Voted
											</div>
										{:else if votingInProgress}
											<div
												class="thinking rounded-md bg-yellow-100 px-2 py-1 text-[10px] text-yellow-700 sm:px-3 sm:text-xs"
											>
												🤔 Thinking...
											</div>
										{:else}
											<div
												class="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-500 sm:px-3 sm:text-xs"
											>
												Ready
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Voting Cards (Bottom) -->
	{#if votingInProgress && !votesRevealed && !isObserver}
		<div class="fixed bottom-8 left-1/2 -translate-x-1/2 transform">
			<Card class="work-area">
				<CardContent class="p-4">
					<p class="mb-4 text-center text-sm font-medium">Choose your estimate:</p>
					<div class="flex justify-center gap-2">
						{#each storyPointOptions as option (option)}
							<Button
								onclick={() => selectVote(option)}
								variant={selectedVote === option ? 'default' : 'outline'}
								class={selectedVote === option
									? 'bg-poker-blue hover:bg-poker-blue/90'
									: 'btn-poker-gray'}
								size="lg"
							>
								{option}
							</Button>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Observer Message (Bottom) -->
	{#if votingInProgress && !votesRevealed && isObserver}
		<div class="fixed bottom-8 left-1/2 -translate-x-1/2 transform">
			<Card class="work-area">
				<CardContent class="p-4">
					<p class="text-center text-sm text-orange-600">
						👁️ You are observing this session. Toggle to participant mode to vote.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
