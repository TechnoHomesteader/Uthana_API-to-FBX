import { AppError } from "./errors.js";

export const GRAPHQL_ENDPOINT = "https://uthana.com/graphql";

const TEXT_TO_MOTION_MUTATION = `
  mutation textToMotion($prompt: String!) {
    create_text_to_motion(prompt: $prompt) {
      motion {
        id
        name
      }
    }
  }
`;

const CHARACTER_QUERIES = [
  `
    query CharactersBasic {
      characters {
        id
        name
      }
    }
  `,
  `
    query CharacterSkeletonsBasic {
      character_skeletons {
        id
        name
      }
    }
  `,
  `
    query AllCharactersBasic {
      all_characters {
        id
        name
      }
    }
  `,
  `
    query CharactersWithUrl {
      characters {
        id
        name
        url
      }
    }
  `,
  `
    query CharacterSkeletonsWithUrl {
      character_skeletons {
        id
        name
        url
      }
    }
  `
];

const ACCOUNT_QUERIES = [
  `
    query OrgUsage {
      org {
        id
        name
        motion_download_secs_per_month
        motion_download_secs_per_month_remaining
      }
    }
  `,
  `
    query SubscriptionUsage {
      subscription {
        secs_per_month
        org {
          id
          name
          motion_download_secs_per_month
          motion_download_secs_per_month_remaining
        }
      }
    }
  `,
  `
    query AccountUsage {
      account {
        id
        organization {
          id
          name
          generated_seconds
          max_seconds
        }
      }
    }
  `,
  `
    query AccountUsageAlt {
      account {
        id
        organization {
          id
          name
          generation_seconds_used
          generation_seconds_limit
        }
      }
    }
  `,
  `
    query OrganizationUsage {
      organization {
        id
        name
        generated_seconds
        max_seconds
      }
    }
  `
];

function toAuthHeader(apiKey) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function firstNumber(candidates) {
  for (const candidate of candidates) {
    const numeric = asNumber(candidate);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
}

export async function graphqlRequest({
  apiKey,
  query,
  variables = {},
  verbose = false,
  allowGraphQLErrors = false
}) {
  if (verbose) {
    console.log(`GraphQL URL: ${GRAPHQL_ENDPOINT}`);
  }

  let response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: toAuthHeader(apiKey)
      },
      body: JSON.stringify({ query, variables })
    });
  } catch (error) {
    throw new AppError(`Failed to reach GraphQL endpoint: ${error.message}`, {
      code: "GRAPHQL_UNREACHABLE",
      httpStatus: 502,
      exitCode: 2
    });
  }

  let payload;

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (allowGraphQLErrors) {
      try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.errors)) {
          return parsed;
        }
      } catch (_error) {
        // Fall through to standard HTTP error handling.
      }
    }

    throw new AppError(
      `GraphQL request failed with HTTP ${response.status}. ${body.slice(0, 300)}`.trim(),
      {
        code: "GRAPHQL_HTTP_ERROR",
        httpStatus: response.status,
        exitCode: 2
      }
    );
  }

  try {
    payload = await response.json();
  } catch (error) {
    throw new AppError(`GraphQL response was not valid JSON: ${error.message}`, {
      code: "GRAPHQL_INVALID_JSON",
      httpStatus: 502,
      exitCode: 2
    });
  }

  if (!allowGraphQLErrors && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const message = payload.errors
      .map((entry) => entry.message || JSON.stringify(entry))
      .join("; ");
    throw new AppError(`GraphQL error: ${message}`, {
      code: "GRAPHQL_ERROR",
      httpStatus: 400,
      exitCode: 2,
      details: payload.errors
    });
  }

  return payload;
}

export async function createTextToMotion({ apiKey, prompt, verbose = false }) {
  const payload = await graphqlRequest({
    apiKey,
    query: TEXT_TO_MOTION_MUTATION,
    variables: { prompt },
    verbose
  });

  const motion = payload?.data?.create_text_to_motion?.motion;
  if (!motion?.id) {
    throw new AppError("GraphQL response missing data.create_text_to_motion.motion.id", {
      code: "MOTION_ID_MISSING",
      httpStatus: 502,
      exitCode: 2
    });
  }

  return {
    id: motion.id,
    name: motion.name || null
  };
}

function normalizeCharacters(entries) {
  const deduped = new Map();

  for (const entry of entries || []) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const id = entry.id || entry.character_id;
    if (!id) {
      continue;
    }
    const normalizedId = String(id);
    deduped.set(normalizedId, {
      id: normalizedId,
      name: entry.name || entry.title || entry.label || normalizedId,
      url: entry.url || entry.preview_url || null
    });
  }

  return [...deduped.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function extractCharactersFromData(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  const preferredKeys = ["characters", "character_skeletons", "all_characters", "my_characters"];
  for (const key of preferredKeys) {
    if (Array.isArray(data[key])) {
      return normalizeCharacters(data[key]);
    }
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      const normalized = normalizeCharacters(value);
      if (normalized.length > 0) {
        return normalized;
      }
      continue;
    }

    if (value && typeof value === "object") {
      for (const nestedValue of Object.values(value)) {
        if (Array.isArray(nestedValue)) {
          const normalized = normalizeCharacters(nestedValue);
          if (normalized.length > 0) {
            return normalized;
          }
        }
      }
    }
  }

  return [];
}

export async function listCharacters({ apiKey, verbose = false }) {
  for (const query of CHARACTER_QUERIES) {
    const payload = await graphqlRequest({
      apiKey,
      query,
      verbose,
      allowGraphQLErrors: true
    });

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      continue;
    }

    const characters = extractCharactersFromData(payload.data);
    if (characters.length > 0) {
      return characters;
    }
  }

  throw new AppError("Unable to fetch character list from API using known query shapes.", {
    code: "CHARACTERS_UNAVAILABLE",
    httpStatus: 502,
    exitCode: 2
  });
}

function extractAccountUsage(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const account = data.account && typeof data.account === "object" ? data.account : null;
  const orgFromRoot = data.org && typeof data.org === "object" ? data.org : null;
  const subscription = data.subscription && typeof data.subscription === "object" ? data.subscription : null;
  const orgFromSubscription =
    subscription?.org && typeof subscription.org === "object" ? subscription.org : null;
  const organization =
    (account?.organization && typeof account.organization === "object" && account.organization) ||
    orgFromRoot ||
    orgFromSubscription ||
    (data.organization && typeof data.organization === "object" && data.organization) ||
    null;

  if (!account && !organization && !subscription) {
    return null;
  }

  const maxSeconds = firstNumber([
    organization?.motion_download_secs_per_month,
    subscription?.secs_per_month,
    organization?.max_seconds,
    organization?.generation_seconds_limit,
    account?.max_seconds
  ]);

  let generatedSeconds = firstNumber([
    organization?.motion_download_secs_per_month_used,
    organization?.generated_seconds,
    organization?.generation_seconds_used,
    account?.generated_seconds
  ]);

  let remainingSeconds = firstNumber([
    organization?.motion_download_secs_per_month_remaining,
    organization?.remaining_seconds,
    account?.remaining_seconds
  ]);

  if (generatedSeconds === null && maxSeconds !== null && remainingSeconds !== null) {
    generatedSeconds = Math.max(maxSeconds - remainingSeconds, 0);
  }

  if (remainingSeconds === null && maxSeconds !== null && generatedSeconds !== null) {
    remainingSeconds = Math.max(maxSeconds - generatedSeconds, 0);
  }

  return {
    id: account?.id || data?.user?.id || null,
    organization: {
      id: organization?.id || null,
      name: organization?.name || null,
      generated_seconds: generatedSeconds,
      max_seconds: maxSeconds,
      remaining_seconds: remainingSeconds
    }
  };
}

export async function getAccountUsage({ apiKey, verbose = false }) {
  for (const query of ACCOUNT_QUERIES) {
    const payload = await graphqlRequest({
      apiKey,
      query,
      verbose,
      allowGraphQLErrors: true
    });

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      continue;
    }

    const accountUsage = extractAccountUsage(payload.data);
    if (accountUsage) {
      return accountUsage;
    }
  }

  throw new AppError("Unable to fetch account usage from API using known query shapes.", {
    code: "ACCOUNT_UNAVAILABLE",
    httpStatus: 502,
    exitCode: 2
  });
}
