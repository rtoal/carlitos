#!/usr/bin/env node

/*
 * A PlainScript Compiler
 *
 * This is a command line application that compiles a PlainScript program from
 * a file. Synopsis:
 *
 * ./plainscript.js -a <filename>
 *     writes out the AST and stops
 *
 * ./plainscript.js -i <filename>
 *     writes the decorated AST then stops
 *
 * ./plainscript.js <filename>
 *     compiles the PlainScript program to JavaScript, writing the generated
 *     JavaScript code to standard output.
 *
 * ./plainscript.js -o <filename>
 *     optimizes the intermediate code before generating target JavaScript.
 *
 * Output of the AST and decorated AST uses the object inspection functionality
 * built into Node.js.
 */

import * as fs from 'fs';
import * as util from 'util';
import * as yargs from 'yargs';
import './backend/javascript-generator';
import parse from './syntax/parser';

interface ICompileOptions {
  astOnly?: boolean;
  frontEndOnly?: boolean;
  shouldOptimize?: boolean;
}
// If compiling from a string, return the AST, IR, or compiled code as a string.
export function compile(sourceCode: string, { astOnly, frontEndOnly, shouldOptimize }: ICompileOptions) {
  const program = parse(sourceCode);
  if (astOnly) {
    return util.inspect(program, { depth: null });
  }
  program.analyze();
  if (frontEndOnly) {
    return util.inspect(program, { depth: null });
  }
  if (shouldOptimize) {
    return program.optimize().gen();
  }
  return program.gen();
}

// If compiling from a file, write to standard output.
export function compileFile(filename: string, options: ICompileOptions) {
  fs.readFile(filename, 'utf-8', (error, sourceCode) => {
    if (error) {
      // tslint:disable-next-line: no-console
      console.error(error);
      return;
    }
    console.log(compile(sourceCode, options));
  });
}

module.exports = { compile, compileFile };

// If running as a script, we have a lot of command line processing to do. The source
// program will come from the file who name is given as the command line argument.
if (require.main === module) {
  const { argv } = yargs.usage('$0 [-a] [-o] [-i] filename')
    .boolean(['a', 'o', 'i'])
    .describe('a', 'show abstract syntax tree after parsing then stop')
    .describe('o', 'do optimizations')
    .describe('i', 'generate and show the decorated abstract syntax tree then stop')
    .demand(1);
  compileFile(argv._[0], { astOnly: argv.a, frontEndOnly: argv.i, shouldOptimize: argv.o });
}
