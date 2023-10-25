import fs from "fs";
import * as nodePath from "path";
import { shouldExcludePath } from "./should-exclude-path";
import { execWithOutput } from './execWithOutput.jsx';

export const processDir = async (
  rootPath = "",
  excludedPaths = [],
  excludedGlobs = []
) => {
  const foldersToIgnore = [".git", ...excludedPaths];
  const fullPathFoldersToIgnore = new Set(
    foldersToIgnore.map((d) => nodePath.join(rootPath, d))
  );

  const getFileStats = async (path = "", isFolder = true) => {
    const stats = await fs.statSync(`./${path}`);
    const name = path.split("/").filter(Boolean).slice(-1)[0];
    const size = stats.size;
    const relativePath = path.slice(rootPath.length + 1);

    if (!isFolder) {
      const jsonLogEntries = await execWithOutput("git", [
        "log",
        '--pretty=format:"{""hash"":""%h"", ""subject"":""%s"", ""author"":""%an"", ""date"":""%ad""}"',
        "--follow",
        "--",
        name,
      ]);

      const fullJson = `[${jsonLogEntries}]`;
      
    }

    return {
      name,
      path: relativePath,
      size,
      commits: JSON.parse(fullJson)
    };
  };
  const addItemToTree = async (path = "", isFolder = true) => {
    try {
      console.log("Looking in ", `./${path}`);

      if (isFolder) {
        const filesOrFolders = await fs.readdirSync(`./${path}`);
        const children = [];

        for (const fileOrFolder of filesOrFolders) {
          const fullPath = nodePath.join(path, fileOrFolder);
          if (
            shouldExcludePath(fullPath, fullPathFoldersToIgnore, excludedGlobs)
          ) {
            continue;
          }

          const info = fs.statSync(`./${fullPath}`);
          const stats = await addItemToTree(fullPath, info.isDirectory());
          if (stats) children.push(stats);
        }

        const stats = await getFileStats(path, isFolder);
        return { ...stats, children };
      }

      if (shouldExcludePath(path, fullPathFoldersToIgnore, excludedGlobs)) {
        return null;
      }
      const stats = getFileStats(path, isFolder);
      return stats;
    } catch (e) {
      console.log("Issue trying to read file", path, e);
      return null;
    }
  };

  const tree = await addItemToTree(rootPath);

  return tree;
};
