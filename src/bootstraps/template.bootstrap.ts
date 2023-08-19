import inquirer from "inquirer";
import psl from "psl";

export default {
  handler: async function() {
    const { domain } = await inquirer.prompt({ name: "domain", message: "domain for the website?" });
    if (!psl.isValid(domain)) {
      throw new Error("domain is not vaild TLD inside public suffix list");
    }
    const { version } = await inquirer.prompt({ name: "version", message: "version of wordpress?", default: "latest" });
    console.log(JSON.stringify({
      domain,
      version,
      themes: {
        twentytwentythree: "latest",
      },
      plugins: {
        akismet: "latest",
      },
    }, undefined, 4));
  }
}