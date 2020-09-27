const tsj = require("ts-json-schema-generator");
const fs = require("fs");

const config = {
  path: "src/data/types.ts",
  tsconfig: "tsconfig.json",
  type: "*",
};

const output_path = "src/data/jsonSchema.json";

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema, null, 2);
fs.writeFile(output_path, schemaString, (err) => {
  if (err) throw err;
});
