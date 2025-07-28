export interface Participant {
	name: string;
	voted: boolean;
	vote?: string;
	isHost: boolean;
	isObserver?: boolean;
}

export interface SessionState {
	sessionCode: string;
	sessionTitle: string;
	participants: Participant[];
	votingInProgress: boolean;
	votesRevealed: boolean;
	voteAverage: string;
	finalEstimate: string;
	storyPointScale: string[];
}

export const defaultStoryPointScales = {
	fibonacci_0_8: ['0', '1', '2', '3', '5', '8', '?'],
	fibonacci_1_8: ['1', '2', '3', '5', '8', '?'],
	fibonacci_0_13: ['0', '1', '2', '3', '5', '8', '13', '?'],
	tshirt: ['XS', 'S', 'M', 'L', 'XL', '?'],
	linear: ['1', '2', '3', '4', '5', '6', '7', '8', '?']
};

export function createLocalStore<T>(key: string, initialValue: T) {
	let storedValue: T;

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		storedValue = stored ? JSON.parse(stored) : initialValue;
	} else {
		storedValue = initialValue;
	}

	let value = $state(storedValue);

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return {
		get value() {
			return value;
		},
		set value(newValue: T) {
			value = newValue;
		}
	};
}

export function generateSessionCode(): string {
	const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}
