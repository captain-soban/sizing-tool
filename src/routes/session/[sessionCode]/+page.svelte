<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		defaultStoryPointScales,
		type Participant,
		getRecentSessions,
		addRecentSession,
		updateRecentSessionTitle
	} from '$lib/stores/session';
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

	onMount(() => {
		// Try to find the session in recent sessions
		const recentSessions = getRecentSessions();
		const currentSession = recentSessions.find((s) => s.sessionCode === sessionCode);

		if (!currentSession) {
			console.error('[Session] Session not found in recent data, redirecting to home');
			goto('/');
			return;
		}

		playerName = currentSession.playerName;
		isHost = currentSession.isHost;

		// Update the session's last accessed time
		addRecentSession({
			sessionCode: currentSession.sessionCode,
			playerName: currentSession.playerName,
			isHost: currentSession.isHost,
			sessionTitle: currentSession.sessionTitle
		});

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

		(async () => {
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
		})();

		// Handle visibility changes to reconnect when user returns to tab
		const handleVisibilityChange = () => {
			if (!document.hidden && sessionClient) {
				// Reconnect to real-time updates if needed
				sessionClient.connectToRealtime(sessionCode);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Add keyboard shortcuts
		const handleKeyPress = (e: KeyboardEvent) => {
			// Don't handle shortcuts if user is typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key) {
				case 'Escape':
					exitSession();
					break;
				case 's':
				case 'S':
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						goToSettings();
					}
					break;
				case '1':
				case '2':
				case '3':
				case '5':
				case '8':
				case '0':
				case '?':
					if (votingInProgress && !votesRevealed && !isObserver) {
						selectVote(e.key);
					}
					break;
			}
		};

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			document.removeEventListener('keydown', handleKeyPress);
		};
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

		// Update recent session title if it changed
		updateRecentSessionTitle(sessionCode, playerName, sessionData.title);
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
		// The recent sessions data will remain for quick access later
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
		// Start from top (12 o'clock position) and distribute evenly
		const angle = (index * 360) / total - 90;

		// Define table boundaries and create invisible padding zone
		// Table occupies: top-[15%] right-[12%] bottom-[15%] left-[12%]
		const tableEdges = {
			left: 12, // left-[12%]
			right: 88, // 100% - right-[12%]
			top: 15, // top-[15%]
			bottom: 85 // 100% - bottom-[15%]
		};

		// Add invisible padding around the table (8% padding on all sides)
		const padding = 8;
		const paddedBoundaries = {
			left: tableEdges.left - padding, // 4%
			right: tableEdges.right + padding, // 96%
			top: tableEdges.top - padding, // 7%
			bottom: tableEdges.bottom + padding // 93%
		};

		// Calculate radius to place participants outside the padded zone
		// Use the maximum extent of the padded oval to ensure clearance
		const paddedRadiusX = Math.max(50 - paddedBoundaries.left, paddedBoundaries.right - 50);
		const paddedRadiusY = Math.max(50 - paddedBoundaries.top, paddedBoundaries.bottom - 50);

		// Add extra margin based on participant count to prevent crowding
		const extraMargin = total <= 3 ? 2 : total <= 5 ? 4 : total <= 7 ? 6 : 8;
		const finalRadiusX = paddedRadiusX + extraMargin;
		const finalRadiusY = paddedRadiusY + extraMargin;

		const x = 50 + finalRadiusX * Math.cos((angle * Math.PI) / 180);
		const y = 50 + finalRadiusY * Math.sin((angle * Math.PI) / 180);

		// Ensure participants stay within container bounds
		const clampedX = Math.max(1, Math.min(99, x));
		const clampedY = Math.max(1, Math.min(99, y));

		return { x: `${clampedX}%`, y: `${clampedY}%` };
	}

	// Calculate responsive width based on number of story point options
	function getEstimationFrameWidth() {
		const optionCount = storyPointOptions.length;
		if (optionCount <= 5) return 'max-w-sm';
		if (optionCount <= 7) return 'max-w-md';
		if (optionCount <= 9) return 'max-w-lg';
		if (optionCount <= 12) return 'max-w-xl';
		return 'max-w-2xl';
	}

	// Calculate responsive button size and spacing based on number of options
	function getButtonClasses(isSelected: boolean) {
		const optionCount = storyPointOptions.length;
		let baseClasses = '';

		if (optionCount <= 7) {
			// Larger buttons for fewer options
			baseClasses = 'min-w-[2.5rem] h-8 text-sm sm:min-w-[3rem] sm:h-9 sm:text-base';
		} else if (optionCount <= 10) {
			// Medium buttons for moderate options
			baseClasses = 'min-w-[2rem] h-7 text-xs sm:min-w-[2.5rem] sm:h-8 sm:text-sm';
		} else {
			// Smaller buttons for many options
			baseClasses = 'min-w-[1.75rem] h-6 text-xs sm:min-w-[2rem] sm:h-7 sm:text-sm';
		}

		if (isSelected) {
			return `bg-poker-blue hover:bg-poker-blue/90 slide-up ${baseClasses} font-bold shadow-md`;
		} else {
			return `btn-poker-gray poker-card-hover ${baseClasses} font-semibold hover:shadow-sm transition-all duration-200`;
		}
	}

	// Calculate gap size based on number of options
	function getButtonGap() {
		const optionCount = storyPointOptions.length;
		if (optionCount <= 7) return 'gap-1.5 sm:gap-2';
		if (optionCount <= 10) return 'gap-1 sm:gap-1.5';
		return 'gap-0.5 sm:gap-1';
	}
</script>

<div class="min-h-screen p-4">
	<!-- Session Title - Upper Left -->
	<div class="fixed top-4 left-4 z-10">
		<div class="rounded-lg border bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
			{#if editingTitle}
				<div class="space-y-2">
					<input
						type="text"
						bind:value={tempTitle}
						class="w-full rounded border p-1 text-sm font-bold text-blue-700 sm:text-base lg:text-lg"
						placeholder="Enter session title"
						onkeydown={(e) => {
							if (e.key === 'Enter') saveTitle();
							if (e.key === 'Escape') cancelEditTitle();
						}}
						autofocus
					/>
					<div class="flex gap-1">
						<Button
							onclick={saveTitle}
							size="sm"
							class="bg-green-500 text-xs text-white hover:bg-green-600"
						>
							Save
						</Button>
						<Button
							onclick={cancelEditTitle}
							variant="outline"
							size="sm"
							class="btn-poker-gray text-xs"
						>
							Cancel
						</Button>
					</div>
				</div>
			{:else}
				<div class="group">
					{#if isHost}
						<button
							type="button"
							class="m-0 cursor-pointer rounded border-none bg-transparent p-0 text-left text-sm font-bold text-blue-700 transition-colors hover:text-blue-700/80 focus:text-blue-700/80 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:outline-none sm:text-base lg:text-lg"
							onclick={startEditingTitle}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									startEditingTitle();
								}
							}}
							title="Click to edit title"
						>
							{sessionTitle}
							<span class="ml-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
								>✏️</span
							>
						</button>
					{:else}
						<h1 class="text-sm font-bold text-blue-700 sm:text-base lg:text-lg">{sessionTitle}</h1>
					{/if}
				</div>
			{/if}
			<p class="text-xs text-gray-600">Session: {sessionCode}</p>
			<p class="text-xs text-gray-500">
				👥 {participants.length} participant{participants.length !== 1 ? 's' : ''}
				{#if participants.filter((p) => !p.isObserver).length !== participants.length}
					({participants.filter((p) => !p.isObserver).length} voting)
				{/if}
			</p>
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
		<div class="relative w-full max-w-4xl">
			<!-- Poker Table Container with participants positioned around it -->
			<div class="relative aspect-[5/3] max-h-[450px] min-h-[350px] w-full">
				<!-- Poker Table (Oval) -->
				<div
					class="absolute top-[15%] right-[12%] bottom-[15%] left-[12%] border-3 border-amber-900 bg-green-800 shadow-xl sm:border-4"
					style="border-radius: 50% / 40%;"
				>
					<!-- Table Center Area -->
					<div class="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-3">
						<Card class="work-area w-full max-w-[240px] text-center sm:max-w-[280px]">
							<CardContent class="p-2.5 sm:p-3 lg:p-4">
								<!-- Session Title -->
								<div class="mb-3 sm:mb-4">
									<h2
										class="text-lg leading-tight font-bold text-blue-700 sm:text-xl lg:text-2xl"
										title="Session title"
									>
										{sessionTitle}
									</h2>
								</div>

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
														onclick={async () => {
															const customValue = prompt('Enter custom estimate:', voteAverage);
															if (customValue && customValue.trim() && sessionClient) {
																try {
																	await sessionClient.updateVotingState(sessionCode, {
																		finalEstimate: customValue.trim(),
																		votingInProgress: false
																	});
																} catch (error) {
																	console.error('[Session] Error saving custom estimate:', error);
																}
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
														onclick={async () => {
															if (sessionClient) {
																try {
																	await sessionClient.updateVotingState(sessionCode, {
																		finalEstimate: '',
																		votingInProgress: false
																	});
																} catch (error) {
																	console.error('[Session] Error resetting final estimate:', error);
																}
															}
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
						<div class="flex flex-col items-center">
							<!-- Participant Card -->
							<Card class="work-area w-24 sm:w-28">
								<CardContent class="p-1.5 text-center sm:p-2">
									<!-- Participant Name and Badges -->
									<div class="mb-1 flex flex-col items-center space-y-0.5">
										<span
											class="max-w-full text-center text-[11px] leading-tight font-medium break-words sm:text-xs"
											>{participant.name}</span
										>
										<div class="flex flex-wrap items-center justify-center gap-0.5">
											{#if participant.isHost}
												<span
													class="bg-poker-blue rounded px-1 py-0.5 text-[8px] font-medium text-white sm:text-[9px]"
													>HOST</span
												>
											{/if}
											{#if participant.isObserver}
												<span
													class="rounded bg-orange-200 px-1 py-0.5 text-[8px] font-medium text-orange-800 sm:text-[9px]"
													>👁️</span
												>
											{/if}
										</div>
									</div>

									<!-- Vote Status Indicator -->
									<div class="flex justify-center">
										{#if participant.isObserver}
											<div
												class="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-600 sm:px-2 sm:py-1 sm:text-[10px]"
											>
												👁️ Observer
											</div>
										{:else if votesRevealed && participant.vote}
											<div
												class="bounce-in bg-poker-blue rounded px-2 py-0.5 text-xs font-bold text-white sm:px-2.5 sm:py-1 sm:text-sm"
											>
												{participant.vote}
											</div>
										{:else if participant.voted}
											<div
												class="bounce-in rounded bg-green-500 px-1.5 py-0.5 text-[9px] font-medium text-white sm:px-2 sm:py-1 sm:text-[10px]"
											>
												✓ Voted
											</div>
										{:else if votingInProgress}
											<div
												class="thinking rounded bg-yellow-100 px-1.5 py-0.5 text-[9px] font-medium text-yellow-700 sm:px-2 sm:py-1 sm:text-[10px]"
											>
												🤔 Thinking
											</div>
										{:else}
											<div
												class="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 sm:px-2 sm:py-1 sm:text-[10px]"
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
		<div
			class="fixed bottom-4 left-1/2 w-full -translate-x-1/2 transform {getEstimationFrameWidth()} px-4 sm:bottom-6"
		>
			<Card class="work-area">
				<CardContent class="p-2 sm:p-3">
					<p class="mb-1 text-center text-xs font-medium sm:text-sm">Choose your estimate:</p>
					<p class="mb-2 text-center text-[10px] text-gray-500 sm:text-xs">
						💡 Press 0-8 or ? to vote quickly
					</p>
					<div class="flex flex-wrap justify-center {getButtonGap()}">
						{#each storyPointOptions as option (option)}
							<Button
								onclick={() => selectVote(option)}
								variant={selectedVote === option ? 'default' : 'outline'}
								class={getButtonClasses(selectedVote === option)}
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
		<div
			class="fixed bottom-4 left-1/2 w-full max-w-2xl -translate-x-1/2 transform px-4 sm:bottom-8"
		>
			<Card class="work-area">
				<CardContent class="p-4 sm:p-6">
					<p class="text-center text-sm text-orange-600 sm:text-base">
						👁️ You are observing this session. Toggle to participant mode to vote.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@keyframes slideInUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.thinking {
		animation: pulse 2s infinite;
	}

	.bounce-in {
		animation: scaleIn 0.3s ease-out;
	}
</style>
