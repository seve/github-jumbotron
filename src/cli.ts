// ➜  ~ GIT_AUTHOR_DATE='Fri Jul 26 19:32:10 2013 -0400' GIT_COMMITTER_DATE='Fri Jul 26 19:32:10 2013 -0400' git commit --allow-empty --allow-empty-message -m ""
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
  currDir: boolean;
  init: boolean;
}

function parseArgumentsIntoOptions(rawArgs: Array<string>): Options {
  console.log(rawArgs);

  const args = arg(
    {
      "--dir": String,
      "--git": Boolean,
      "--yes": Boolean,
      "--install": Boolean,
      "--init": Boolean,
      "--current-dir": Boolean,
      "-g": "--git",
      "-y": "--yes",
      "-d": "--dir",
      "-i": "--init",
      "-cd": "--current-dir"
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
    currDir: args["--current-dir"] || false,
    dir: args._[1],
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

  let gitDirectoryFound = false;
  let answers = <Options>{};

  /* eslint-disable no-await-in-loop */

  while (!gitDirectoryFound) {
    const questions = [];

    if (!options.currDir) {
      questions.push({
        type: "list",
        name: "currDir",
        message: "Choose where to create/find git repository",
        choices: [`Current Directory(${currDir})`, "Choose Directory"],
        default: `Current Directory(${currDir})`
      });
    }

    const questionAnswer = await inquirer.prompt<any>(questions); // Ask user curr directory or input
    questions.length = 0; // Remove curr directory question

    answers = {
      ...answers,
      currDir: questionAnswer.currDir === `Current Directory(${currDir})`
    };

    if (!answers.currDir) {
      questions.push({
        type: "fuzzypath",
        name: "dir",
        message: "Give the absolute path to the directory",
        itemType: "directory",
        rootPath: currDir,
        suggestOnly: true
      });

      answers = {
        ...answers,
        ...(await inquirer.prompt<Options>(questions)) // Ask user for to input directory
      };
      questions.length = 0; // If an error is not thrown delete the absolute path question
    } else {
      answers.dir = currDir; // Set curr directory if not choosing directory
    }

    try {
      const gitTest = await execa(
        `if [ -d .git ]; then
      echo 0;
    else
      echo 1;
    fi;`,
        {
          cwd: answers.dir,
          shell: true
        }
      );

      if (gitTest.stdout === "1") {
        questions.push({
          type: "confirm",
          name: "init",
          message: "Selected directory was not a git repo. Initalize one here?",
          default: true
        });
      } else {
        gitDirectoryFound = true;
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("This directory does not exist. Try again.");
        answers.dir = "";
      } else {
        console.log("ERROR:", error);
      }
    } finally {
      answers = {
        ...answers,
        ...(await inquirer.prompt<Options>(questions)) // Ask if user wants to iniatilize a git repo
      };
      questions.length = 0; // Remove the git init question

      if (
        !gitDirectoryFound &&
        (answers.init === false || answers.dir === "")
      ) {
        // If the user doesn't want to initialize a repo or incorrectly selected a directory
        // Reset the answers and start from the beginning
        answers.currDir = false;
      } else {
        // create git directory
        gitDirectoryFound = true;
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  return {
    ...options,
    template: options.template || answers.template,
    git: options.git || answers.git,
    dir: options.dir || answers.dir,
    init: options.init || answers.init
  };
}

export default async (args: Array<string>): Promise<void> => {
  let options = parseArgumentsIntoOptions(args);
  try {
    options = await promptForMissingOptions(options);
  } catch (error) {
    console.log(error);
  }
  console.log(options);
};
