import { Converter } from '../src/converter'
import testPost from './test_post.md'

describe('converter', () => {
  it('should render markdown', () => {
    const converter = new Converter('')

    expect(converter.run()).toEqual(testPost)
  })
})