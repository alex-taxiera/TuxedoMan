export type JobFunction<T> = (...args: any[]) => Promise<T> // eslint-disable-line @typescript-eslint/no-explicit-any
export interface JobResult<T> {
  id: number
  priority?: number
  data: T
}
export interface Job<T> {
  id: number
  priority?: number
  handlePromise: {
    resolve: (value: JobResult<T> | PromiseLike<JobResult<T>>) => void
    reject: (reason?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  job: JobFunction<T>
}
export type JobList<T> = Array<Job<T>>
export type PriorityJobList<T> = Array<JobList<T>>

abstract class AbstractJobQueue<T> {

  protected totalJobs: number = 0

  protected currentJob?: Job<T>

  protected abstract queue: JobList<T> | PriorityJobList<T>

  protected abstract getNextJob (): Job<T> | undefined

  public abstract get length (): number

  public abstract push (job: JobFunction<T>): Promise<JobResult<T>>

  protected run (): void {
    setTimeout(() => {
      if (this.currentJob != null || this.length <= 0) {
        return
      }

      this.currentJob = this.getNextJob()

      if (!this.currentJob) {
        return
      }

      const {
        id, job, priority, handlePromise,
      } = this.currentJob

      job()
        .then((data) => handlePromise.resolve({
          id, priority, data,
        }))
        .catch((error: Error) => handlePromise.reject({
          id, priority, error,
        }))
        .finally(() => {
          this.currentJob = undefined
          this.run()
        })
    }, 100)
  }

}

export class JobQueue<T> extends AbstractJobQueue<T> {

  protected queue: JobList<T> = []

  public get length (): number {
    return this.queue.length
  }

  public async push (job: JobFunction<T>): Promise<JobResult<T>> {
    return await new Promise<JobResult<T>>((resolve, reject) => {
      this.queue.push({
        id: ++this.totalJobs, job, handlePromise: { resolve, reject },
      })

      this.run()
    })
  }

  protected getNextJob (): Job<T> | undefined {
    return this.queue.shift()
  }

}

export class PriorityJobQueue<T> extends AbstractJobQueue<T> {

  protected queue: PriorityJobList<T>

  constructor (levels: number) {
    super()
    this.queue = Array.from({ length: levels }, () => [])
  }

  public get length (): number {
    return this.queue.reduce((ax, dx) => ax + dx.length, 0)
  }

  protected getNextJob (): Job<T> | undefined {
    for (let i = this.queue.length; i > 0;) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const queue = this.queue[--i]!
      if (queue.length > 0) {
        return queue.shift()
      }
    }
  }

  public async push (
    job: JobFunction<T>,
    priority: number = 1,
  ): Promise<JobResult<T>> {
    return await new Promise<JobResult<T>>((resolve, reject) => {
      const queue = this.queue[priority - 1]

      if (!queue) {
        return reject(RangeError(
          `PRIORITY OUT OF RANGE - EXPECTED VALUE FROM 1 TO ${
            this.queue.length
          }`,
        ))
      }

      queue.push({
        id: ++this.totalJobs, job, priority, handlePromise: { resolve, reject },
      })

      this.run()
    })
  }

}
