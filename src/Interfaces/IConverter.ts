export interface IConverter {
  toMarkdownAsync(): Promise<MarkdownResponse>,
  toRawText(): TextResponse
}

type MarkdownResponse = {
  filename: string,
  content: string
}

type TextResponse = {
  content: string
}