<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	type Entry = { key: string; value: string };
	let entries = $state<Entry[]>([]);
	let selectedKey = $state<string | null>(null);
	let editValue = $state('');

	function loadEntries() {
		if (typeof localStorage === 'undefined') return;
		const arr: Entry[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) arr.push({ key, value: localStorage.getItem(key) ?? '' });
		}
		entries = arr;
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

<div class="container mx-auto p-8">
	<Card class="bg-white border-red-200">
		<CardHeader class="pb-4">
			<CardTitle class="text-2xl text-red-700">LocalStorage Manager</CardTitle>
			<CardDescription class="text-gray-600">
				Manage your Planning Poker application's local storage data
			</CardDescription>
		</CardHeader>
		
		<CardContent class="space-y-6">
			<div>
				<Button 
					variant="destructive" 
					onclick={deleteAll}
					class="bg-red-600 hover:bg-red-700 text-white"
				>
					Delete All Data
				</Button>
			</div>

			<div class="space-y-4">
				{#each entries as { key, value } (key)}
					<Card class="bg-blue-50 border-blue-200">
						<CardContent class="p-4">
							<div class="flex justify-between items-start">
								<div class="space-y-2 flex-1">
									<h3 class="font-semibold text-blue-800">{key}</h3>
									{#if selectedKey === key}
										<Input
											type="text"
											bind:value={editValue}
											class="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500"
											placeholder="Edit value..."
										/>
									{:else}
										<pre class="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-auto max-h-32">{value}</pre>
									{/if}
								</div>
								<div class="flex gap-2 ml-4">
									{#if selectedKey === key}
										<Button 
											size="sm" 
											onclick={saveEdit}
											class="bg-blue-600 hover:bg-blue-700 text-white"
										>
											Save
										</Button>
										<Button 
											size="sm" 
											variant="secondary"
											onclick={() => (selectedKey = null)}
											class="bg-gray-500 hover:bg-gray-600 text-white"
										>
											Cancel
										</Button>
									{:else}
										<Button 
											size="sm" 
											variant="outline"
											onclick={() => selectEntry(key, value)}
											class="bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
										>
											Edit
										</Button>
										<Button 
											size="sm" 
											variant="destructive"
											onclick={() => deleteEntry(key)}
											class="bg-red-500 hover:bg-red-600 text-white"
										>
											Delete
										</Button>
									{/if}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
				
				{#if entries.length === 0}
					<Card class="bg-gray-50 border-gray-200">
						<CardContent class="p-6 text-center">
							<p class="text-gray-500">No localStorage data found</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

<style>
	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>