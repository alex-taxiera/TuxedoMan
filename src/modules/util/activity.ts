import {
  Activity
} from 'eris'

export const activitiesAreEqual = (
  activitiesA: Array<Activity>,
  activitiesB: Array<Activity>
): boolean => {
  return activitiesA.length === activitiesB.length &&
    activitiesA.every(({
      created_at: newCreatedAt,
      name: newName
    }, i) => {
      const {
        created_at: oldCreatedAt,
        name: oldName
      } = activitiesB[i]

      return newName === oldName && newCreatedAt === oldCreatedAt
    })
}
