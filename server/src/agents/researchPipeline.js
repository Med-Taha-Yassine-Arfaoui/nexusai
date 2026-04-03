import { runResearcher } from "./researcherSimple.js";
import { runCritic } from "./criticSimple.js";
import { runSynthesizer } from "./synthesizerSimple.js";

export async function runResearchPipeline(prompt) {
  const research = await runResearcher(prompt);
  const critique = await runCritic(research);
  const summary = await runSynthesizer(research, critique);

  return summary;
}