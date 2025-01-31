
const fs = require('fs');
const path = require('path');

module.exports = async function () {
	let directory = process.cwd();
	if (!fs.existsSync(path.join(directory, 'npmscripts.config.js'))) {
		console.error('No "npmscripts.config.js" found in current directory!');
		process.exit(1);
	}
	const npmScriptsConfig = require(path.resolve('npmscripts.config.js'));

	if (npmScriptsConfig?.build?.bundler?.config?.imports === undefined) {
		console.info('npmscripts.config.js does not contain any bundler imports. So nothing to do!')
		process.exit(2);
	}

	let outputDir = npmScriptsConfig?.build?.output;
	if (outputDir === undefined) {
		outputDir = 'build/node/packageRunBuild/resources';
	}

	let npmScriptsOutputPackageJson = path.resolve(directory, outputDir, 'package.json');
	if (!fs.existsSync(npmScriptsOutputPackageJson)) {
		console.error('No "%s" found! Cannot patch anything.', npmScriptsOutputPackageJson);
	}
	const pkgJson = require(npmScriptsOutputPackageJson);
	if (pkgJson.dependencies === undefined) {
		pkgJson.dependencies = {};
	}
	let bundlersImports = npmScriptsConfig.build.bundler.config.imports;
	Object.entries(bundlersImports).forEach(([npmBundle, versionMapping]) => {
		if (versionMapping["/"] === undefined) {
			console.error('Bundler import for "%s" does not have a "/" version mapping! ' +
				'Therefore skipping adding it to the generated package.json', npmBundle);
		} else {
			pkgJson.dependencies[npmBundle] = versionMapping["/"];
		}
	});

	fs.writeFileSync(
		npmScriptsOutputPackageJson,
		JSON.stringify(pkgJson, null, '\t'),
		'utf8'
	);
	let addedNpmBundles = Object.entries(bundlersImports)
		.filter(([ignoredNpmBundle, versionMapping]) => versionMapping["/"] !== undefined)
		.map(([npmBundle, ignored]) => '\t - ' + npmBundle)
		.join('\n');

	console.info('Added the following bundler imports to the generated package.json!\n%s',
		addedNpmBundles);
}
