export type JobFunction<T> = (...args: Array<any>) => Promise<T> // eslint-disable-line @typescript-eslint/no-explicit-any
export type JobResult<T> = {
  id: number
  data: T
}
export type Job<T> = {
  id: number
  handlePromise: {
    resolve: (value?: JobResult<T> | PromiseLike<JobResult<T>>) => void
    reject: (reason?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  job: JobFunction<T>
}
export type JobList<T> = Array<Job<T>>

export class JobQueue<T> {

  protected queue: JobList<T> = []
  protected totalJobs: number = 0;
  protected currentJob?: Job<T>

  public get length (): number {
    return this.queue.length
  }

  public push (job: JobFunction<T>): Promise<JobResult<T>> {
    return new Promise<JobResult<T>>((resolve, reject) => {
      const id = ++this.totalJobs
      this.queue.push({
        id,
        job,
        handlePromise: { resolve, reject },
      })

      this.run()
    })
  }

  protected getNextJob (): Job<T> | undefined {
    return this.queue.shift()
  }

  protected run (): void {
    setTimeout(() => {
      if (this.currentJob || this.length <= 0) {
        return
      }

      this.currentJob = this.getNextJob()

      if (!this.currentJob) {
        return
      }

      const {
        id,
        job,
        handlePromise,
      } = this.currentJob

      job()
        .then((data) => handlePromise.resolve({
          id, data,
        }))
        .catch((error: Error) => handlePromise.reject({
          id,
          error,
        }))
        .finally(() => {
          this.currentJob = undefined
          this.run()
        })
    }, 100)
  }

}
