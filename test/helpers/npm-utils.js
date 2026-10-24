import { execa } from "execa";

export async function npmView(packageName, env) {
  const view = JSON.parse((await execa("npm", ["view", packageName, "--json"], { env })).stdout);

  // npm 12 wraps the result in an array
  return Array.isArray(view) ? view[0] : view;
}
