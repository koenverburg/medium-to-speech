import { paragraphTypes } from './Enums/paragraphTypes'
import { MediumHttpClient } from './client'
import { paragraphTypes } from './Enums/paragraphTypes'
import { mediaTypes } from './Enums/mediaTypes'

const medium = new MediumHttpClient()

export class Converter {
  contents: any
  constructor(contents: object) {
    this.contents = contents
  }

  public async convert() {
    const { value, references } = this.contents.payload;
    const { paragraphs, sections } = value.content.bodyModel;

    const frontmatter = this.createFrontmatter(value, references)
    const formattedParagraphs = await this.formatParagraphs(paragraphs)

    this.formatParagraphs(paragraphs);

    return ''
  }

  private async formatParagraphs(paragraphs: any) {
    const results = paragraphs.map(async (paragraph: any, index: number) => {
      const { text, type, iframe, metadata, mixtapeMetadata  } = paragraph;

      switch (type) {
        case paragraphTypes.paragraph:
            return text

        case paragraphTypes.h1:
            if (index === 0) { // ignore the first otherwise you have double titles
              return ''
            } else {
              return `# ${text}`
            }

        case paragraphTypes.h3:
          return `### ${text}`

        case paragraphTypes.h4:
          return `#### ${text}`

        case paragraphTypes.quote:
          return `> ${text}`

        case paragraphTypes.codeBlock:
          return '```\n' + text + '\n```'

        case paragraphTypes.onOrderedList:
          return `- ${text}`

        case paragraphTypes.orderedList:
          return `1. ${text}`

        case paragraphTypes.image:
          return `![${text}](https://cdn-images-1.medium.com/max/${metadata.originalWidth * 2}/${metadata.id})`

        case paragraphTypes.imageWithDescription:
          // do api call to look up mediaResourceType
          const { payload: { value: resource } } = await medium.getMediaResource(`https://medium.com/media/${mixtapeMetadata.mediaResourceId}?format=json`)
          const image = this.determineMediaEmbed(resource)
          return image

        case paragraphTypes.media:
          // do api call to look up mediaResourceType
          medium.getMediaResource(`https://medium.com/media/${iframe.mediaResourceId}?format=json`)
          return text
      }

      process.stdout.write(`${paragraph}\n`)
      throw new Error(`Unsupported type: ${type}`);
    })

    return await Promise.all(results)
  }


  private determineMediaEmbed(resource: any) {
    switch (resource.mediaResourceType) {
      case mediaTypes.MediaResourceExternalLink:
        return this.formatIframe(resource)

      case mediaTypes.MediaResourceTweet:
        return ''
        // const { html } = await medium.getTweetEmbed(`https://publish.twitter.com/oembed?url=${resource.href}`)
        // return html
      case mediaTypes.MediaResourceMediumPost:
        return ''
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


  private createFrontmatter(value: any, references: any) {
    const { slug, title, firstPublishedAt, latestPublishedAt } = value
    // References and the User, Collection, Social objects inside
    // are build using the following schema
    // references: {
    //   User: { // Or Collection, Social
    //      "<base64 string capped to 11 characters>" : {
    //        ...user object
    //    }
    //   }
    // }

    const userReference = references['User']
    const userId = Object.keys(userReference)[0]
    const user = userReference[userId]

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
}