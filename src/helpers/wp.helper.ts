import { Engine } from "php-parser";

function parseWpConfig(content: string, options: any = {}) {
  const engine = new Engine(options);
  const { children } = engine.parseCode(content, '');
  let database, dbHost = "localhost", dbPort = 3306, dbUser;
  for (const child of children as any[]) {
    if (child.expression?.what?.name === "define") {
      const [ name, value ] = child.expression.arguments;
      if (name.kind === "string" && value.kind === "string") {
        if (name.value === "DB_NAME") {
          database = value.value as string;
        }
        if (name.value === "DB_HOST") {
          const [ host, port ] = value.value.split(":");
          dbHost = host ?? "localhost";
          if (port !== undefined) {
            dbPort = parseInt(port);
          }
        }
        if (name.value === "DB_USER") {
          dbUser = value.value as string;
        }
      }
    }
  }
  return { database, dbHost, dbPort, dbUser };
}

export default {
  parseWpConfig,
}