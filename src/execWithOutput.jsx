import { exec } from '@actions/exec';
import * as core from '@actions/core';

export function execWithOutput(command, args) {
  return new Promise((resolve, reject) => {
    try {
      exec(command, args, {
        listeners: {
          stdout: function (res) {
            core.info(res.toString());
            resolve(res.toString());
          },
          stderr: function (res) {
            core.info(res.toString());
            reject(res.toString());
          }
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
