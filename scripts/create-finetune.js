const OpenAI = require("openai");
const fs = require("fs");

//require("dotenv").config({ path: ".env.local" });
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const trainingFile = await client.files.create({
    file: fs.createReadStream("../app/data/pensamiento_computacional_train.jsonl"),
    purpose: "fine-tune",
  });

  console.log("Training file subido:", trainingFile.id);

  const validationFile = await client.files.create({
    file: fs.createReadStream("../app/data/pensamiento_computacional_valid.jsonl"),
    purpose: "fine-tune",
  });

  console.log("Validation file subido:", validationFile.id);

  const job = await client.fineTuning.jobs.create({
    training_file: trainingFile.id,
    validation_file: validationFile.id,
    model: "gpt-4o-mini-2024-07-18",
  });

  console.log("Fine-tuning job creado:");
  console.log("Job ID:", job.id);
  console.log("Status:", job.status);
}

main().catch((err) => {
  console.error("Error creando fine-tuning:", err);
});