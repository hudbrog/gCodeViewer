import App from './App.svelte';

const app = new App({
	target: document.getElementById('app') // Mount to the div with id 'app'
	// props can be added here if App.svelte expects any
});

export default app;
