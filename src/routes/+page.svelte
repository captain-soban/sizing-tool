<script lang="ts">
	import { goto } from '$app/navigation';

	let sessionCode = $state('');
	let playerName = $state('');

	function generateSessionCode(): string {
		const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
		let code = '';
		for (let i = 0; i < 8; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	}

	function createSession() {
		const code = generateSessionCode();
		localStorage.setItem('sessionCode', code);
		localStorage.setItem('playerName', playerName);
		localStorage.setItem('isHost', 'true');
		goto(`/session/${code}`);
	}

	function joinSession() {
		if (sessionCode.length === 8 && playerName.trim()) {
			localStorage.setItem('sessionCode', sessionCode.toUpperCase());
			localStorage.setItem('playerName', playerName);
			localStorage.setItem('isHost', 'false');
			goto(`/session/${sessionCode.toUpperCase()}`);
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
		<h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Planning Poker</h1>
		
		<div class="space-y-6">
			<div>
				<label for="playerName" class="block text-sm font-medium text-gray-700 mb-2">
					Your Name
				</label>
				<input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Enter your name"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="space-y-4">
				<button
					onclick={createSession}
					disabled={!playerName.trim()}
					class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
				>
					Create New Session
				</button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">or</span>
					</div>
				</div>

				<div>
					<label for="sessionCode" class="block text-sm font-medium text-gray-700 mb-2">
						Session Code
					</label>
					<input
						id="sessionCode"
						type="text"
						bind:value={sessionCode}
						placeholder="Enter 8-digit code"
						maxlength="8"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
						oninput={() => sessionCode = sessionCode.toUpperCase()}
					/>
				</div>

				<button
					onclick={joinSession}
					disabled={!playerName.trim() || sessionCode.length !== 8}
					class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
				>
					Join Session
				</button>
			</div>
		</div>
	</div>
</div>
