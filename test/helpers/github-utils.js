import { execa } from "execa";
import { temporaryDirectory } from "tempy";

/**
 * Clone an existing repository with a squash and merge strategy:
 * - Clone the repository
 * - Change the current working directory to the clone root
 * - The default branch is "main"
 *
 * @param {String} repositoryUrl The URL of the bare repository.
 * @param {String} [branch='main'] the branch to initialize.
 * @return {String} The path of the cloned repository.
 */
export async function cloneRemoteSquashMergeRepo(repositoryUrl, branch = "main") {
  const cwd = temporaryDirectory();
  await execa("git", ["clone", "--no-hardlinks", repositoryUrl, cwd], { cwd });
  return cwd;
}
