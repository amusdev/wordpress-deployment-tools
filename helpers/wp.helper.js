import { Engine } from "php-parser";

function parseWpConfig(content) {
  const engine = new Engine();
  const { children } = engine.parseCode(content);
  let database = null, dbHost = "localhost", dbPort = 3306, dbUser;
  for (const child of children) {
    if (child.expression?.what?.name === "define") {
      const [ name, value ] = child.expression.arguments;
      if (name.kind === "string" && value.kind === "string") {
        if (name.value === "DB_NAME") {
          database = value.value;
        }
        if (name.value === "DB_HOST") {
          const [ host, port ] = value.value.split(":");
          dbHost = host ?? "localhost";
          if (port !== undefined) {
            dbPort = parseInt(port);
          }
        }
        if (name.value === "DB_USER") {
          dbUser = value.value;
        }
      }
    }
  }
  return { database, dbHost, dbPort, dbUser };
}

export default {
  parseWpConfig,
}