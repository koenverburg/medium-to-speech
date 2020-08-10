export interface IConverter {
  toMarkdownAsync(): Promise<MarkdownResponse>,
  toRawTextAsync(): Promise<TextResponse>
}

type MarkdownResponse = {
  filename: string,
  content: string
}

type TextResponse = {
  filename: string,
  filenameChunks: string,
  content: string
}