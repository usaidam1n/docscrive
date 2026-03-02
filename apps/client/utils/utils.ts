interface BaseDocument {
  apiKey: string;
  selectedModel: {
    key: string;
    value: string;
  };
}

interface DocumentInput extends BaseDocument {
  githubUrl: string;
  textCode: string;
}

interface TranslationInput extends BaseDocument {
  code: string;
  language: string;
}

function checkIfUrlIsValid(str: string) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return pattern.test(str);
}
const modelOptions = [
  { value: 'gpt-4o', key: 'openai', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', key: 'openai', label: 'GPT-4o Mini' },
  { value: 'o1', key: 'openai', label: 'GPT-o1' },
  { value: 'o1-mini', key: 'openai', label: 'GPT-o1 Mini' },
  { value: 'gemini-pro', label: 'Gemini Pro', key: 'google' },
  { value: 'gemini-2.5-flash', label: 'Gemini-2.5 Flash', key: 'google' },
  {
    value: 'claude-3-5-sonnet-latest',
    label: 'Claude-3.5 Sonnet',
    key: 'anthropic',
  },
  {
    value: 'claude-3-opus-latest',
    label: 'Claude-3 Opus',
    key: 'anthropic',
  },
  {
    value: 'claude-3-5-haiku-latest',
    label: 'Claude-3.5 Haiku',
    key: 'anthropic',
  },
];

const languages = [
  { value: 'javascript', label: 'Javascript' },
  { value: 'typescript', label: 'Typescript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'C#', label: 'C#' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'java', label: 'Java' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'dart', label: 'Dart' },
  { value: 'r', label: 'R' },
  { value: 'julia', label: 'Julia' },
  { value: 'scala', label: 'Scala' },
  { value: 'perl', label: 'Perl' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'lua', label: 'Lua' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'handlebars', label: 'Handlebars' },
  { value: 'twig', label: 'Twig' },
  { value: 'erb', label: 'ERB' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'yaml-frontmatter', label: 'YAML Frontmatter' },
  { value: 'toml', label: 'TOML' },
  { value: 'pug', label: 'Pug' },
  { value: 'ejs', label: 'EJS' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'liquid-html', label: 'Liquid HTML' },
  { value: 'handlebars-html', label: 'Handlebars HTML' },
  { value: 'twig-html', label: 'Twig HTML' },
];

function isValidInput({
  githubUrl,
  textCode,
}: Pick<DocumentInput, 'githubUrl' | 'textCode'>): boolean {
  const filledValues = [githubUrl, textCode].filter(Boolean);
  return filledValues.length <= 1;
}

function formatCode(code: string): string {
  return code
    .split('\n')
    .map(line => line.trim())
    .join('\n');
}

export { checkIfUrlIsValid, modelOptions, languages, isValidInput, formatCode };
