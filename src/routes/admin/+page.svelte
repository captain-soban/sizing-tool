<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { theme, toggleTheme } from '$lib/stores/theme.svelte';

	type Entry = { key: string; value: string };
	let entries = $state<Entry[]>([]);
	let selectedKey = $state<string | null>(null);
	let editValue = $state('');

	function loadEntries() {
		if (typeof localStorage === 'undefined') return;
		const arr: Entry[] = [];
		console.log('Loading localStorage entries, total keys:', localStorage.length);
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) {
				const value = localStorage.getItem(key) ?? '';
				console.log('Found key:', key, 'Value:', value);
				arr.push({ key, value });
			}
		}
		entries = arr;
		console.log('Loaded entries:', entries);
	}

	function selectEntry(key: string, value: string) {
		selectedKey = key;
		editValue = value;
	}

	function saveEdit() {
		if (selectedKey && typeof localStorage !== 'undefined') {
			localStorage.setItem(selectedKey, editValue);
			loadEntries();
			selectedKey = null;
		}
	}

	function deleteEntry(key: string) {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(key);
			loadEntries();
		}
	}

	function deleteAll() {
		if (typeof localStorage !== 'undefined') {
			localStorage.clear();
			loadEntries();
		}
	}

	onMount(loadEntries);
</script>

<!-- Navigation -->
<nav
	class="px-6 py-4 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-gray-200/60 dark:border-gray-700/60 top-0 shadow-sm sticky z-50 w-full border-b"
>
	<div class="container mx-auto">
		<div class="flex items-center justify-between">
			<div class="space-x-12 flex items-center">
				<a
					href="/"
					class="text-gray-700 dark:text-gray-300 hover:text-red-600 font-medium text-lg transition-all duration-200"
				>
					Home
				</a>
				<a href="/admin" class="text-red-600 font-medium text-lg"> Admin </a>
			</div>
			<div class="space-x-4 flex items-center">
				<!-- Theme Toggle -->
				<Button
					variant="ghost"
					size="sm"
					class="w-9 h-9 p-0 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-300"
					onclick={toggleTheme}
				>
					{#if theme.value === 'light'}
						<span class="text-lg">🌙</span>
					{:else}
						<span class="text-lg">☀️</span>
					{/if}
				</Button>
				<Button
					class="from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl text-lg bg-gradient-to-r transition-all duration-300 hover:scale-105"
					onclick={() => (window.location.href = '/sizes')}
				>
					Start Sizing
				</Button>
			</div>
		</div>
	</div>
</nav>

<div class="from-blue-50 via-white to-red-50 p-8 min-h-screen bg-gradient-to-br">
	<div class="p-8 container mx-auto">
		<Card
			class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-red-500 rounded-2xl shadow-xl border-2"
		>
			<CardHeader class="pb-4">
				<CardTitle class="text-3xl text-red-600 dark:text-red-400 font-bold"
					>🛠️ LocalStorage Manager</CardTitle
				>
				<CardDescription class="text-gray-600 dark:text-gray-300 text-lg">
					Manage your Planning Poker application's local storage data. This is for development and
					debugging purposes.
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6">
				<div class="gap-4 flex">
					<Button
						onclick={loadEntries}
						class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
					>
						🔄 Refresh Data
					</Button>
					<Button
						variant="destructive"
						onclick={deleteAll}
						class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
					>
						🗑️ Delete All Data
					</Button>
				</div>

				<div class="space-y-4">
					{#each entries as { key, value } (key)}
						<Card
							class="bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 rounded-xl shadow-lg hover:shadow-xl border-2 transition-all duration-300 hover:scale-[1.01]"
						>
							<CardContent class="p-6">
								<div class="flex items-start justify-between">
									<div class="space-y-2 flex-1">
										<h3 class="font-bold text-blue-800 dark:text-blue-300 text-lg">🔑 {key}</h3>
										{#if selectedKey === key}
											<Input
												type="text"
												bind:value={editValue}
												class="bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-500 focus:border-blue-500 focus:ring-blue-500 text-gray-900 dark:text-gray-100 rounded-lg"
												placeholder="Edit value..."
											/>
										{:else}
											<pre
												class="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 p-4 rounded-lg border-gray-200 dark:border-gray-600 max-h-32 overflow-auto border-2">{value}</pre>
										{/if}
									</div>
									<div class="gap-2 ml-4 flex">
										{#if selectedKey === key}
											<Button
												size="sm"
												onclick={saveEdit}
												class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
											>
												💾 Save
											</Button>
											<Button
												size="sm"
												variant="secondary"
												onclick={() => (selectedKey = null)}
												class="bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
											>
												❌ Cancel
											</Button>
										{:else}
											<Button
												size="sm"
												variant="outline"
												onclick={() => selectEntry(key, value)}
												class="bg-green-500 hover:bg-green-600 text-white border-green-400 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
											>
												✏️ Edit
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onclick={() => deleteEntry(key)}
												class="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
											>
												🗑️ Delete
											</Button>
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}

					{#if entries.length === 0}
						<Card
							class="bg-gray-50/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg border-2"
						>
							<CardContent class="p-8 text-center">
								<div class="text-6xl mb-4">📦</div>
								<p class="text-gray-500 dark:text-gray-400 text-lg">No localStorage data found</p>
								<p class="text-gray-400 dark:text-gray-500 text-sm mt-2">
									Use the app to create some data, then it will appear here!
								</p>
							</CardContent>
						</Card>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</div>

<style>
	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
