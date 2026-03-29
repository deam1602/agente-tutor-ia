const OpenAI = require("openai");

//require("dotenv").config({ path: ".env.local" });
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jobId = "ftjob-JKymJbnPYfUUDpLbYFHUbM7n";

async function main() {
  const job = await client.fineTuning.jobs.retrieve(jobId);

  console.log("Job ID:", job.id);
  console.log("Status:", job.status);
  console.log("Fine-tuned model:", job.fine_tuned_model);
  console.log("Trained tokens:", job.trained_tokens);
}

main().catch(console.error);