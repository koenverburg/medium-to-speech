import fs from 'fs'
import say from 'say'
import path from 'path'
import prettier from 'prettier'
import removeMarkdown from 'remove-markdown'
import { MediumHttpClient } from './client'
import { mediaTypes } from './Enums/mediaTypes'
import { markupTypes } from './Enums/markupTypes'
import { anchorTypes } from './Enums/anchorTypes'
import { paragraphTypes } from './Enums/paragraphTypes'

const medium = new MediumHttpClient()

export class Converter {
  contents: any
  constructor(contents: object) {
    this.contents = contents
  }

  public async convert() {
    const { value, references } = this.contents.payload;
    const { paragraphs, sections } = value.content.bodyModel;

    const filePaths = this.prepareForSaving(value, references)
    const frontmatter = this.createFrontmatter(value, references)
    const formattedParagraphs = await this.formatParagraphs(paragraphs)

    // adding the section divider
    sections.forEach((section: any, index: number) =>
      formattedParagraphs.splice(section.startIndex + index, 0, '\n\n---\n\n')
    )

    const content = this.prettifyMarkdown(frontmatter, formattedParagraphs)

    fs.writeFileSync(`${filePaths.markdownFilePath}/${filePaths.fileName}`, content, { encoding: 'utf-8' })

    return {
      path: '',
      filename: ''
    }
  }

  private prepareForSaving(value: any, references: any) {
    const user = this.getUserObject(references)
    // articles/:username/mp3/:username-slug
    // articles/:username/markdown/:username-slug

    const mp3FilePath = `articles/${user.username}/mp3` // helper
    const markdownFilePath = `articles/${user.username}/markdown`

    if (!fs.existsSync(mp3FilePath)) fs.mkdirSync(markdownFilePath, { recursive: true }) //  helper
    if (!fs.existsSync(markdownFilePath)) fs.mkdirSync(markdownFilePath, { recursive: true })

    const resolvedPath = path.resolve(__dirname, '..', markdownFilePath)

    return {
      fileName: `${user.username}_${value.slug}`, // helper
      markdownFilePath: resolvedPath
    }
  }

  private determineTextFormatting(text: string, markups: []) {
    if (markups.length === 0) return text

    let prefix = ''
    let suffix = ''
    let formattedText = text

    const markup: any = markups.shift() // markups is an array with one item, using shift we can get the first item
    switch (markup.type) {
      case markupTypes.bold:
        prefix = '**'
        suffix = '**'
        break

      case markupTypes.italic:
        prefix = '*'
        suffix = '*'
        break

      case markupTypes.link:
        prefix = '['

        switch (markup.anchorType) {
          case anchorTypes.externalLink:
            suffix = `](${markup.href})`
            break
          case anchorTypes.internalLink:
            suffix = `](https://medium.com/u/${markup.userId})`
            break
          default:
            throw new Error(`Unsupported anchorType: ${markup.anchorType}`)
        }

        break

      case markupTypes.inlineCode:
        prefix = '`'
        suffix = '`'
        break

      default:
        throw new Error(`Unsupported markup type: ${markup.type}`)
    }

    // rewrite the text with formatting added
    formattedText = this.formatText(formattedText, markup, prefix, suffix)

    // Update the markups start and ends because we added more characters to render it to markdown
    markups.forEach((mu: any) => {
      if (mu.end <= markup.start) return

      if (mu.start >= markup.end) {
        mu.start += prefix.length + suffix.length
        mu.end += prefix.length + suffix.length
        return
      }

      mu.start += prefix.length
      mu.end += prefix.length
    })

    return formattedText
  }

  private formatText(text: string, markup: any, prefix: string, suffix: string) {
    return `${text.slice(0, markup.start)}${prefix}${text.slice(markup.start, markup.end)}${suffix}${text.slice(markup.end)}`
  }

  private async formatParagraphs(paragraphs: any) {
    const results = paragraphs.map(async (paragraph: any, index: number) => {
      const { text, type, iframe, metadata, mixtapeMetadata } = paragraph

      const formattedText = this.determineTextFormatting(text, paragraph.markups)

      switch (type) {
        case paragraphTypes.paragraph:
          return formattedText

        case paragraphTypes.h1:
          if (index === 0) { // ignore the first otherwise you have double titles
            return ''
          } else {
            return `# ${formattedText}`
          }

        case paragraphTypes.h3:
          // This is strange case because It looks like a h3 but on medium it renders as an blockquote
          return `> ### ${formattedText}`

        case paragraphTypes.h4:
          return `#### ${formattedText}`

        case paragraphTypes.quote:
          return `> ${formattedText}`

        case paragraphTypes.codeBlock:
          return '```\n' + formattedText + '\n```'

        case paragraphTypes.onOrderedList:
          return `- ${formattedText}`

        case paragraphTypes.orderedList:
          return `- ${formattedText}`

        case paragraphTypes.image:
          return `![${formattedText}](https://cdn-images-1.medium.com/max/${metadata.originalWidth * 2}/${metadata.id})`

        case paragraphTypes.imageWithDescription:
          // do api call to look up mediaResourceType
          const { payload: { value: resource } } = await medium.getMediaResource(`https://medium.com/media/${mixtapeMetadata.mediaResourceId}?format=json`)
          const image = this.determineMediaEmbed(resource)
          return image

        case paragraphTypes.media:
          console.log(mixtapeMetadata);
          throw new Error(`Not Implemented Error paragraphType: ${paragraphTypes.media}`);
      }

      process.stdout.write(`${paragraph}\n`)
      throw new Error(`Unsupported type: ${type}`);
    })

    return await Promise.all(results)
  }


  private determineMediaEmbed(resource: any) {
    switch (resource.mediaResourceType) {
      case mediaTypes.MediaResourceMediumPost:
      case mediaTypes.MediaResourceExternalLink:
        if (resource.iframeSrc != '') {
          return this.formatIframe(resource)
        } else {
          return `
> [**${resource.title}**](${resource.href})
>
> <small>${resource.description}</small>
`
        }

      // NOTE: I have not come across this type yet, Will look into this post mvp
      case mediaTypes.MediaResourceTweet:
        console.log(resource);
        process.stdout.write(`${resource}\n`)
        throw new Error(`Not Implemented Error mediaTypes: ${mediaTypes.MediaResourceTweet}`);
    }

    process.stdout.write(`${resource}\n`)
    throw new Error(`Unsupported type: ${resource.mediaResourceType}`);
  }

  private formatIframe(resource: any) {
    return `<iframe
                allowfullscreen
                frameborder="0"
                src="${resource.iframeSrc}"
                width="${resource.iframeWidth}"
                height="${resource.iframeHeight}"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
    `
  }

  private getUserObject(references: any) {
    // References and the User, Collection, Social objects inside
    // are build using the following schema
    // references: {
    //   User: { // Or Collection, Social
    //      "<base64 string capped to 11 characters>" : {
    //        ...object
    //    }
    //   }
    // }

    const userReference = references['User']
    const userId = Object.keys(userReference)[0]
    return userReference[userId]
  }


  private createFrontmatter(value: any, references: any) {
    const { slug, title, firstPublishedAt, latestPublishedAt } = value
    const user = this.getUserObject(references)
    return `
---
Author: ${user.name}
Bio: ${user.bio}
Title: ${title}
Medium Author: https://medium.com/@${user.username}
Medium Article: ${slug}
Twitter: https://twitter.com/${user.twitterScreenName}
Article Published at: ${firstPublishedAt}
Article Updated at: ${latestPublishedAt}
---
`
  }

  private prettifyMarkdown(frontmatter: string, formattedParagraphs: any) {
    const results = prettier.format(
      [frontmatter]
        .concat(formattedParagraphs)
        .join('\n\n'),
      {
        parser: 'markdown'
      }
    )

    return results
  }
}