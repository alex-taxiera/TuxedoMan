export type JobFunction<T> = (...args: any[]) => Promise<T> // eslint-disable-line @typescript-eslint/no-explicit-any
export interface JobResult<T> {
  id: number
  priority?: number
  data: T
}
export interface Job<T = any> {
  id: number
  priority?: number
  handlePromise: {
    resolve: (value: JobResult<T> | PromiseLike<JobResult<T>>) => void
    reject: (reason?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  job: JobFunction<T>
}
export type JobList = Job[]
export type PriorityJobList = JobList[]

abstract class AbstractJobQueue {

  protected totalJobs: number = 0

  protected currentJob?: Job

  protected abstract queue: JobList | PriorityJobList

  protected abstract getNextJob (): Job | undefined

  public abstract get length (): number

  public abstract push<T> (job: JobFunction<T>): Promise<JobResult<T>>

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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

export class JobQueue extends AbstractJobQueue {

  protected queue: JobList = []

  public get length (): number {
    return this.queue.length
  }

  public async push<T> (job: JobFunction<T>): Promise<JobResult<T>> {
    return await new Promise<JobResult<T>>((resolve, reject) => {
      this.queue.push({
        id: ++this.totalJobs, job, handlePromise: { resolve, reject },
      })

      this.run()
    })
  }

  protected getNextJob (): Job | undefined {
    return this.queue.shift()
  }

}

export class PriorityJobQueue extends AbstractJobQueue {

  protected queue: PriorityJobList

  constructor (levels: number) {
    super()
    this.queue = Array.from({ length: levels }, () => [])
  }

  public get length (): number {
    return this.queue.reduce((ax, dx) => ax + dx.length, 0)
  }

  protected getNextJob (): Job | undefined {
    for (let i = this.queue.length; i > 0;) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const queue = this.queue[--i]!
      if (queue.length > 0) {
        return queue.shift()
      }
    }
  }

  public async push<T> (
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
