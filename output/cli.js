"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arg_1 = __importDefault(require("arg"));
const inquirer_1 = __importDefault(require("inquirer"));
const inquirer_fuzzy_path_1 = __importDefault(require("inquirer-fuzzy-path"));
const execa_1 = __importDefault(require("execa"));
inquirer_1.default.registerPrompt("fuzzypath", inquirer_fuzzy_path_1.default);
function parseArgumentsIntoOptions(rawArgs) {
    const args = arg_1.default({
        "--dir": String,
        "--git": Boolean,
        "--yes": Boolean,
        "--install": Boolean,
        "--init": Boolean,
        "-g": "--git",
        "-y": "--yes",
        "-d": "--dir",
        "-i": "--init"
    }, {
        argv: rawArgs.slice(2)
    });
    return {
        skipPrompts: args["--yes"] || false,
        git: args["--git"] || false,
        template: args._[0],
        runInstall: args["--install"] || false,
        dir: args._[1],
        directory: args._[2],
        init: args["--init"] || false
    };
}
async function promptForMissingOptions(options) {
    const currDir = process.cwd();
    const defaultTemplate = "Javascript";
    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate
        };
    }
    // CLEAR THE TERMINAL
    process.stdout.write("\x1bc");
    const questions = [];
    if (!options.init) {
        questions.push({
            type: "list",
            name: "dir",
            message: "Choose where to create/find git repository",
            choices: [`Current Directory(${currDir})`, "Choose Directory"],
            default: `Current Directory(${currDir})`
        });
    }
    // if (!options.template) {
    //   questions.push({
    //     type: "list",
    //     name: "template",
    //     message: "Please choose which project template to use",
    //     choices: ["Javascript", "Typescript"],
    //     default: defaultTemplate
    //   });
    // }
    // if (!options.git) {
    //   questions.push({
    //     type: "confirm",
    //     name: "git",
    //     message: "Initialize a git repository?",
    //     default: false
    //   });
    // }
    let answers = await inquirer_1.default.prompt(questions);
    questions.length = 0;
    if (answers.dir === "Choose Directory") {
        questions.push({
            type: "fuzzypath",
            name: "directory",
            message: "Give the absolute path to the directory",
            itemType: "directory",
            rootPath: currDir,
            suggestOnly: true
        });
    }
    else {
        answers.directory = currDir;
    }
    answers = {
        ...answers,
        ...(await inquirer_1.default.prompt(questions))
    };
    try {
        const gitTest = await execa_1.default(`if [ -d .git ]; then
      echo 0;
    else
      echo 1;
    fi;`, {
            cwd: answers.directory,
            shell: true
        });
        questions.length = 0;
        if (gitTest.stdout === "1") {
            questions.push({
                type: "confirm",
                name: "init",
                message: "Selected directory was not a git repo. Initalize one?",
                default: true
            });
        }
    }
    catch (error) {
        if (error.code === "ENOENT") {
            console.log("This directory does not exist. Try again.");
        }
    }
    finally {
        answers = {
            ...answers,
            ...(await inquirer_1.default.prompt(questions))
        };
    }
    return {
        ...options,
        template: options.template || answers.template,
        git: options.git || answers.git,
        dir: options.dir || answers.dir,
        init: options.init || answers.init
    };
}
async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    try {
        options = await promptForMissingOptions(options);
    }
    catch (error) {
        console.log(error);
    }
    console.log(options);
}
exports.cli = cli;
