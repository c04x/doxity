import fs from 'fs';
import childProcess from 'child_process';
import path from 'path';

import { clearDirectory } from './helpers';

export default function ({ target, out }) {
  // TODO check folder exists...
  const cwd = path.normalize(`${process.cwd()}/${target}`);
  const outputFolder = `${cwd}/public`;
  const destFolder = `${process.cwd()}/${out}`;
  clearDirectory(destFolder).then(() => {
    const npmCommand = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'; // 🙄
    const runDev = childProcess.spawn(npmCommand, ['run', 'build'], { cwd });
    runDev.stdout.pipe(process.stdout);
    runDev.stderr.pipe(process.stderr);
    runDev.on('close', () => {
      fs.renameSync(outputFolder, destFolder);
      process.stdout.write(`Published Documentation to ${destFolder}\n`);
      process.exit();
    });
  });
}
