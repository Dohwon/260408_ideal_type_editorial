import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appearanceTagMeta,
  curatedPeople,
  examplePacks,
  personalityTagMeta,
} from "./data/celebrities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const localAnalysisAllowed = new Set(curatedPeople.map((person) => normalizeName(person.name)));

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function titleCaseCategory(category) {
  return category === "appearance" ? "외적 공통점" : "성격 공통점";
}

function json(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function text(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function sanitizeNames(names) {
  const unique = [];
  const seen = new Set();
  for (const rawName of Array.isArray(names) ? names : []) {
    const name = String(rawName || "").trim();
    if (!name) {
      continue;
    }
    const key = normalizeName(name);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(name);
  }
  return unique;
}

function getTagMeta(category) {
  return category === "appearance" ? appearanceTagMeta : personalityTagMeta;
}

function getPeopleByNames(names) {
  const index = new Map(curatedPeople.map((person) => [normalizeName(person.name), person]));
  return names.map((name) => index.get(normalizeName(name))).filter(Boolean);
}

function hasOnlyCuratedNames(names) {
  return names.every((name) => localAnalysisAllowed.has(normalizeName(name)));
}

function summarizeTopTags(category, tagIds) {
  const meta = getTagMeta(category);
  return tagIds.map((tagId) => meta[tagId]?.label || tagId).filter(Boolean);
}

function topTagsForCategory(category, people) {
  const key = category === "appearance" ? "appearanceTags" : "personalityTags";
  const counts = new Map();
  for (const person of people) {
    for (const tag of person[key]) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0], "ko");
    })
    .map(([tagId, count]) => ({ tagId, count }))
    .slice(0, 5);
}

function resolveAppearanceTheme(tagIds) {
  const has = (tagId) => tagIds.includes(tagId);
  if (has("presence") && has("defined_features") && (has("deep_eyes") || has("adult_classic"))) {
    return {
      title: "분위기와 선이 살아 있는 얼굴",
      headline: "화려함보다 묵직한 분위기와 또렷한 선에 끌리는 타입",
    };
  }
  if (has("polished_pretty") && has("clear_clean") && has("soft_glow")) {
    return {
      title: "정제되고 맑은 미감",
      headline: "과한 포인트보다 정돈된 조화와 깨끗한 인상에 끌리는 타입",
    };
  }
  if (has("chic_edge") && has("presence")) {
    return {
      title: "시크한 긴장감이 있는 얼굴",
      headline: "차갑고 세련된 결이 살아 있는 인상을 선호하는 타입",
    };
  }
  return {
    title: "분위기로 기억되는 얼굴",
    headline: "정답형 미남/미인보다 무드와 실루엣으로 남는 타입",
  };
}

function resolvePersonalityTheme(tagIds) {
  const has = (tagId) => tagIds.includes(tagId);
  if (has("humor") && has("warmth") && (has("grounded") || has("professional"))) {
    return {
      title: "무게감 있는데 유머와 온기가 있는 사람",
      headline: "말은 재밌지만 사람 자체는 가볍지 않은 타입에 끌리는 편",
    };
  }
  if (has("sense") && has("professional") && (has("taste") || has("intellect"))) {
    return {
      title: "감각과 완성도가 있는 사람",
      headline: "센스 있고 취향이 분명한데, 결국 자기 일을 잘하는 사람을 선호하는 편",
    };
  }
  if (has("comfortable") && has("warmth") && has("playful")) {
    return {
      title: "편안하고 밝은 에너지가 있는 사람",
      headline: "상대를 편하게 해주면서도 대화의 온도를 살리는 타입에 끌리는 편",
    };
  }
  return {
    title: "대화하면 더 좋아지는 사람",
    headline: "표면적인 매력보다 사람 냄새와 태도가 남는 타입에 끌리는 편",
  };
}

function buildLocalBreakdown(category, names, topTagIds) {
  const labels = summarizeTopTags(category, topTagIds);
  const meta = getTagMeta(category);
  const descriptors = topTagIds
    .map((tagId) => meta[tagId]?.descriptor)
    .filter(Boolean)
    .slice(0, 3);

  if (category === "appearance") {
    return [
      {
        label: "공통 분위기",
        text: `${names.join(", ")}을 묶으면 화사하게 예쁜 얼굴보다는 결이 또렷하고 무드가 진한 쪽으로 선호가 모입니다.`,
      },
      {
        label: "디테일",
        text: `${descriptors.join(", ")} 쪽의 결이 반복됩니다.`,
      },
      {
        label: "한 줄 정의",
        text: `즉, ${labels.slice(0, 2).join(" + ")} 쪽이 당신의 외적 취향 핵심입니다.`,
      },
    ];
  }

  return [
    {
      label: "대화감",
      text: `${names.join(", ")}을 묶으면 재치가 있는데 얄팍하지 않은 사람을 좋아하는 패턴이 뚜렷합니다.`,
    },
    {
      label: "관계감",
      text: `${descriptors.join(", ")} 쪽의 성향이 반복돼서, 같이 있을 때 편안하지만 심심하지 않은 타입이 보입니다.`,
    },
    {
      label: "한 줄 정의",
      text: `즉, ${labels.slice(0, 2).join(" + ")} 조합이 당신의 성격 이상형 핵심입니다.`,
    },
  ];
}

function buildLocalAnalysis({ category, names }) {
  const people = getPeopleByNames(names);
  if (people.length !== names.length) {
    return null;
  }

  const topTags = topTagsForCategory(category, people);
  const topTagIds = topTags.map((item) => item.tagId);
  const keywords = summarizeTopTags(category, topTagIds).slice(0, 4);
  const theme =
    category === "appearance"
      ? resolveAppearanceTheme(topTagIds)
      : resolvePersonalityTheme(topTagIds);
  const breakdown = buildLocalBreakdown(category, names, topTagIds);
  const shortReply =
    category === "appearance"
      ? `분위기 있고 선이 또렷한 스타일이 좋아. 너무 가볍거나 반짝이는 느낌보다 차분하고 어른스러운 쪽.`
      : `재밌는데 가볍지 않고, 다정한데 자기 일 잘하는 사람이 좋아.`;
  const naturalReply =
    category === "appearance"
      ? `외적으로는 눈빛이 있고 분위기 있는 스타일이 좋아. 화려하게 예쁜 얼굴보다는 선이 살아 있고 차분한 무드가 있는 쪽.`
      : `성격은 재밌고 센스 있는데 기본적으로 따뜻한 사람이 좋아. 장난은 쳐도 사람 자체는 가볍지 않은 타입.`;
  const deepReply =
    category === "appearance"
      ? `나는 약간 차분하고 분위기 있는 얼굴에 더 끌리더라. 또렷한 선, 깊은 눈빛, 길고 시원한 실루엣처럼 무드가 먼저 보이는 스타일이 좋아.`
      : `나는 말은 재밌게 하는데 사람 자체는 무게감 있는 사람이 좋더라. 센스 있고 다정한데, 결국 자기 일은 진심으로 잘하는 사람 쪽.`;

  return {
    source: "local",
    mode: category,
    title: theme.title,
    headline: theme.headline,
    keywords,
    summary:
      category === "appearance"
        ? `선택한 인물들을 보면 정답형 미남/미인보다는 분위기와 선이 살아 있는 얼굴에 반응합니다. ${keywords.slice(0, 3).join(", ")} 같은 요소가 반복돼서 차분하면서도 존재감 있는 인상을 선호하는 쪽에 가깝습니다.`
        : `선택한 인물들을 보면 말의 재미와 사람의 온도를 함께 보는 편입니다. ${keywords.slice(0, 3).join(", ")} 같은 요소가 반복돼서 웃기기만 한 사람이 아니라 편안하고 믿음 가는 타입에 더 끌립니다.`,
    breakdown,
    short_reply: shortReply,
    natural_reply: naturalReply,
    deep_reply: deepReply,
    confidence_note: `${people.length}명의 큐레이션 데이터 공통 태그를 바탕으로 정리한 로컬 추론입니다. 추천 인물 조합에서는 키 없이 바로 동작합니다.`,
  };
}

function buildLocalSynthesis({ appearanceResult, personalityResult }) {
  const keywords = [
    ...(appearanceResult?.keywords || []).slice(0, 2),
    ...(personalityResult?.keywords || []).slice(0, 2),
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  return {
    source: "local",
    title: "겉은 분위기, 대화는 온기",
    headline: "차분하고 존재감 있는 외형에, 유쾌하고 다정한 성격이 더해진 타입",
    keywords: keywords.slice(0, 4),
    summary: `겉으로는 ${appearanceResult.title} 쪽에 끌리고, 관계 안에서는 ${personalityResult.title} 쪽에 더 반응하는 패턴입니다. 즉, 첫인상은 차분하고 묵직한데 가까워질수록 웃기고 따뜻한 사람이 당신의 최종 이상형에 가깝습니다.`,
    combined_reply: `나는 분위기 있고 선이 또렷한 스타일을 좋아하는데, 성격은 재밌고 다정하면서 자기 일 잘하는 사람이 좋더라.`,
    short_reply: `분위기 있고 차분한데, 말하면 유쾌하고 따뜻한 사람이 좋아.`,
    natural_reply: `외적으로는 눈빛 있고 분위기 있는 스타일을 좋아하고, 성격은 센스 있고 다정한데 자기 일도 잘하는 사람이 좋아.`,
    deep_reply: `나는 약간 어른스럽고 존재감 있는 스타일인데, 막상 가까워지면 재밌고 편안한 사람이 좋더라. 너무 가볍지 않고, 기본적으로 온기와 실력이 같이 느껴지는 타입.`,
    confidence_note: "외적 분석과 성격 분석 결과를 합쳐 정리한 로컬 종합본입니다.",
  };
}

function extractOutputText(response) {
  const parts = [];
  for (const item of response.output || []) {
    if (item.type !== "message") {
      continue;
    }
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

async function callOpenAI(payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    const message = responseJson?.error?.message || "OpenAI request failed.";
    throw new Error(message);
  }
  return responseJson;
}

async function buildOpenAIAnalysis({ category, names }) {
  const instruction = [
    "You are an editorial ideal-type analyst for a Korean web app.",
    "Return valid JSON only.",
    "The word JSON must appear in your instructions, and your output must be valid JSON.",
    "Write all copy in Korean.",
    "Infer only from widely known public image, career persona, and general visual impression.",
    "Do not claim private facts, rumors, or certainty you do not have.",
    "Target schema:",
    "{",
    '  "title": string,',
    '  "headline": string,',
    '  "keywords": string[4],',
    '  "summary": string,',
    '  "breakdown": [{"label": string, "text": string}, {"label": string, "text": string}, {"label": string, "text": string}],',
    '  "short_reply": string,',
    '  "natural_reply": string,',
    '  "deep_reply": string,',
    '  "confidence_note": string',
    "}",
  ].join("\n");

  const input = [
    `분석 종류: ${titleCaseCategory(category)}`,
    `선택 인물: ${names.join(", ")}`,
    "목표: 사람들이 '너 이상형 뭐야?'라고 물었을 때 바로 말할 수 있는 문장까지 정리한다.",
    "조건:",
    "- appearance이면 외모를 얼굴선, 눈빛, 전체 분위기, 피지컬 무드 중심으로 본다.",
    "- personality이면 인터뷰 톤, 방송/작품에서 반복되는 이미지, 대중적 인상 중심으로 본다.",
    "- 결과는 너무 길지 않게, 하지만 충분히 설득력 있게 정리한다.",
    "- breakdown 각 항목은 2문장 이내로 압축한다.",
  ].join("\n");

  const responseJson = await callOpenAI({
    model,
    instructions: instruction,
    input,
    reasoning: { effort: "medium" },
    store: false,
    max_output_tokens: 1200,
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  const outputText = extractOutputText(responseJson);
  const parsed = JSON.parse(outputText);
  return {
    source: "openai",
    mode: category,
    ...parsed,
  };
}

async function buildOpenAISynthesis({ appearanceResult, personalityResult }) {
  const instruction = [
    "You are an editorial ideal-type analyst for a Korean web app.",
    "Return valid JSON only.",
    "The word JSON must appear in your instructions, and your output must be valid JSON.",
    "Write all copy in Korean.",
    "Synthesize the appearance result and personality result into one attractive final type summary.",
    "Target schema:",
    "{",
    '  "title": string,',
    '  "headline": string,',
    '  "keywords": string[4],',
    '  "summary": string,',
    '  "combined_reply": string,',
    '  "short_reply": string,',
    '  "natural_reply": string,',
    '  "deep_reply": string,',
    '  "confidence_note": string',
    "}",
  ].join("\n");

  const input = JSON.stringify(
    {
      appearance: appearanceResult,
      personality: personalityResult,
      goal: "짧게 말할 수 있는 최종 이상형 정의 만들기",
    },
    null,
    2
  );

  const responseJson = await callOpenAI({
    model,
    instructions: instruction,
    input,
    reasoning: { effort: "medium" },
    store: false,
    max_output_tokens: 900,
    text: {
      format: {
        type: "json_object",
      },
    },
  });

  const outputText = extractOutputText(responseJson);
  return {
    source: "openai",
    ...JSON.parse(outputText),
  };
}

async function buildAnalysis(payload) {
  const category = payload?.category;
  const names = sanitizeNames(payload?.names);

  if (!["appearance", "personality"].includes(category)) {
    throw new Error("category는 appearance 또는 personality여야 합니다.");
  }
  if (names.length < 3 || names.length > 10) {
    throw new Error("이상형 분석은 3명 이상 10명 이하로만 가능합니다.");
  }

  const local = buildLocalAnalysis({ category, names });
  if (!process.env.OPENAI_API_KEY) {
    if (local) {
      return local;
    }
    throw new Error("현재는 OPENAI_API_KEY가 없어서 추천 인물 조합만 바로 분석할 수 있습니다. 추천 카드로 체험하거나 환경변수를 연결해 주세요.");
  }

  try {
    return await buildOpenAIAnalysis({ category, names });
  } catch (error) {
    if (local) {
      return {
        ...local,
        confidence_note: `${local.confidence_note} AI 요청이 실패해서 로컬 분석으로 대체했습니다.`,
      };
    }
    throw error;
  }
}

async function buildSynthesis(payload) {
  const appearanceResult = payload?.appearanceResult;
  const personalityResult = payload?.personalityResult;

  if (!appearanceResult || !personalityResult) {
    throw new Error("외적 결과와 성격 결과가 모두 있어야 최종 종합을 만들 수 있습니다.");
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildLocalSynthesis({ appearanceResult, personalityResult });
  }

  try {
    return await buildOpenAISynthesis({ appearanceResult, personalityResult });
  } catch (error) {
    return {
      ...buildLocalSynthesis({ appearanceResult, personalityResult }),
      confidence_note: "AI 종합 요청이 실패해서 로컬 종합본으로 대체했습니다.",
    };
  }
}

function buildPortraitPrompt({ synthesisResult, appearanceResult, personalityResult, selections }) {
  const appearanceKeywords = (appearanceResult?.keywords || []).slice(0, 4).join(", ");
  const personalityKeywords = (personalityResult?.keywords || []).slice(0, 4).join(", ");
  const allNames = [...(selections?.appearance || []), ...(selections?.personality || [])]
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .join(", ");

  return [
    "Use case: photorealistic-natural",
    "Asset type: final result portrait for an ideal-type analysis web app",
    "Primary request: create one original, photorealistic editorial portrait of a fictional adult person who embodies the overlapping appeal of the referenced public figures without matching any one of them exactly",
    "Scene/backdrop: soft neutral editorial studio backdrop with subtle depth, no props",
    "Subject: a fictional Korean adult person whose overall gender presentation follows the blend implied by the selected public figures",
    "Style/medium: photorealistic editorial photography",
    "Composition/framing: vertical chest-up portrait, eye-level camera, centered subject, calm but magnetic presence",
    "Lighting/mood: soft natural studio light, elegant cinematic contrast, realistic skin texture, grounded and sophisticated mood",
    `Reference vibe names: ${allNames || "none provided"}`,
    `Appearance cues: ${appearanceKeywords || "분위기 있는 얼굴, 또렷한 선, 깊은 눈빛"}`,
    `Personality cues translated visually: ${personalityKeywords || "유머감각, 온기, 무게감"}`,
    `Editorial direction: ${synthesisResult?.headline || synthesisResult?.summary || "겉은 분위기, 대화는 온기"}`,
    "Constraints: original person only, not an exact likeness of any named celebrity, no collage, no face-splitting, no double exposure, no duplicate features, no extra people, no text, no logo, no watermark",
    "Avoid: cartoon, CGI look, plastic skin, exaggerated beauty filter, celebrity clone, distorted anatomy",
  ].join("\n");
}

async function generateIdealPortrait(payload) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("이미지 생성은 OPENAI_API_KEY가 연결된 상태에서만 사용할 수 있습니다.");
  }

  const synthesisResult = payload?.synthesisResult;
  const appearanceResult = payload?.appearanceResult;
  const personalityResult = payload?.personalityResult;
  if (!synthesisResult || !appearanceResult || !personalityResult) {
    throw new Error("이미지 생성을 위해서는 외적 결과, 성격 결과, 최종 종합 결과가 모두 필요합니다.");
  }

  const prompt = buildPortraitPrompt({
    synthesisResult,
    appearanceResult,
    personalityResult,
    selections: payload?.selections,
  });

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size: "1024x1536",
      quality: "high",
      output_format: "png",
      background: "opaque",
      moderation: "auto",
      n: 1,
    }),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    throw new Error(responseJson?.error?.message || "이미지 생성 요청이 실패했습니다.");
  }

  const base64 = responseJson?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("이미지 결과를 받지 못했습니다.");
  }

  return {
    source: "openai-image",
    model: imageModel,
    promptSummary: synthesisResult?.headline || synthesisResult?.title || "ideal portrait",
    note: "선택한 인물들의 공통 분위기를 참고해 만든 원본 인물 포트레이트입니다. 특정 유명인을 그대로 복제하지 않도록 제어했습니다.",
    imageDataUrl: `data:image/png;base64,${base64}`,
  };
}

async function serveStatic(request, response) {
  const requestedUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestedUrl.pathname === "/" ? "/index.html" : requestedUrl.pathname;
  const safePath = path.normalize(path.join(publicDir, pathname));
  if (!safePath.startsWith(publicDir)) {
    text(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await readFile(safePath);
    const extension = path.extname(safePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    text(response, 404, "Not found");
  }
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method || "GET";
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (method === "GET" && pathname === "/health") {
      return json(response, 200, {
        ok: true,
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
        model,
        imageModel,
      });
    }

    if (method === "GET" && pathname === "/api/catalog") {
      return json(response, 200, {
        people: curatedPeople,
        examplePacks,
        supportsCustomAnalysis: Boolean(process.env.OPENAI_API_KEY),
        supportsImageGeneration: Boolean(process.env.OPENAI_API_KEY),
      });
    }

    if (method === "POST" && pathname === "/api/analyze") {
      const payload = await readJsonBody(request);
      const result = await buildAnalysis(payload);
      return json(response, 200, result);
    }

    if (method === "POST" && pathname === "/api/synthesize") {
      const payload = await readJsonBody(request);
      const result = await buildSynthesis(payload);
      return json(response, 200, result);
    }

    if (method === "POST" && pathname === "/api/generate-image") {
      const payload = await readJsonBody(request);
      const result = await generateIdealPortrait(payload);
      return json(response, 200, result);
    }

    if (method === "GET") {
      return serveStatic(request, response);
    }

    return text(response, 405, "Method not allowed");
  } catch (error) {
    return json(response, 400, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`ideal_type_editorial listening on http://0.0.0.0:${port}`);
});
