export function removeFrontMatter(text: string): string {
  //Remove the front matter if it exists
  const frontMatterRegex = /^---\n[\s\S]*\n---\n/;
  text = text.replace(frontMatterRegex, '');
  return text;
}

export function surroundWithMarkdown(text: string): string {
  return `\`\`\`md\n${text}\`\`\``;
}