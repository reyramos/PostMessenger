/**
 * Created by ramor11 on 5/24/2017.
 */
// " ../../../node_modules/.bin/tsc" --module amd --removeComments --target es5 post-messenger.ts


var shell = require('shelljs');
var rimraf = require('rimraf');
var json = require('./tsconfig.json').compilerOptions;
var args = {
  file: 'app/post-messenger.ts'
};
process.argv.forEach(function (val, index) {
  if (/--/.test(val)) {
    args[val.replace(/--/, '')] = index + 1 ? process.argv[index + 1] : "";
  }
});

if (!args.file)throw "Missing --file parameter";

var command = ["\"../../../node_modules/.bin/tsc\"", "--project ./tsconfig.json"];
Object.keys(json).forEach(function (o) {

  if (o !== 'paths') {
    if (typeof json[o] === "string" || typeof json[o] === "boolean") {
      command.push("--" + o + " " + json[o])
    } else {
      command.push("--" + o + " " + (json[o].join()))
    }
  }
});

Object.keys(args).forEach(function (o) {
  if (o !== 'file') command.push("--" + o);
});

// command.push(args.file);
// console.log(command)

var cmd = command.join(" ");
rimraf(args.file.replace(/\.ts$/, '.js'), function (err) {

  console.log(cmd + "\r\r");
  shell.exec(cmd);


});

