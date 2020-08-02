export class ErrorHandler {
  public static promiseFailure(message: string) {
    process.stdout.write(`${message}\n`)
  }
}