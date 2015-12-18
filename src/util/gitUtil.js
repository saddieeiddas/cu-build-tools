/**
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import git from 'gift';
import util from 'gulp-util';
import forEach from 'foreach';
import path from 'path';
import minimist from 'minimist';

export function installLibrary(name, url, branch, directory, cb) {
  const repo = git(directory);
  const argv = minimist(process.argv.slice(2));
  repo.status((statusError, status) => {
    if (statusError) {
      util.log(`${name} cloning from ${url}`);
      git.clone(url, directory, (cloneError, clonedRepo) => {
        if (cloneError) {
          util.log(util.colors.red(`ERROR: ${name} could not clone from ${url}`));
          cb();
        } else {
          clonedRepo.checkout(branch, (checkoutError) => {
            if (checkoutError) {
              util.log(util.colors.red(`${name} does not have a branch/tag/commit called ${branch}`));
            } else {
              util.log(util.colors.green(`${name} updated against origin/${branch}`));
            }
            cb();
          });
        }
      });
    } else if (status.clean === false) {
      if (argv['git-reset']) {
        repo.checkout(branch, (checkoutError) => {
          if (checkoutError) {
            util.log(util.colors.red(`${name} does not have a branch/tag/commit called ${branch}`));
            cb();
          } else {
            repo.reset('HEAD', {hard: true}, () => {
              util.log(util.colors.yellow(`${name} working directory is dirty, running reset --hard`));
              repo.pull('origin', branch, (pullError) => {
                if (pullError) {
                  util.log(util.colors.red(`${name} could not pull from origin/${branch}`));
                } else {
                  util.log(util.colors.green(`${name} updated against origin/${branch}`));
                }
                cb();
              });
            });
          }
        });
      } else {
        util.log(util.colors.red(`ERROR: ${name} working directory is dirty, please checkout files and clean the working directory`));
        cb();
      }
    } else {
      repo.checkout(branch, (checkoutError) => {
        if (checkoutError) {
          util.log(util.colors.red(`${name} does not have a branch/tag/commit called ${branch}`));
          cb();
        } else {
          util.log(name, 'is clean - updating...');
          repo.pull('origin', branch, (pullError) => {
            if (pullError) {
              util.log(util.colors.red(`${name} could not pull from origin/${branch}`));
            } else {
              util.log(util.colors.green(`${name} updated against origin/${branch}`));
            }
            cb();
          });
        }
      });
    }
  });
}

export function installLibraries(libraries, libraryRoot, cb) {
  const installQueue = [];

  forEach(libraries, (urlAndBranch, name) => {
    const directory = path.resolve(`${libraryRoot}/${name}`);
    const [url, branch] = urlAndBranch.split('#');
    installQueue.push({
      name: name,
      url: url,
      branch: branch,
      directory: directory,
    });
  });

  const installNext = () => {
    if (installQueue.length === 0) {
      cb();
    } else {
      const library = installQueue.shift();
      installLibrary(library.name, library.url, library.branch, library.directory, installNext);
    }
  };

  if (installQueue.length === 0) {
    cb();
  } else {
    installNext();
  }
}
