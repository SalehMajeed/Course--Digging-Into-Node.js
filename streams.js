#!/usr/bin/env node

'use strict';

const util = require('util');
const path = require('path');
const fs = require('fs');
const transform = require('stream').Transform;
const zlib = require('zlib');
const CAF = require('caf');

const get_stdin = require('get-stdin');
const { setMaxListeners } = require('process');

function stream_complete(stream) {
	return new Promise(function c(res) {
		stream.on('end', res());
	});
}

const args = require('minimist')(process.argv.slice(2), {
	boolean: ['help', 'in', 'out', 'compress', 'uncompress'],
	string: ['file'],
});

const BASE_PATH = path.resolve(process.env.BASE_PATH || __dirname);

let OUTFILE = path.join(BASE_PATH, 'out.txt');

if (process.env.HELLO) {
	console.log(process.env.HELLO);
} else if (args.help) {
	print_help();
} else if (args.in || args._.includes('-')) {
	const too_long = CAF.timeout(3, 'Took too long');
	process_file(too_long, process.stdin).catch(error);
} else if (args.file) {
	const filepath = path.join(BASE_PATH, args.file);
	const stream = fs.createReadStream(filepath);

	const too_long = CAF.timeout(3, 'Took too long');

	process_file(too_long, stream)
		.then(function () {
			console.log('Completed!');
		})
		.catch(err => err);
} else {
	error('Incorrect Usage.', true);
}

function* process_file(signal, in_stream) {
	let out_stream = in_stream;

	if (args.uncompress) {
		let gunzip_stream = zlib.createGunzip();
		out_stream = out_stream.pipe(zlib.gunzip_stream);
	}
	const upper_stream = new transform({
		transform(chunk, enc, cb) {
			this.push(chunk.toString().toUpperCase());
			setTimeout(cb, 500);
		},
	});

	out_stream = out_stream.pipe(upper_stream);

	if (args.compress) {
		const gzip_stream = zlib.createGzip();
		out_stream = out_stream.pipe(gzip_stream);
		OUTFILE = `${OUTFILE}.gz`;
	}

	let target_stream;

	if (args.out) {
		target_stream = process.stdout;
	} else {
		target_stream = fs.createWriteStream(OUTFILE);
	}

	out_stream.pipe(target_stream);

	signal.pr.catch(function f() {
		out_stream.unpip(target_stream);
		out_stream.destroy();
	});

	yield stream_complete(out_stream);
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
	console.log('--out               print to stdout');
	console.log('--compress          gzip to output');
	console.log('--uncompress        un-gzip the input');
	console.log('');
}
