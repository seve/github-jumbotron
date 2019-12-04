import arg from "arg";
import inquirer from "inquirer";
import fuzzypath from "inquirer-fuzzy-path";
import execa from "execa";

inquirer.registerPrompt("fuzzypath", fuzzypath);

interface Options {
  skipPrompts: boolean;
  template: string;
  git: boolean;
  runInstall: boolean;
  dir: string;
  directory: string;
  init: boolean;
}

function parseArgumentsIntoOptions(rawArgs: Array<string>): Options {
  const args = arg(
    {
      "--dir": String,
      "--git": Boolean,
      "--yes": Boolean,
      "--install": Boolean,
      "--init": Boolean,
      "-g": "--git",
      "-y": "--yes",
      "-d": "--dir",
      "-i": "--init"
    },
    {
      argv: rawArgs.slice(2)
    }
  );
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

async function promptForMissingOptions(options: Options): Promise<Options> {
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
  let answers = await inquirer.prompt<Options>(questions);
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
  } else {
    answers.directory = currDir;
  }
  answers = {
    ...answers,
    ...(await inquirer.prompt<Options>(questions))
  };
  while (questions.length > 0) {
    try {
      const gitTest = await execa(
        `if [ -d .git ]; then
      echo 0;
    else
      echo 1;
    fi;`,
        {
          cwd: answers.directory,
          shell: true
        }
      );
      questions.length = 0;

      if (gitTest.stdout === "1") {
        questions.push({
          type: "confirm",
          name: "init",
          message: "Selected directory was not a git repo. Initalize one?",
          default: true
        });
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("This directory does not exist. Try again.");
      }
    } finally {
      answers = {
        ...answers,
        ...(await inquirer.prompt<Options>(questions))
      };
    }
  }

  return {
    ...options,
    template: options.template || answers.template,
    git: options.git || answers.git,
    dir: options.dir || answers.dir,
    init: options.init || answers.init
  };
}
export async function cli(args: Array<string>) {
  let options = parseArgumentsIntoOptions(args);
  try {
    options = await promptForMissingOptions(options);
  } catch (error) {
    console.log(error);
  }
  console.log(options);
}
