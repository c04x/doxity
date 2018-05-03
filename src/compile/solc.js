import fs from 'fs';
import childProcess from 'child_process';
import Config from 'truffle-config';
import Resolver from 'truffle-resolver';
import compile from 'truffle-compile';

export default function (src) {
  // detect if we're in a truffle project
  return new Promise((resolve) => {
    const isTruffleProject = fs.existsSync(`${process.cwd()}/truffle.js`);
    console.log(isTruffleProject? 'using truffle' : 'no truffle config file found, using solc directly');
    if (isTruffleProject) {
      const config = Config.default();
      config.resolver = new Resolver(config);
      config.rawData = true;
      compile.all(config, (err, res) => {
        if (err) { throw err; }
        resolve({
          contracts: Object.keys(res).reduce((o, k) => {
            const { metadata, ...data } = res[k].rawData;
            try {
              const parsed = JSON.parse(metadata || '{}');

              // I don't know what this code is about at it works on my environment without it
              // const fN = Object.keys(parsed.settings.compilationTarget)[0];
              // data.fileName = fN.indexOf(process.cwd()) === 0 ? fN : `${process.cwd()}/node_modules/${fN}`;
              data.fileName =  res[k].sourcePath;

              data.output = parsed.output;
            } catch (e) {
              console.log(`⚠️ Error parsing Contract: ${k}`);
            }
            return {
              ...o,
              [k]: data,
            };
          }, {}),
        });
      });
    } else {
      const exec = `solc --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc ${src}`;
      const res = JSON.parse(childProcess.execSync(exec));
      resolve({
        contracts: Object.keys(res.contracts).reduce((o, k) => {
          const file = k.split(':')[0];
          const fileFragments = file.split('/');
          const contractName = fileFragments[fileFragments.length - 1].split('.sol')[0];
          const contract = res.contracts[k];
          const fileName = `${process.cwd()}/${k.split(':')[0]}`;
          return {
            ...o,
            [contractName]: {
              ...contract,
              fileName,
              abi: JSON.parse(contract.abi),
              devdoc: JSON.parse(contract.devdoc),
              userdoc: JSON.parse(contract.userdoc),
            },
          };
        }, {}),
      });
    }
  });
}
