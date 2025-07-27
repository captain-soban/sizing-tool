<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

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

	function handleSessionCodeInput(event: Event) {
		const target = event.target as HTMLInputElement;
		sessionCode = target.value.toUpperCase();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-3xl font-bold text-center">Planning Poker</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<label for="playerName" class="text-sm font-medium">
					Your Name
				</label>
				<Input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Enter your name"
				/>
			</div>

			<div class="space-y-4">
				<Button
					onclick={createSession}
					disabled={!playerName.trim()}
					class="w-full"
				>
					Create New Session
				</Button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">or</span>
					</div>
				</div>

				<div class="space-y-2">
					<label for="sessionCode" class="text-sm font-medium">
						Session Code
					</label>
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
					disabled={!playerName.trim() || sessionCode.length !== 8}
					variant="secondary"
					class="w-full"
				>
					Join Session
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
