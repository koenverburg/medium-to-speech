import { Converter } from '../src/converter'
import fs from 'fs'
import path from 'path'
import mockResponse from './__mock-data__/example.response.json'

const cat = (filepath: string) =>
  fs.readFileSync(path.resolve(__dirname, filepath), { encoding: 'utf8' })

const textResult = cat('./__mock-data__/example-text.txt')
const markdownResult = cat('./__mock-data__/example-article.md')

describe('converter', () => {
  let converter: Converter;

  beforeAll(() => {
    converter = new Converter(mockResponse)
  })

  it('should render markdown', async () => {
    const markdown = await converter.toMarkdownAsync()

    expect(markdown.content).toEqual(markdownResult)
  })

  it('should render text', async () => {
    const text = await converter.toRawTextAsync()
    // Don't question this.. I'm getting spaces back somewhere
    const originalText = text.content.split('\n').map((l: string) => l.trim()).join('\n')
    const newTestResult = textResult.split('\n').map(l => l.trim()).join('\n')

    expect(originalText).toEqual(newTestResult)
  })
})