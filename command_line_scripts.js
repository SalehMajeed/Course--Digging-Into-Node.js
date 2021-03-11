#!/usr/bin/env node

'use strict';

const util = require('util');
const path = require('path');
const fs = require('fs');

const get_stdin = require('get-stdin');

const args = require('minimist')(process.argv.slice(2), {
	boolean: ['help', 'in'],
	string: ['file'],
});

const BASE_PATH = path.resolve(process.env.BASE_PATH || __dirname);

if (process.env.HELLO) {
	console.log(process.env.HELLO);
} else if (args.help) {
	print_help();
} else if (args.in || args._.includes('-')) {
	get_stdin().then(process_file()).catch(error);
} else if (args.file) {
	const filepath = path.join(BASE_PATH, args.file);

	let contents = fs.readFile(filepath, function on_contents(err, contents) {
		if (err) {
			error(err.toString());
		} else {
			process_file(contents.toString());
		}
	});

	// const contents = fs.readFileSync(filepath, 'utf-8');
	// console.log(contents);
	// process.stdout.write(contents);
	process_file(filepath);
	console.log(__dirname);
	console.log(filepath);
} else {
	error('Incorrect Usage.', true);
}

function process_file(filepath) {
	let contents = filepath.toString().toUpperCase();
	process.stdout.write(contents);
}

function error(msg, includeHelp = false) {
	console.log(msg);
	if (includeHelp) {
		console.log('');
		print_help();
	}
}

function print_help() {
	console.log('command_line_scripts.js usage:');
	console.log('command_line_scripts.js --file={FILENAME}');
	console.log('');
	console.log('--help      print this help');
	console.log('--file={FILENAME}   process the file');
	console.log('--in, -             process stdin');
	console.log('');
}
