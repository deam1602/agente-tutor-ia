const fs = require("fs");
const path = require("path");

function validateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const lines = fs.readFileSync(fullPath, "utf-8").split("\n").filter(Boolean);

  let validCount = 0;

  lines.forEach((line, index) => {
    try {
      const obj = JSON.parse(line);

      if (!obj.messages || !Array.isArray(obj.messages) || obj.messages.length < 2) {
        throw new Error("El campo messages no es válido.");
      }

      for (const msg of obj.messages) {
        if (
          !msg.role ||
          typeof msg.role !== "string" ||
          !msg.content ||
          typeof msg.content !== "string"
        ) {
          throw new Error("Cada mensaje debe tener role y content tipo string.");
        }
      }

      validCount++;
    } catch (err) {
      console.error(`Error en línea ${index + 1}: ${err.message}`);
    }
  });

  console.log(`Archivo revisado: ${filePath}`);
  console.log(`Ejemplos válidos: ${validCount}`);
}

validateFile("../app/data/pensamiento_computacional_train.jsonl");
validateFile("../app/data/pensamiento_computacional_valid.jsonl");