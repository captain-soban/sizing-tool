<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { localStore } from '$lib/localStore.svelte';

	// Round history type
	type Round = {
		story: string;
		votes: Record<string, string>;
		revealed: boolean;
		timestamp: number;
	};

	// Game state type
	type GameState = {
		sessionCode: string;
		playerName: string;
		isHost: boolean;
		gameStarted: boolean;
		currentStory: string;
		votes: Record<string, string>;
		revealed: boolean;
		selectedCard: string | null;
		rounds: Round[];
		timestamp?: number;
	};

	// Game state
	let gameState = localStore<GameState>('poker-game', {
		sessionCode: '',
		playerName: '',
		isHost: false,
		gameStarted: false,
		currentStory: '',
		votes: {} as Record<string, string>,
		revealed: false,
		selectedCard: null as string | null,
		rounds: []
	});

	// Session history store
	let sessionHistory = localStore<GameState[]>('poker-sessions', []);

	// Reactive values from the store
	let sessionCode = $state('');
	let playerName = $state('');
	let isHost = $state(false);
	let gameStarted = $state(false);
	let currentStory = $state('');
	let votes = $state<Record<string, string>>({});
	let revealed = $state(false);
	let selectedCard = $state<string | null>(null);
	let rounds = $state<Round[]>([]);

	// Subscribe to store changes using $effect for Svelte 5
	$effect(() => {
		const value = gameState.value;
		sessionCode = value.sessionCode;
		playerName = value.playerName;
		isHost = value.isHost;
		gameStarted = value.gameStarted;
		currentStory = value.currentStory;
		votes = value.votes;
		revealed = value.revealed;
		selectedCard = value.selectedCard;
		rounds = value.rounds || [];
	});

	// Card values for different scales
	const fibonacciCards = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', ''];
	const tshirtCards = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', ''];

	let currentScale = $state('fibonacci');
	let cards = $state(fibonacciCards);

	// Form inputs
	let sessionInput = $state('');
	let playerNameInput = $state('');
	let storyInput = $state('');

	function generateSessionCode() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0, O, 1, I for clarity
		return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
			''
		);
	}

	function saveSessionToHistory() {
		const currentSession = gameState.value;
		if (currentSession.sessionCode && currentSession.gameStarted) {
			sessionHistory.update((history: GameState[]) => {
				// Remove any existing session with same code and add current one
				const filtered = history.filter((s) => s.sessionCode !== currentSession.sessionCode);
				return [...filtered, { ...currentSession, timestamp: Date.now() }];
			});
		}
	}

	function startNewSession() {
		if (!playerNameInput.trim()) return;

		gameState.update((state: GameState) => ({
			...state,
			sessionCode: generateSessionCode(),
			playerName: playerNameInput.trim(),
			isHost: true,
			gameStarted: true,
			votes: {},
			revealed: false,
			selectedCard: null,
			rounds: []
		}));
		saveSessionToHistory();
	}

	function joinSession() {
		if (!sessionInput.trim() || !playerNameInput.trim()) return;

		gameState.update((state: GameState) => ({
			...state,
			sessionCode: sessionInput.trim().toUpperCase(),
			playerName: playerNameInput.trim(),
			isHost: false,
			gameStarted: true,
			votes: {},
			revealed: false,
			selectedCard: null,
			rounds: state.rounds || []
		}));
		saveSessionToHistory();
	}

	function selectCard(value: string) {
		gameState.update((state: GameState) => ({
			...state,
			selectedCard: value,
			votes: { ...state.votes, [state.playerName]: value }
		}));
	}

	function revealCards() {
		gameState.update((state: GameState) => ({ ...state, revealed: true }));
		saveSessionToHistory();
	}

	function newRound() {
		gameState.update((state: GameState) => {
			// Save current round to history if it has votes
			const currentRound: Round = {
				story: state.currentStory,
				votes: state.votes,
				revealed: state.revealed,
				timestamp: Date.now()
			};

			const newRounds =
				Object.keys(state.votes).length > 0 ? [...state.rounds, currentRound] : state.rounds;

			return {
				...state,
				rounds: newRounds,
				votes: {},
				revealed: false,
				selectedCard: null,
				currentStory: storyInput.trim()
			};
		});
		saveSessionToHistory();
	}

	function changeScale(scale: string) {
		currentScale = scale;
		cards = scale === 'fibonacci' ? fibonacciCards : tshirtCards;
		gameState.update((state: GameState) => ({ ...state, selectedCard: null }));
	}

	function resetGame() {
		gameState.update((state: GameState) => ({
			...state,
			sessionCode: '',
			playerName: '',
			isHost: false,
			gameStarted: false,
			currentStory: '',
			votes: {},
			revealed: false,
			selectedCard: null,
			rounds: []
		}));
	}

	// Calculate vote statistics
	$effect(() => {
		if (revealed && Object.keys(votes).length > 0) {
			const numericVotes = Object.values(votes)
				.filter((vote) => !isNaN(Number(vote)) && vote !== '?' && vote !== '')
				.map(Number);

			if (numericVotes.length > 0) {
				const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
				console.log(`Average: ${avg.toFixed(1)}`);
			}
		}
	});
</script>

<!-- Navigation -->
<nav
	class="px-6 py-4 backdrop-blur-md bg-white/90 border-gray-200/60 top-0 shadow-sm sticky z-50 w-full border-b"
>
	<div class="container mx-auto">
		<div class="space-x-12 flex items-center justify-center">
			<a
				href="/"
				class="text-gray-700 hover:text-red-600 font-medium text-lg transition-all duration-200"
			>
				Home
			</a>
			<Button
				variant="ghost"
				class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400 text-lg"
				onclick={() => (window.location.href = '/admin')}
			>
				Admin
			</Button>
			<Button
				class="from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl text-lg bg-gradient-to-r transition-all duration-200"
				onclick={() => (window.location.href = '/sizes')}
			>
				Start Sizing
			</Button>
		</div>
	</div>
</nav>

<div class="from-blue-50 via-white to-red-50 p-6 min-h-screen bg-gradient-to-br">
	<div class="max-w-6xl container mx-auto">
		{#if !gameStarted}
			<!-- Session Setup -->
			<div class="flex min-h-[80vh] items-center justify-center">
				<Card class="bg-white border-blue-200 shadow-xl max-w-md w-full">
					<CardContent class="p-8 space-y-6 text-center">
						<h1 class="text-3xl font-bold text-blue-800 mb-2">Planning Poker</h1>
						<p class="text-gray-600 mb-8">Choose your story points collaboratively</p>

						<div class="space-y-4">
							<Input
								type="text"
								placeholder="Your name"
								bind:value={playerNameInput}
								class="text-lg p-4 text-center"
							/>

							<div class="space-y-3 flex flex-col">
								<Button
									onclick={startNewSession}
									disabled={!playerNameInput.trim()}
									class="from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-3 text-lg bg-gradient-to-r"
								>
									Start New Session
								</Button>

								<div class="space-x-2 flex items-center">
									<hr class="border-gray-300 flex-1" />
									<span class="text-gray-500 text-sm">or</span>
									<hr class="border-gray-300 flex-1" />
								</div>

								<div class="space-y-2">
									<Input
										type="text"
										placeholder="Session Code"
										bind:value={sessionInput}
										class="text-lg p-3 text-center uppercase"
										maxlength={8}
									/>
									<Button
										onclick={joinSession}
										disabled={!sessionInput.trim() || !playerNameInput.trim()}
										variant="outline"
										class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400 py-3 text-lg w-full"
									>
										Join Session
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Game Interface -->
			<div class="space-y-6">
				<!-- Header -->
				<Card class="bg-white border-blue-200 shadow-lg">
					<CardContent class="p-6">
						<div
							class="md:flex-row space-y-4 md:space-y-0 flex flex-col items-center justify-between"
						>
							<div class="md:text-left text-center">
								<h1 class="text-2xl font-bold text-blue-800">Session: {sessionCode}</h1>
								<p class="text-gray-600">Player: <span class="font-semibold">{playerName}</span></p>
							</div>

							<div class="space-x-4 flex items-center">
								<!-- Scale Selector -->
								<div class="bg-gray-100 rounded-lg p-1 flex">
									<button
										onclick={() => changeScale('fibonacci')}
										class="px-4 py-2 rounded-md transition-colors {currentScale === 'fibonacci'
											? 'bg-blue-600 text-white'
											: 'text-gray-600 hover:bg-gray-200'}"
									>
										Fibonacci
									</button>
									<button
										onclick={() => changeScale('tshirt')}
										class="px-4 py-2 rounded-md transition-colors {currentScale === 'tshirt'
											? 'bg-blue-600 text-white'
											: 'text-gray-600 hover:bg-gray-200'}"
									>
										T-Shirts
									</button>
								</div>

								<Button
									onclick={resetGame}
									variant="outline"
									class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
								>
									Leave Session
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Story Input (Host only) -->
				{#if isHost}
					<Card class="bg-white border-green-200 shadow-lg">
						<CardContent class="p-6">
							<div class="space-x-4 flex items-center">
								<Input
									type="text"
									placeholder="Enter the story/feature to estimate..."
									bind:value={storyInput}
									class="text-lg p-3 flex-1"
								/>
								<Button
									onclick={newRound}
									class="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
								>
									New Round
								</Button>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Current Story -->
				{#if currentStory}
					<Card class="bg-yellow-50 border-yellow-200 shadow-lg">
						<CardContent class="p-6 text-center">
							<h2 class="text-xl font-semibold text-gray-800 mb-2">Current Story</h2>
							<p class="text-lg text-gray-700">{currentStory}</p>
						</CardContent>
					</Card>
				{/if}

				<!-- Voting Cards -->
				<Card class="bg-white border-gray-200 shadow-lg">
					<CardContent class="p-6">
						<h2 class="text-xl font-semibold mb-6 text-gray-800 text-center">
							{revealed ? 'Votes Revealed' : 'Choose Your Card'}
						</h2>

						<div
							class="md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-4xl mb-6 mx-auto grid grid-cols-4"
						>
							{#each cards as card (card)}
								<button
									onclick={() => selectCard(card)}
									disabled={revealed}
									class="bg-white rounded-xl shadow-lg hover:shadow-xl text-2xl font-bold flex aspect-[3/4] items-center justify-center border-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 {selectedCard ===
									card
										? 'border-blue-500 bg-blue-50 scale-105'
										: 'border-gray-300 hover:border-blue-300'} {revealed
										? 'cursor-not-allowed opacity-60'
										: 'hover:bg-blue-50 cursor-pointer'}"
								>
									{card === '' ? '' : card}
								</button>
							{/each}
						</div>

						<!-- Action Buttons -->
						<div class="space-x-4 flex justify-center">
							{#if isHost}
								{#if !revealed}
									<Button
										onclick={revealCards}
										disabled={Object.keys(votes).length === 0}
										class="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
									>
										Reveal Cards
									</Button>
								{:else}
									<Button
										onclick={newRound}
										class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
									>
										Start New Round
									</Button>
								{/if}
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Results -->
				{#if revealed && Object.keys(votes).length > 0}
					<Card class="bg-white border-green-200 shadow-lg">
						<CardContent class="p-6">
							<h2 class="text-xl font-semibold mb-6 text-gray-800 text-center">Results</h2>
							<div class="md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto grid grid-cols-1">
								{#each Object.entries(votes) as [player, vote] (player)}
									<div class="bg-gray-50 border-gray-200 rounded-lg p-4 border text-center">
										<div class="font-semibold text-gray-800 mb-2">{player}</div>
										<div class="text-3xl font-bold text-blue-600">
											{vote === '' ? '' : vote}
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- Players waiting indicator -->
				{#if !revealed && Object.keys(votes).length > 0}
					<Card class="bg-blue-50 border-blue-200 shadow-lg">
						<CardContent class="p-4 text-center">
							<p class="text-blue-800">
								<span class="font-semibold">{Object.keys(votes).length}</span>
								{Object.keys(votes).length === 1 ? 'player has' : 'players have'} voted
							</p>
						</CardContent>
					</Card>
				{/if}

				<!-- Previous Rounds History -->
				{#if rounds.length > 0}
					<Card class="bg-white border-gray-200 shadow-lg">
						<CardContent class="p-6">
							<h2 class="text-xl font-semibold mb-6 text-gray-800 text-center">
								Previous Rounds ({rounds.length})
							</h2>
							<div class="space-y-4 max-h-96 overflow-y-auto">
								{#each rounds.slice().reverse() as round, index (round.timestamp)}
									<div class="bg-gray-50 border-gray-200 rounded-lg p-4 border">
										<div class="mb-3 flex items-start justify-between">
											<h3 class="font-semibold text-gray-800">
												{round.story || `Round ${rounds.length - index}`}
											</h3>
											<span class="text-sm text-gray-500">
												{round.timestamp
													? new Date(round.timestamp).toLocaleTimeString()
													: 'Unknown time'}
											</span>
										</div>
										<div class="md:grid-cols-4 lg:grid-cols-6 gap-2 grid grid-cols-2">
											{#each Object.entries(round.votes || {}) as [player, vote] (player)}
												<div
													class="bg-white border-gray-200 rounded p-2 text-sm border text-center"
												>
													<div class="font-medium text-gray-700">{player}</div>
													<div class="text-lg font-bold text-blue-600">{vote || '?'}</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		{/if}
	</div>
</div>
