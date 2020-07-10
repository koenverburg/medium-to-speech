import { Converter } from '../src/converter'
import fs from 'fs'
import path from 'path'

const markdownFilePath = path.resolve(__dirname, 'test_post.md')
const result = fs.readFileSync(markdownFilePath, { encoding: 'utf8'})

describe('converter', () => {
  it('should render markdown', () => {
    const converter = new Converter('')

    expect(converter.run()).toEqual(result)
  })
})