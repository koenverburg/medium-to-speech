import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { FileMerge } from './Helpers/FileMerge'

export class Speech {
  public async ConvertToAudioFile(text: string, filenameChunk: string, filename: string) {
    const files = await this.createChunkedAudioFiles(text, filenameChunk)
    FileMerge.merge(files, filename)
    return Promise.resolve('ok')
  }

  private async createChunkedAudioFiles(text: string, filenameChunk: string): Promise<string[]> {
    const chunks = this.createTextChunks(text, 2000)

    console.log('Speech: Writing wav file...')

    return await Promise.all(chunks.map(async (chunk: string, index: number) =>
      this.synthesizePerChunk(filenameChunk.replace('{index}', index.toString()), chunk)
    ))
  }

  private synthesizePerChunk(filename: string, textChunk: string): Promise<string> {
    // We can't write directly to a file so we need to write to it from a stream
    const pullStream = sdk.AudioOutputStream.createPullStream()

    // @ts-ignore
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_SERVICE_KEY, process.env.AZURE_REGION)
    speechConfig.speechRecognitionLanguage = 'en-US'

    const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream)
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

    // create a logger to create nice-er looking logs
    // synthesizer.synthesisStarted = function (s, e) {
    //   console.log("(synthesis started)")
    // }

    // synthesizer.synthesizing = function (s, e) {
    //   var str = "(synthesizing) Reason: " + sdk.ResultReason[e.result.reason] + " Audio chunk length: " + e.result.audioData.byteLength;
    //   console.log(str)
    // }

    // synthesizer.synthesisCompleted = function (s, e) {
    //   console.log("(synthesized) Reason: " + sdk.ResultReason[e.result.reason] + " Audio length: " + e.result.audioData.byteLength)
    // }

    // synthesizer.SynthesisCanceled = function (s, e) {
    //   var cancellationDetails = sdk.CancellationDetails.fromResult(e.result)
    //   var str = "(cancel) Reason: " + sdk.CancellationReason[cancellationDetails.reason]

    //   if (cancellationDetails.reason === sdk.CancellationReason.Error) {
    //     str += ": " + e.result.errorDetails
    //   }
    //   console.log(str)
    // }

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        textChunk,
        (r: any) => {
          console.log(`SpeechSynthesizer Response ${r.privResultId}`)
          resolve(filename)
          synthesizer.close()
        },
        (e) => {
          console.log(e)
          synthesizer.close()
          reject(e)
        },
        filename
      )
    })
  }

  private createTextChunks(text: string, chunkCharacterLimit: number) {
    const chunks: string[] = []

    console.log(`speech: text character count is ${text.length}`);
    console.log(`speech: text chunks is split up in ${Math.ceil(text.length / chunkCharacterLimit)} (${text.length / chunkCharacterLimit}) chunks`)

    for (var i = 0; Math.ceil(text.length / chunkCharacterLimit); i++) {
      let fromIndex = i === 0 ? 0 : chunkCharacterLimit * i
      let toIndex   = i === 0 ? chunkCharacterLimit : chunkCharacterLimit * (i + 1)

      let chunkedText = text.substring(fromIndex, toIndex)

      chunks.push(chunkedText)

      if (chunkedText.length < chunkCharacterLimit) {
        break
      }
    }

    return chunks
  }
}