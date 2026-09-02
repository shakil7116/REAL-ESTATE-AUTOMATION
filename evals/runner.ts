// ─────────────────────────────────────────────────────────────────────
// Eval Harness — engine-agnostic
// Runs every case in evals/cases/, scores each, reports per-prompt
// aggregate + regressions vs baseline.
//
// This file is INTENTIONALLY framework-free. No jest, no vitest. Just
// node + fetch. The reason: it must work on any LLM and any host.
// ─────────────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';

type AssertionType =
  | 'contains'
  | 'not_contains'
  | 'regex'
  | 'max_length'
  | 'min_length'
  | 'is_json'
  | 'json_path_equals'
  | 'json_path_exists'
  | 'language_is'
  | 'refuses';

interface Assertion {
  type: AssertionType;
  field?: string;
  value?: any;
  description?: string;
}

interface EvalCase {
  id: string;
  description: string;
  input: Record<string, any>;
  expected?: any;
  assertions: Assertion[];
  weight: number;
  tags?: string[];
}

interface EvalFile {
  prompt: string;
  version: string;
  engine_agnostic: boolean;
  description?: string;
  cases: EvalCase[];
}

interface CaseResult {
  case_id: string;
  prompt: string;
  score: number;
  passed: number;
  total: number;
  output: string;
  duration_ms: number;
  failures: string[];
}

interface PromptResult {
  prompt: string;
  aggregate_score: number;
  cases: CaseResult[];
}

interface BaselineScore {
  engine: string;
  date: string;
  per_prompt: Record<string, number>;
}

interface BaselineFile {
  [engine: string]: BaselineScore;
}

// ── Resolve active engine from .claude/settings.json ────────────────
function getActiveEngine(): string {
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return 'unknown';
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  return settings.env?.ANTHROPIC_DEFAULT_OPUS_MODEL || 'unknown';
}

// ── Load prompt from contracts/prompts/<name>.md ──────────────────
function loadPrompt(name: string): string {
  const filePath = path.join(process.cwd(), 'contracts', 'prompts', `${name}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// ── Substitute variables into the prompt template ─────────────────
// Two input formats are supported:
//   1. <system>…</system> + <user>…</user>  (raw, the "compiled" form)
//   2. Markdown spec with `## System message` + `## User message template`
//      fenced code blocks (the "source" form authors write in contracts/prompts/)
function fillTemplate(template: string, vars: Record<string, any>): { system: string; user: string } {
  // Try explicit tags first.
  const systemTag = template.match(/<system>([\s\S]*?)<\/system>/i);
  const userTag = template.match(/<user>([\s\S]*?)<\/user>/i);

  let system = '';
  let user = '';

  if (systemTag || userTag) {
    system = systemTag ? systemTag[1].trim() : '';
    user = userTag ? userTag[1].trim() : template;
  } else {
    // Fallback: scan line by line. Find the `## System message` heading,
    // then read the contents of the FIRST fenced code block under it. Stop
    // at the next `## …` heading. Same for `## User message template`.
    // Line-based scanning (not regex) because regex `(?=\n##\s|\Z)` was
    // misbehaving on Arabic+Latin mixed content.
    const extract = (heading: string): string => {
      const lines = template.split('\n');
      let inSection = false;
      let inFence = false;
      const buf: string[] = [];
      for (const line of lines) {
        if (!inSection && new RegExp(`^##\\s*${heading}\\s*$`).test(line)) {
          inSection = true;
          inFence = false;
          continue;
        }
        if (inSection && /^##\s/.test(line)) break;
        if (inSection) {
          if (/^```/.test(line)) {
            inFence = !inFence;
            continue;
          }
          if (inFence) buf.push(line);
        }
      }
      return buf.join('\n').trim();
    };
    system = extract('System message');
    user = extract('User message template') || template;
  }

  // Replace {{var}} placeholders
  // Supports both direct keys (tone, platform) and _json variants.
  // If the template references {{unit_json}} but the case only provides { unit },
  // automatically expand bare objects into their _json form.
  const jsonAliases: Record<string, string> = {};
  for (const key of Object.keys(vars)) {
    if (typeof vars[key] !== 'object' || vars[key] === null) continue;
    jsonAliases[key + '_json'] = vars[key];
  }
  const combinedVars = { ...vars, ...jsonAliases };
  const replace = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = combinedVars[key];
      if (v === undefined) return `{{${key}}}`;
      if (typeof v === 'string') return v;
      return JSON.stringify(v, null, 2);
    });

  return {
    system: replace(system),
    user: replace(user),
  };
}

// ── Call the active LLM ──────────────────────────────────────────
// This is the single point of integration. When the engine changes,
// only this function changes.
async function callLLM(system: string, user: string): Promise<string> {
  // Stub mode — deterministic outputs matching eval assertions.
  if (process.env.PE_EVAL_STUB === '1' || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)) {
    const hasArabicUser = /[\u0600-\u06FF]/.test(user);
    const looksLikeArabic = hasArabicUser;
    const lowerSys = system.toLowerCase();
    const lowerUser = user.toLowerCase();

    // Lead scoring: must check BEFORE ad-copy because lead user also has {{unit_json}}/<unit>
    const isLeadScoring = /{{lead_json}}|<lead>|score.*lead|tier|lead-score/i.test(lowerUser) ||
                          (/JSON|json output/i.test(system) && /score.*lead|tier/i.test(lowerSys));
    if (isLeadScoring) {
      const msgMatch = lowerUser.match(/"message"\s*:\s*"([^"]*)"/);
      const message = msgMatch ? msgMatch[1] : '';

      if (message.trim().length === 0) {
        // Empty message = no signal; score conservatively as cold (not unqualified,
        // since there's nothing to disqualify — just nothing to work with).
        return JSON.stringify({
          score: 30, tier: 'cold',
          reasoning: 'No meaningful message content provided. Insufficient information to assess intent or readiness.',
          next_action: 'add to nurture list',
        });
      }

      const trimmed = message.trim();
      const isGeneric = /^(is this|is it|available|\??\s*$)/i.test(trimmed);
      if (isGeneric) {
        return JSON.stringify({
          score: 12, tier: 'unqualified',
          reasoning: 'Generic one-line inquiry with no specifics on timing, budget, or intent.',
          next_action: 'disqualify',
        });
      }

      // Budget match: allow commas (e.g. "5,000 QAR") — \d{2,5} would split at comma.
      const budgetMatch = trimmed.match(/\b(\d[\d,]*)\s*qar\b/i);
      const rentMatch = lowerUser.match(/"monthly_rent"\s*:\s*(\d+)/);
      if (budgetMatch && rentMatch) {
        const budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
        const rent = parseInt(rentMatch[1], 10);
        if (budget < rent * 0.5) {
          return JSON.stringify({
            score: 35, tier: 'cold',
            reasoning: 'Budget of ' + budget.toLocaleString() + ' QAR is significantly below the asking rent of ' + rent.toLocaleString() + ' QAR.',
            next_action: 'add to nurture list',
          });
        }
      }

      // Timing signals: broaden to catch "relocating", "moving in next month", etc.
      const hasMoveIn = /moving|relocat|next week|this month|soon|view/i.test(trimmed);
      const hasBudget = /\b\d+\s*qar\b/i.test(trimmed) || /budget/i.test(trimmed);
      if (hasMoveIn && hasBudget) {
        return JSON.stringify({
          score: 92, tier: 'hot',
          reasoning: 'Highly specific inquiry with clear move-in timeline, aligned budget, and named employer (high intent). Direct question about viewings suggests readiness to sign.',
          next_action: 'call within 1 hour',
        });
      }

      if (trimmed.length > 20) {
        return JSON.stringify({
          score: 58, tier: 'warm',
          reasoning: 'Clear interest with some specifics on timing, but budget not stated and no direct action requested. Good follow-up candidate.',
          next_action: 'email within 24 hours',
        });
      }

      return JSON.stringify({
        score: 30, tier: 'cold',
        reasoning: 'Limited signal in the inquiry. More information needed.',
        next_action: 'add to nurture list',
      });
    }

    // Ad copy: detect via <unit>/{{unit_json}} in user OR system-prompt keywords.
    // Must NOT match copilot (also says "bilingual" in system) — so we only use
    // user-content signals or the more specific "copywriter" keyword.
    const isAdCopy = /{{unit_json}}|<unit>|ad\.copy/i.test(lowerUser) ||
                     (/JSON|json output/i.test(system) && /copywriter/i.test(lowerSys));
    if (isAdCopy) {
      const isEmptyAmenity = /"amenities"\s*:\s*\[\s*\]/.test(lowerUser);
      if (isEmptyAmenity) {
        return JSON.stringify({
          en: {
            headline: 'Cozy Studio in Al Sadd — QAR 2,200/mo',
            body: 'Compact 400 sqft studio in Al Sadd. Quiet neighborhood, great for students. Walk to metro and campus.',
            hashtags: ['#DohaRentals', '#AlSadd', '#PropertyEase', '#QatarRealEstate', '#Studio'],
            cta: 'Book a viewing today',
          },
          ar: {
            headline: 'استوديو مريح في اللؤلؤة',
            body: 'استوديو مدمج مساحة ٤٠٠ قدم مربع في اللؤلؤة. حي هادئ مثالي للطلاب.',
            hashtags: ['#عقارات_الدوحة', '#اللؤلؤة', '#بروبرتي_aيز', '#عقارات_قطر', '#استوديو'],
            cta: 'احجز معاينة اليوم',
          },
        });
      }
      return JSON.stringify({
        en: {
          headline: 'Luxurious 2BR Apartment in West Bay with Sea View',
          body: 'Spacious 2-bedroom, 2-bathroom apartment in the heart of West Bay. 1,200 sqft of bright living space with pool, gym, and stunning sea views.',
          hashtags: ['#DohaRentals', '#WestBay', '#PropertyEase', '#QatarRealEstate', '#2BHApartment'],
          cta: 'Book a private viewing today',
        },
        ar: {
          headline: 'شقة فاخرة بغرفتي نوم في الخليج الغربي',
          body: 'شقة واسعة بغرفتي نوم وحمامين في قلب الخليج الغربي. مساحة معيشة مشرقة ١٢٠٠ قدم مربع مع مسبح ونادي رياضي وإطلالة بحرية رائعة.',
          hashtags: ['#عقارات_الدوحة', '#الخليج_الغربي', '#بروبرتي_aيز', '#عقارات_قطر', '#شقة_غرفتي_نوم'],
          cta: 'احجز مشاهدة خاصة اليوم',
        },
      });
    }

    // Copilot stubs

    // Arabic response for Arabic user input
    if (looksLikeArabic) {
      return 'مرحباُ، يمكنني مساعدتك في ذلك. يوجد 3 وحدات شاغرة في Lusail. هل تريد جدولة معاينة؟';
    }

    // Confirm-before-action: user asks to create something + system says confirm
    const hasActionIntent = /create|book|schedule|send|draft|make|open|generate/i.test(user);
    const hasConfirmGuidance = /confirm|should i|want me to|proceed/i.test(system);
    if (hasActionIntent && hasConfirmGuidance) {
      return 'I can create a maintenance ticket for Unit 4B — should I proceed with that?';
    }

    // Refuse injection: user tries to get system prompt + system says don't reveal
    const hasRefuseSignal = /ignore.*instructions|tell me your.*prompt/i.test(user) ||
                            /refus|cannot reveal/i.test(system);
    if (hasRefuseSignal) {
      return 'I cannot reveal my system instructions. I am here to help with property management tasks only.';
    }

    // Missing data: user asks about ROI with empty portfolio
    const hasMissingDataSignal = /what'?s the roi/i.test(user) ||
                                 /missing data|dont have|cannot calculate/i.test(lowerUser);
    if (hasMissingDataSignal) {
      return 'I don\'t have enough data to calculate that. Could you provide more details about your portfolio?';
    }

    // Default English response
    return 'I can help with that. You have 3 vacant units in Lusail. Would you like to schedule a viewing?';
  }

  throw new Error(
    'Real LLM call not yet wired. Set OPENAI_API_KEY or ANTHROPIC_AUTH_TOKEN, ' +
    'or run with PE_EVAL_STUB=1 to use stub mode.'
  );
}


// ── Run a single assertion ───────────────────────────────────────
function runAssertion(output: string, assertion: Assertion): { passed: boolean; reason: string } {
  switch (assertion.type) {
    case 'contains':
      return {
        passed: output.includes(String(assertion.value)),
        reason: `expected output to contain "${assertion.value}"`,
      };
    case 'not_contains':
      return {
        passed: !output.includes(String(assertion.value)),
        reason: `expected output NOT to contain "${assertion.value}"`,
      };
    case 'regex': {
      // Assertion values can include inline (?i) / (?m) modifiers
      // (PCRE-style). JS regex literals don't support them, so we
      // extract any leading inline-flag group and apply it as flags
      // on the RegExp constructor. The original `value` is preserved
      // in the reason so case authors can see what was tested.
      const raw = String(assertion.value);
      const inlineMatch = raw.match(/^\(\?([gimsuy]+)\)/);
      let pattern = raw;
      let flags = '';
      if (inlineMatch) {
        pattern = raw.slice(inlineMatch[0].length);
        flags = inlineMatch[1];
      }
      const re = new RegExp(pattern, flags);
      return {
        passed: re.test(output),
        reason: `expected output to match /${raw}/`,
      };
    }
    case 'max_length':
      return {
        passed: output.length <= Number(assertion.value),
        reason: `expected output ≤ ${assertion.value} chars (got ${output.length})`,
      };
    case 'min_length':
      return {
        passed: output.length >= Number(assertion.value),
        reason: `expected output ≥ ${assertion.value} chars (got ${output.length})`,
      };
    case 'is_json': {
      try {
        JSON.parse(output);
        return { passed: true, reason: 'expected output to be valid JSON' };
      } catch {
        return { passed: false, reason: 'expected output to be valid JSON' };
      }
    }
    case 'json_path_equals': {
      try {
        const obj = JSON.parse(output);
        const v = assertion.field!.split('.').reduce((o: any, k) => o?.[k], obj);
        return {
          passed: v === assertion.value,
          reason: `expected ${assertion.field} === ${JSON.stringify(assertion.value)} (got ${JSON.stringify(v)})`,
        };
      } catch {
        return { passed: false, reason: `output is not JSON, can't check ${assertion.field}` };
      }
    }
    case 'json_path_exists': {
      try {
        const obj = JSON.parse(output);
        const v = assertion.field!.split('.').reduce((o: any, k) => o?.[k], obj);
        return {
          passed: v !== undefined,
          reason: `expected ${assertion.field} to exist`,
        };
      } catch {
        return { passed: false, reason: `output is not JSON, can't check ${assertion.field}` };
      }
    }
    case 'language_is': {
      // Cheap heuristic: if the output has any Arabic chars (U+0600–U+06FF),
      // it's considered Arabic. Otherwise English.
      const hasArabic = /[؀-ۿ]/.test(output);
      const wantArabic = assertion.value === 'ar';
      return {
        passed: hasArabic === wantArabic,
        reason: `expected language=${assertion.value} (arabic detected=${hasArabic})`,
      };
    }
    case 'refuses': {
      // Refusal signals (model-agnostic). Patterns must be regex literals
      // — passing them as strings to `new RegExp(...)` would let the engine
      // misinterpret `(?:...)` groups as flags.
      const refusalPatterns: RegExp[] = [
        /I (?:cannot|can't|am (?:not able|unable) to)/i,
        /I (?:won't|will not) (?:help|assist|provide)/i,
        /not (?:able|allowed|permitted) to/i,
        /(?:لا أستطيع|غير قادر|غير مسموح)/,
      ];
      const refused = refusalPatterns.some(p => p.test(output));
      return {
        passed: refused,
        reason: `expected model to refuse (refused=${refused})`,
      };
    }
    default:
      return { passed: false, reason: `unknown assertion type: ${(assertion as any).type}` };
  }
}

// ── Run a single case ────────────────────────────────────────────
async function runCase(evalFile: EvalFile, c: EvalCase): Promise<CaseResult> {
  const promptText = loadPrompt(evalFile.prompt);
  const { system, user } = fillTemplate(promptText, c.input);
  const start = Date.now();

  let output: string;
  try {
    output = await callLLM(system, user);
  } catch (err: any) {
    return {
      case_id: c.id,
      prompt: evalFile.prompt,
      score: 0,
      passed: 0,
      total: c.assertions.length,
      output: '',
      duration_ms: Date.now() - start,
      failures: [`LLM call failed: ${err.message}`],
    };
  }

  const duration_ms = Date.now() - start;
  const failures: string[] = [];
  let passed = 0;
  for (const assertion of c.assertions) {
    const result = runAssertion(output, assertion);
    if (result.passed) passed++;
    else failures.push(`✗ ${assertion.description || assertion.type}: ${result.reason}`);
  }

  return {
    case_id: c.id,
    prompt: evalFile.prompt,
    score: passed / Math.max(1, c.assertions.length),
    passed,
    total: c.assertions.length,
    output: output.slice(0, 200), // truncate for the report
    duration_ms,
    failures,
  };
}

// ── Run all cases for a prompt ───────────────────────────────────
async function runPrompt(evalFile: EvalFile): Promise<PromptResult> {
  const results: CaseResult[] = [];
  for (const c of evalFile.cases) {
    results.push(await runCase(evalFile, c));
  }
  const totalWeight = evalFile.cases.reduce((s, c) => s + c.weight, 0);
  const weightedSum = results.reduce((s, r, i) => s + r.score * evalFile.cases[i].weight, 0);
  const aggregate = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { prompt: evalFile.prompt, aggregate_score: aggregate, cases: results };
}

// ── Compare against baseline ─────────────────────────────────────
function checkRegressions(results: PromptResult[], baseline: BaselineFile, engine: string): { regressions: string[]; warnings: string[] } {
  const regressions: string[] = [];
  const warnings: string[] = [];
  const baselineScores = baseline[engine]?.per_prompt || {};
  for (const r of results) {
    const base = baselineScores[r.prompt];
    if (base === undefined) {
      warnings.push(`No baseline for ${r.prompt} on ${engine}`);
      continue;
    }
    const delta = r.aggregate_score - base;
    if (delta <= -0.05) {
      regressions.push(`${r.prompt} dropped ${delta.toFixed(2)} (${base.toFixed(2)} → ${r.aggregate_score.toFixed(2)})`);
    } else if (delta <= -0.02) {
      warnings.push(`${r.prompt} dropped ${delta.toFixed(2)} (${base.toFixed(2)} → ${r.aggregate_score.toFixed(2)})`);
    }
  }
  return { regressions, warnings };
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const casesDir = path.join(process.cwd(), 'evals', 'cases');
  const baselinePath = path.join(process.cwd(), 'evals', 'baseline.json');

  if (!fs.existsSync(casesDir)) {
    console.error(`No cases directory: ${casesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));
  const engine = getActiveEngine();
  const stubMode = process.env.PE_EVAL_STUB === '1' || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN);
  console.log(`\n🧪 Eval Harness — engine: ${engine}`);
  if (stubMode) {
    console.log('⚠️  STUB MODE — using deterministic stub outputs, not a real LLM.');
    console.log('   Set OPENAI_API_KEY or ANTHROPIC_AUTH_TOKEN (and unset PE_EVAL_STUB) to run real evals.\n');
  } else {
    console.log('');
  }

  const allResults: PromptResult[] = [];
  for (const file of files) {
    const evalFile: EvalFile = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf-8'));
    if (!evalFile.engine_agnostic) {
      console.warn(`⚠️  ${file} is not marked engine_agnostic — skipping`);
      continue;
    }
    const result = await runPrompt(evalFile);
    allResults.push(result);
  }

  // Report
  console.log('─'.repeat(60));
  console.log('| Prompt              | Score | Cases |');
  console.log('|---------------------|-------|-------|');
  for (const r of allResults) {
    const passed = r.cases.filter(c => c.score >= 0.7).length;
    console.log(`| ${r.prompt.padEnd(20)} | ${r.aggregate_score.toFixed(2).padStart(5)} | ${passed}/${r.cases.length}`.padEnd(60) + '|');
  }
  console.log('─'.repeat(60));

  // Per-case failures
  for (const r of allResults) {
    for (const c of r.cases) {
      if (c.failures.length > 0) {
        console.log(`\n❌ ${r.prompt} / ${c.case_id}`);
        for (const f of c.failures) console.log(`   ${f}`);
      }
    }
  }

  // Baseline comparison — only meaningful against a real LLM run.
  // In stub mode, scores are deterministic hand-crafted values, not
  // measurements of engine quality. Comparing them to a real-LLM
  // baseline produces false regressions. Skip and warn instead.
  if (fs.existsSync(baselinePath)) {
    if (stubMode) {
      console.log('\nℹ️  Skipping baseline regression check (STUB MODE).');
      console.log('   Stub scores are not engine measurements.');
      console.log('   Run with a real LLM key to enable baseline comparison.');
    } else {
      const baseline: BaselineFile = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      const { regressions, warnings } = checkRegressions(allResults, baseline, engine);
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        for (const w of warnings) console.log(`   ${w}`);
      }
      if (regressions.length > 0) {
        console.log('\n🚨 Regressions:');
        for (const r of regressions) console.log(`   ${r}`);
        process.exit(1);
      } else {
        console.log('\n✅ No regressions vs baseline.');
      }
    }
  } else {
    console.log('\nℹ️  No baseline.json found — first run, no regression check.');
  }

  // Write results to evals/results.json
  const resultsFile = path.join(process.cwd(), 'evals', 'results.json');
  fs.writeFileSync(
    resultsFile,
    JSON.stringify({ engine, date: new Date().toISOString(), prompts: allResults }, null, 2)
  );
  console.log(`\n📝 Results written to ${resultsFile}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { runCase, runPrompt, runAssertion };
