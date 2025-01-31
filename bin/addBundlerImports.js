#!/usr/bin/env node

async function main() {
	await require('../src/index')();
}

main().catch((error) => {
	console.error(error);
	process.exit(10);
});
